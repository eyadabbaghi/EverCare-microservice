import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordRequestDto {
  @IsNotEmpty()
  currentPassword: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
