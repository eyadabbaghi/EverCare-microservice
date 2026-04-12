import { UserRole } from '../schemas/user-role.enum';
import { MedicalRecordSummaryDto } from './medical-record-summary.dto';

export class UserDto {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isVerified: boolean;
  createdAt: Date;

  // Common profile fields
  dateOfBirth?: Date;
  emergencyContact?: string;
  profilePicture?: string;

  // Doctor fields
  yearsExperience?: number;
  specialization?: string;
  medicalLicense?: string;
  workplaceType?: string;
  workplaceName?: string;
  doctorEmail?: string;

  // Relationship fields
  caregiverEmails?: string[]; // for patient
  patientEmails?: string[]; // for caregiver

  medicalRecord?: MedicalRecordSummaryDto;
}
