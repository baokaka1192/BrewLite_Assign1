import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthUser } from './auth-user';
import { GoogleIdentity, GoogleTokenVerifier } from './google-token-verifier';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 10;
const INVALID_CREDENTIALS = 'Invalid email or password';
const EMAIL_TAKEN = 'Email already registered';
const INVALID_GOOGLE_TOKEN = 'Invalid Google token';
const GOOGLE_EMAIL_UNVERIFIED = 'Google email is not verified';
// Compared against when the email is unknown so both login failure paths do similar work.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_ROUNDS);

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  loyaltyPoints: number;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    loyaltyPoints: user.loyaltyPoints,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly googleVerifier: GoogleTokenVerifier,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = normalizeEmail(dto.email);
    if (await this.users.findByEmail(email)) {
      throw new ConflictException(EMAIL_TAKEN);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    let user: User;
    try {
      user = await this.users.create({ email, passwordHash, name: dto.name });
    } catch (err) {
      // Lost a race with a concurrent register for the same email.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(EMAIL_TAKEN);
      }
      throw err;
    }
    return this.issueToken(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(normalizeEmail(dto.email));
    const matches = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    // Google-only accounts have no passwordHash and can never pass this check.
    // bcrypt truncates at 72 bytes; a longer input must never authenticate as its prefix.
    if (!user || !user.passwordHash || !matches || Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    return this.issueToken(user);
  }

  async loginWithGoogle(dto: GoogleLoginDto): Promise<AuthResponse> {
    const clientId = this.config.get<string>('googleClientId');
    if (!clientId) {
      throw new NotFoundException();
    }
    const identity = await this.googleVerifier.verify(dto.idToken, clientId);
    if (!identity) {
      throw new UnauthorizedException(INVALID_GOOGLE_TOKEN);
    }
    if (!identity.emailVerified) {
      throw new UnauthorizedException(GOOGLE_EMAIL_UNVERIFIED);
    }

    let user: User;
    try {
      user = await this.findOrCreateGoogleUser(identity);
    } catch (err) {
      // Lost a race with a concurrent first login for the same account: the row now exists, so look it up again.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        user = await this.findOrCreateGoogleUser(identity);
      } else {
        throw err;
      }
    }
    return this.issueToken(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return toPublicUser(user);
  }

  private async findOrCreateGoogleUser(identity: GoogleIdentity): Promise<User> {
    const byGoogleId = await this.users.findByGoogleId(identity.googleId);
    if (byGoogleId) {
      return byGoogleId;
    }

    const email = normalizeEmail(identity.email);
    const byEmail = await this.users.findByEmail(email);
    if (byEmail) {
      // Refuse to re-link an account that is already bound to a different Google identity.
      if (byEmail.googleId && byEmail.googleId !== identity.googleId) {
        throw new UnauthorizedException(INVALID_GOOGLE_TOKEN);
      }
      return byEmail.googleId ? byEmail : this.users.linkGoogleId(byEmail.id, identity.googleId);
    }

    return this.users.create({ email, name: identity.name, googleId: identity.googleId });
  }

  private async issueToken(user: User): Promise<AuthResponse> {
    const payload: Omit<AuthUser, 'id'> & { sub: string } = { sub: user.id, email: user.email };
    return {
      user: toPublicUser(user),
      accessToken: await this.jwt.signAsync(payload),
    };
  }
}
