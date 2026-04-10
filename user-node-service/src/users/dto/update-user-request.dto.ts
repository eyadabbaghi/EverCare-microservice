import {
  IsEmail,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class UpdateUserRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  // Doctor fields
  @IsOptional()
  @IsNumber()
  yearsExperience?: number;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  medicalLicense?: string;

  @IsOptional()
  @IsString()
  workplaceType?: string;

  @IsOptional()
  @IsString()
  workplaceName?: string;

  @IsOptional()
  @IsString()
  connectedEmail?: string;

  @IsOptional()
  @IsString()
  doctorEmail?: string;
}
