import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../schemas/user-role.enum';

export class UpdateUserByAdminDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
