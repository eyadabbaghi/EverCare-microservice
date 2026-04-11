import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { RegisterRequestDto } from '../users/dto/register-request.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import type { AuthenticatedUser } from './strategies/jwt.strategy'; // Use import type

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerRequest: RegisterRequestDto,
  ): Promise<{ message: string }> {
    await this.authService.register(registerRequest);
    return { message: 'User registered successfully' };
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(): { message: string; loginUrl: string } {
    // In a real Keycloak setup, login is handled by Keycloak directly
    return {
      message: 'Please use Keycloak login page',
      loginUrl: `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth`,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser): Promise<any> {
    return this.authService.getCurrentUser(user.email);
  }
}
