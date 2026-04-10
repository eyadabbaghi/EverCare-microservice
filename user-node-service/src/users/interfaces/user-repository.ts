import { User, UserDocument } from '../schemas/user.schema';
import { UserRole } from '../schemas/user-role.enum';
export interface IUserRepository {
  create(userData: Partial<User>): Promise<UserDocument>;
  findByEmail(email: string): Promise<UserDocument | null>;
  findByKeycloakId(keycloakId: string): Promise<UserDocument | null>;
  findById(userId: string): Promise<UserDocument | null>;
  existsByEmail(email: string): Promise<boolean>;
  searchByRoleAndQuery(query: string, role: UserRole): Promise<UserDocument[]>;
  findAll(): Promise<UserDocument[]>;
  save(user: UserDocument): Promise<UserDocument>;
  delete(user: UserDocument): Promise<void>;
  updateMany(filter: any, update: any): Promise<any>;
}
