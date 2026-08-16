import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('guest')
  guestLogin() {
    return {
      accessToken: this.authService.createGuestToken(),
      user: {
        id: 'guest-user',
        name: 'Guest User',
        role: 'guest',
      },
    };
  }

  @Post('google')
  async googleLogin(@Body('credential') credential: string) {
    const user = await this.authService.verifyGoogleToken(credential);

    return {
      accessToken: this.authService.createGoogleToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
      },
    };
  }
}
