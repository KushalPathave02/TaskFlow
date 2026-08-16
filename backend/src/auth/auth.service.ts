import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly secret = process.env.JWT_SECRET || 'task-management-secret';
  private readonly googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  createGuestToken(): string {
    return jwt.sign({ sub: 'guest-user', role: 'guest' }, this.secret, {
      expiresIn: '7d',
    });
  }

  createGoogleToken(user: { sub: string; email: string; name: string; role: string }): string {
    return jwt.sign({ sub: user.sub, email: user.email, name: user.name, role: user.role }, this.secret, {
      expiresIn: '7d',
    });
  }

  async verifyGoogleToken(credential: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google user payload');
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || '',
      role: 'google',
    };
  }

  verifyToken(token: string) {
    return jwt.verify(token, this.secret) as { sub: string; role: string };
  }
}
