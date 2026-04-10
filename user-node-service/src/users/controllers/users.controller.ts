import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpCode,
  Logger,
  UseGuards,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from '../services/users.service';
import { FileUploadService } from '../services/file-upload.service';
import { UpdateUserRequestDto } from '../dto/update-user-request.dto';
import { ChangePasswordRequestDto } from '../dto/change-password-request';
import { UserRole } from '../schemas/user-role.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'user-node-service' };
  }

  @Public()
  @Get('external/:userId')
  async getUserByIdExternal(@Param('userId') userId: string) {
    const user = await this.userService.findByUserId(userId);
    if (!user) {
      return null;
    }
    return this.userService.mapToUserDto(user);
  }

  @Public()
  @Get('external/email/:email')
  async getUserByEmailExternal(@Param('email') email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return null;
    }
    return this.userService.mapToUserDto(user);
  }

  @Public()
  @Get('external/role/:role')
  async getUsersByRoleExternal(@Param('role') role: UserRole) {
    const users = await this.userService.findByRole(role);
    const userDtos = await Promise.all(
      users.map((user) => this.userService.mapToUserDto(user)),
    );
    return userDtos;
  }

  @Public()
  @Get(':userId/patients')
  async getPatientsByCaregiverId(@Param('userId') userId: string) {
    return this.userService.getPatientsByCaregiverId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('patients')
  async getPatientsForDoctor(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getPatientsForDoctor(user.email);
  }

  @Public()
  @Get('all')
  async getAllUsers() {
    return this.userService.getAllUserDtos();
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Body() updateRequest: UpdateUserRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updatedUser = await this.userService.updateUser(
      user.email,
      updateRequest,
    );
    const userDto = await this.userService.mapToUserDto(updatedUser);

    return {
      user: userDto,
      message: 'Profile updated successfully',
    };
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordRequest: ChangePasswordRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.userService.changePassword(user.email, changePasswordRequest);

    return {
      message: 'Password changed successfully',
    };
  }

  @Delete('profile')
  async deleteAccount(@CurrentUser() user: AuthenticatedUser) {
    await this.userService.deleteUser(user.email);

    return {
      message: 'Account deleted successfully',
    };
  }

  @Post('profile/picture')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('File is empty');
    }

    const fileUrl = this.fileUploadService.uploadProfilePicture(
      file,
      user.userId,
    );

    await this.userService.updateUser(user.email, { profilePicture: fileUrl });

    return {
      profilePicture: fileUrl,
      message: 'Profile picture uploaded successfully',
    };
  }

  @Delete('profile/picture')
  async removeProfilePicture(@CurrentUser() user: AuthenticatedUser) {
    const userDoc = await this.userService.findByEmail(user.email);

    if (userDoc.profilePicture) {
      this.fileUploadService.deleteProfilePicture(userDoc.profilePicture);
    }

    await this.userService.updateUser(user.email, {
      profilePicture: undefined,
    });

    return {
      message: 'Profile picture removed successfully',
    };
  }

  @Get('search')
  async searchUsers(@Query('q') query: string, @Query('role') role: UserRole) {
    if (!role) {
      throw new BadRequestException('Role is required');
    }

    const users = await this.userService.searchUsersByRole(query || '', role);
    const userDtos = await Promise.all(
      users.map((user) => this.userService.mapToUserDto(user)),
    );

    return userDtos;
  }

  @Public()
  @Get('by-email')
  async getUserByEmail(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.userService.findByEmail(email);
    return this.userService.mapToUserDto(user);
  }

  @Public()
  @Get(':userId')
  async getUserById(@Param('userId') userId: string) {
    return this.userService.getUserDtoById(userId);
  }

  @Get('profile')
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getUserDtoByEmail(user.email);
  }
}
