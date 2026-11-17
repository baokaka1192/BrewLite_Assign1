import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleIdentity {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

/**
 * Verifies a Google ID token. Returns null when the token is invalid or was not issued for `audience`.
 * Tests replace this provider so no network call to Google is made.
 */
export abstract class GoogleTokenVerifier {
  abstract verify(idToken: string, audience: string): Promise<GoogleIdentity | null>;
}

@Injectable()
export class OAuth2GoogleTokenVerifier extends GoogleTokenVerifier {
  private readonly client = new OAuth2Client();

  async verify(idToken: string, audience: string): Promise<GoogleIdentity | null> {
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) {
        return null;
      }
      return {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified === true,
        name: payload.name,
      };
    } catch {
      return null;
    }
  }
}
