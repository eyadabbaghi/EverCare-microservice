import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../../users/services/users.service';
import { RegisterRequestDto } from '../../users/dto/register-request.dto';
import { UserDto } from '../../users/dto/user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly userService: UserService) {}

  async register(registerRequest: RegisterRequestDto): Promise<void> {
    await this.userService.register(registerRequest);
  }

  async getCurrentUser(email: string): Promise<UserDto> {
    return this.userService.getUserDtoByEmail(email);
  }

}
