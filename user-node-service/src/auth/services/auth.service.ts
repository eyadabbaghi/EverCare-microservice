import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from '../../users/services/users.service';
import { RegisterRequestDto } from '../../users/dto/register-request.dto';
import { UserDto } from '../../users/dto/user.dto';
import { KeycloakAdminService } from '../../keycloak/keycloak-admin.service';
import { LoginRequestDto } from '../dto/login-request.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly keycloakAdminService: KeycloakAdminService,
  ) {}

  async register(registerRequest: RegisterRequestDto): Promise<void> {
    await this.userService.register(registerRequest);
  }

  async login(loginRequest: LoginRequestDto): Promise<{ access_token: string; expires_in: number }> {
    // Validate credentials via Keycloak admin API
    return this.keycloakAdminService.validateCredentials(loginRequest.email, loginRequest.password);
  }

  async getCurrentUser(email: string): Promise<UserDto> {
    return this.userService.getUserDtoByEmail(email);
  }

}
