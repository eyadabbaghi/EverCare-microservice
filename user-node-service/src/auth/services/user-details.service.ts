import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../../users/services/users.service';

@Injectable()
export class UserDetailsService {
  constructor(private readonly usersService: UserService) {}

  async loadUserByEmail(email: string) {
    try {
      const user = await this.usersService.findByEmail(email);

      return {
        userId: user.userId,
        email: user.email,
        role: user.role,
        keycloakId: user.keycloakId,
        authorities: [`ROLE_${user.role}`],
      };
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException(`User not found: ${email}`);
    }
  }
}
