import { UserRole } from '../schemas/user-role.enum';

export class UserAdminDto {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isVerified: boolean;
  createdAt: Date;
  profilePicture?: string;
}
