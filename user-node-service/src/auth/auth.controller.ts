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
import { LoginRequestDto } from './dto/login-request.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerRequest: RegisterRequestDto,
  ): Promise<{ message: string }> {
    await this.authService.register(registerRequest);
    return { message: 'User registered successfully' };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginRequest: LoginRequestDto,
  ): Promise<{ access_token: string; expires_in: number }> {
    return this.authService.login(loginRequest);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser): Promise<any> {
    return this.authService.getCurrentUser(user.email);
  }
}
