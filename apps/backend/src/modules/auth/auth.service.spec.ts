import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { GoogleTokenVerifier } from './google-token-verifier';

jest.mock('bcrypt', () => ({
  hashSync: jest.fn(() => 'dummy-hash'),
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockedBcrypt = bcrypt as unknown as {
  hash: jest.Mock;
  compare: jest.Mock;
};

const storedUser = {
  id: 'u1',
  email: 'an@example.com',
  passwordHash: 'stored-hash',
  name: 'An',
  loyaltyPoints: 3,
};

describe('AuthService', () => {
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock } };
  let jwt: { signAsync: jest.Mock };
  let config: { get: jest.Mock };
  let verifier: { verify: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn(), update: jest.fn() },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') };
    config = { get: jest.fn().mockReturnValue('test-client-id.apps.googleusercontent.com') };
    verifier = { verify: jest.fn() };
    service = new AuthService(
      new UsersService(prisma as unknown as PrismaService),
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      verifier as unknown as GoogleTokenVerifier,
    );
  });

  describe('register', () => {
    it('hashes the password with bcrypt and stores a normalized email', async () => {
      mockedBcrypt.hash.mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({ ...storedUser, passwordHash: 'hashed' });

      const res = await service.register({ email: '  An@Example.COM ', password: 'secret123', name: 'An' });

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('secret123', 10);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'an@example.com' } });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'an@example.com', passwordHash: 'hashed', name: 'An' },
      });
      expect(res.accessToken).toBe('signed-token');
    });

    it('never returns the password hash', async () => {
      mockedBcrypt.hash.mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({ ...storedUser, passwordHash: 'hashed' });

      const res = await service.register({ email: 'an@example.com', password: 'secret123' });

      expect(res.user).toEqual({ id: 'u1', email: 'an@example.com', name: 'An', loyaltyPoints: 3 });
      expect(JSON.stringify(res)).not.toContain('hashed');
    });

    it('signs a token with the user id as subject', async () => {
      mockedBcrypt.hash.mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({ ...storedUser, passwordHash: 'hashed' });

      await service.register({ email: 'an@example.com', password: 'secret123' });

      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'u1', email: 'an@example.com' });
    });

    it('throws 409 when the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue(storedUser);

      await expect(service.register({ email: 'an@example.com', password: 'secret123' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('maps a unique-constraint race to 409', async () => {
      mockedBcrypt.hash.mockResolvedValue('hashed');
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.register({ email: 'an@example.com', password: 'secret123' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it.each(['a'.repeat(72), 'é'.repeat(36)])('rejects a suffix beyond the 72-byte bcrypt limit (%#)', async (password) => {
      const realBcrypt = jest.requireActual<typeof bcrypt>('bcrypt');
      prisma.user.findUnique.mockResolvedValue({ ...storedUser, passwordHash: await realBcrypt.hash(password, 4) });
      mockedBcrypt.compare.mockImplementationOnce(realBcrypt.compare);

      await expect(service.login({ email: storedUser.email, password: `${password}x` })).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });

    it('returns the user and a token when the password matches', async () => {
      prisma.user.findUnique.mockResolvedValue(storedUser);
      mockedBcrypt.compare.mockResolvedValue(true);

      const res = await service.login({ email: 'AN@example.com', password: 'secret123' });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'an@example.com' } });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('secret123', 'stored-hash');
      expect(res.accessToken).toBe('signed-token');
      expect(res.user.id).toBe('u1');
    });

    it('throws a generic 401 when the password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(storedUser);
      mockedBcrypt.compare.mockResolvedValue(false);

      await expect(service.login({ email: 'an@example.com', password: 'wrong-pass' })).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
    });

    it('throws the same generic 401 for an unknown email and still runs a bcrypt compare', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.compare.mockResolvedValue(false);

      await expect(service.login({ email: 'nobody@example.com', password: 'secret123' })).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
      expect(mockedBcrypt.compare).toHaveBeenCalledTimes(1);
    });
  });

  describe('loginWithGoogle', () => {
    const identity = {
      googleId: 'g-123',
      email: 'an@example.com',
      emailVerified: true,
      name: 'An',
    };
    const googleUser = { ...storedUser, passwordHash: null, googleId: 'g-123' };

    it('creates a password-less user for a new Google identity', async () => {
      verifier.verify.mockResolvedValue({ ...identity, email: 'An@Example.COM' });
      prisma.user.create.mockResolvedValue(googleUser);

      const res = await service.loginWithGoogle({ idToken: 'id-token' });

      expect(verifier.verify).toHaveBeenCalledWith('id-token', 'test-client-id.apps.googleusercontent.com');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'an@example.com', name: 'An', passwordHash: null, googleId: 'g-123' },
      });
      expect(res.accessToken).toBe('signed-token');
      expect(res.user.id).toBe('u1');
    });

    it('logs in the user already bound to the Google id without writing', async () => {
      verifier.verify.mockResolvedValue(identity);
      prisma.user.findUnique.mockResolvedValueOnce(googleUser);

      const res = await service.loginWithGoogle({ idToken: 'id-token' });

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(res.user.id).toBe('u1');
    });

    it('links the Google id to an existing account with the same email', async () => {
      verifier.verify.mockResolvedValue(identity);
      prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(storedUser);
      prisma.user.update.mockResolvedValue({ ...storedUser, googleId: 'g-123' });

      const res = await service.loginWithGoogle({ idToken: 'id-token' });

      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { googleId: 'g-123' } });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(res.user.id).toBe('u1');
    });

    it('rejects a Google identity that does not match the account already linked to that email', async () => {
      verifier.verify.mockResolvedValue(identity);
      prisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...storedUser, googleId: 'g-other' });

      await expect(service.loginWithGoogle({ idToken: 'id-token' })).rejects.toThrow(
        new UnauthorizedException('Invalid Google token'),
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects an unverified Google email with 401', async () => {
      verifier.verify.mockResolvedValue({ ...identity, emailVerified: false });

      await expect(service.loginWithGoogle({ idToken: 'id-token' })).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('rejects an invalid token with 401', async () => {
      verifier.verify.mockResolvedValue(null);

      await expect(service.loginWithGoogle({ idToken: 'bogus' })).rejects.toThrow(
        new UnauthorizedException('Invalid Google token'),
      );
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns 404 when GOOGLE_CLIENT_ID is not configured', async () => {
      config.get.mockReturnValue('');

      await expect(service.loginWithGoogle({ idToken: 'id-token' })).rejects.toBeInstanceOf(NotFoundException);
      expect(verifier.verify).not.toHaveBeenCalled();
    });

    it('retries the lookup when a concurrent first login wins the unique constraint', async () => {
      verifier.verify.mockResolvedValue(identity);
      prisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(googleUser);
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      const res = await service.loginWithGoogle({ idToken: 'id-token' });

      expect(res.user.id).toBe('u1');
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(3);
    });
  });

  describe('login with a Google-only account', () => {
    it('rejects a password login even if bcrypt reports a match', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...storedUser, passwordHash: null, googleId: 'g-123' });
      mockedBcrypt.compare.mockResolvedValue(true);

      await expect(service.login({ email: 'an@example.com', password: 'secret123' })).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('secret123', 'dummy-hash');
    });
  });

  describe('me', () => {
    it('returns the public profile of the user', async () => {
      prisma.user.findUnique.mockResolvedValue(storedUser);

      await expect(service.me('u1')).resolves.toEqual({
        id: 'u1',
        email: 'an@example.com',
        name: 'An',
        loyaltyPoints: 3,
      });
    });

    it('throws 401 when the token subject no longer exists', async () => {
      await expect(service.me('ghost')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
