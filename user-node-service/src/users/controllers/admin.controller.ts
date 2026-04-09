import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/users.service';
import { UpdateUserByAdminDto } from '../dto/update-user-by-admin.dto';
import { UserRole } from '../schemas/user-role.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Only ADMIN can access these endpoints
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly userService: UserService) {}

  @Get('users')
  async getAllUsers() {
    const users = await this.userService.getAllUsers();
    return users.map((user) => this.userService.mapToUserAdminDto(user));
  }

  @Get('users/:userId')
  async getUserById(@Param('userId') userId: string) {
    const user = await this.userService.findById(userId);
    return this.userService.mapToUserAdminDto(user);
  }

  @Put('users/:userId')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateRequest: UpdateUserByAdminDto,
  ) {
    const user = await this.userService.updateUserByAdmin(
      userId,
      updateRequest,
    );
    return this.userService.mapToUserAdminDto(user);
  }

  @Delete('users/:userId')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('userId') userId: string) {
    await this.userService.deleteUserById(userId);

    return {
      message: 'User deleted successfully',
    };
  }

  @Get('users/role/:role')
  async getUsersByRole(@Param('role') role: UserRole) {
    const users = await this.userService.getAllUsers();
    const filteredUsers = users.filter((user) => user.role === role);
    const userDtos = filteredUsers.map((user) =>
      this.userService.mapToUserAdminDto(user),
    );

    return {
      data: userDtos,
      message: `Users with role ${role} retrieved successfully`,
    };
  }

  @Get('users/stats/summary')
  async getUserStats() {
    const users = await this.userService.getAllUsers();

    const stats = {
      total: users.length,
      byRole: {
        PATIENT: users.filter((u) => u.role === UserRole.PATIENT).length,
        CAREGIVER: users.filter((u) => u.role === UserRole.CAREGIVER).length,
        DOCTOR: users.filter((u) => u.role === UserRole.DOCTOR).length,
        ADMIN: users.filter((u) => u.role === UserRole.ADMIN).length,
      },
      verified: users.filter((u) => u.isVerified).length,
      unverified: users.filter((u) => !u.isVerified).length,
    };

    return {
      data: stats,
      message: 'User statistics retrieved successfully',
    };
  }
}
