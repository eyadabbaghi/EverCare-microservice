import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserDocument } from '../schemas/user.schema';
import { UserRole } from '../schemas/user-role.enum';
import { UserRepository } from '../repositories/user.repository';
import { KeycloakAdminService } from '../../keycloak/keycloak-admin.service';
import { RegisterRequestDto } from '../dto/register-request.dto';
import { UpdateUserRequestDto } from '../dto/update-user-request.dto';
import { ChangePasswordRequestDto } from '../dto/change-password-request';
import { UpdateUserByAdminDto } from '../dto/update-user-by-admin.dto';
import { UserDto } from '../dto/user.dto';
import { UserAdminDto } from '../dto/user-admin.dto';
import { MedicalRecordSummaryDto } from '../dto/medical-record-summary.dto';
import { MedicalRecordEvent } from '../interfaces/medical-record-event.interface';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly keycloakAdminService: KeycloakAdminService,
  ) {}

  // === Registration ===
  async register(request: RegisterRequestDto): Promise<void> {
    const exists = await this.userRepository.existsByEmail(request.email);
    if (exists) {
      throw new BadRequestException('Email already exists');
    }

    try {
      // Create user in Keycloak
      const keycloakId = await this.keycloakAdminService.createUser(request);

      // Create local user
      const user = await this.userRepository.create({
        keycloakId,
        name: request.name,
        email: request.email,
        role: request.role,
        isVerified: true,
      });

      this.logger.log(`User registered successfully: ${user.email}`);
    } catch (error) {
      this.logger.error('Registration failed', error);
      throw error;
    }
  }

  // === Find methods ===
  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async findById(userId: string): Promise<UserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async findByUserId(userId: string): Promise<UserDocument | null> {
    return this.userRepository.findById(userId);
  }

  async findByRole(role: UserRole): Promise<UserDocument[]> {
    return this.userRepository.findByRole(role);
  }

  async findByKeycloakId(keycloakId: string): Promise<UserDocument | null> {
    return this.userRepository.findByKeycloakId(keycloakId);
  }

  // === Create user from Keycloak token (for auto-creation on first login) ===
  async createFromKeycloak(payload: {
    sub?: string;
    email?: string;
    preferred_username?: string;
    given_name?: string;
    family_name?: string;
    realm_access?: { roles: string[] };
  }): Promise<UserDocument> {
    const email = payload.email || payload.preferred_username;

    if (!email) {
      throw new BadRequestException(
        'Email is required to create user from Keycloak',
      );
    }

    // Check if user already exists
    const existingUser = await this.userRepository
      .findByEmail(email)
      .catch(() => null);
    if (existingUser) {
      return existingUser;
    }

    // Determine role from Keycloak token roles
    const keycloakRoles = payload.realm_access?.roles || [];
    const role = this.mapKeycloakRoleToUserRole(keycloakRoles);

    // Create name from Keycloak token
    const firstName = payload.given_name || '';
    const lastName = payload.family_name || '';
    const name =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : firstName || email.split('@')[0];

    // Create user in MongoDB
    const user = await this.userRepository.create({
      keycloakId: payload.sub,
      name,
      email,
      role,
      isVerified: true,
    });

    this.logger.log(`User auto-created from Keycloak: ${user.email}`);
    return user;
  }

  // Map Keycloak roles to UserRole enum
  private mapKeycloakRoleToUserRole(keycloakRoles: string[]): UserRole {
    const normalizedRoles = keycloakRoles.map((r) => r.toLowerCase());

    if (normalizedRoles.includes('admin')) return UserRole.ADMIN;
    if (normalizedRoles.includes('doctor')) return UserRole.DOCTOR;
    if (normalizedRoles.includes('caregiver')) return UserRole.CAREGIVER;
    if (normalizedRoles.includes('patient')) return UserRole.PATIENT;

    return UserRole.PATIENT; // Default role
  }

  async getUserDtoByEmail(email: string): Promise<UserDto> {
    const user = await this.findByEmail(email);
    return this.mapToUserDto(user);
  }

  // === Update methods ===
  async updateUser(
    email: string,
    request: UpdateUserRequestDto,
  ): Promise<UserDocument> {
    const user = await this.findByEmail(email);

    // Update common fields
    if (request.name) user.name = request.name;
    if (request.phone) user.phone = request.phone;
    if (request.dateOfBirth) user.dateOfBirth = new Date(request.dateOfBirth);
    if (request.emergencyContact)
      user.emergencyContact = request.emergencyContact;
    if (request.profilePicture) user.profilePicture = request.profilePicture;

    // Update email if changed
    if (request.email && request.email !== email) {
      const exists = await this.userRepository.existsByEmail(request.email);
      if (exists) {
        throw new BadRequestException('Email already in use');
      }
      user.email = request.email;
    }

    // Doctor-specific fields
    if (user.role === UserRole.DOCTOR) {
      if (request.yearsExperience !== undefined)
        user.yearsExperience = request.yearsExperience;
      if (request.specialization) user.specialization = request.specialization;
      if (request.medicalLicense) user.medicalLicense = request.medicalLicense;
      if (request.workplaceType) user.workplaceType = request.workplaceType;
      if (request.workplaceName) user.workplaceName = request.workplaceName;
    }

    // Handle patient-caregiver relationships
    if (request.connectedEmail) {
      await this.handleConnection(user, request.connectedEmail);
    }

    // Handle doctor assignment for patients
    if (user.role === UserRole.PATIENT && request.doctorEmail !== undefined) {
      await this.handleDoctorAssignment(user, request.doctorEmail);
    }

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`User updated: ${email}`);
    return savedUser;
  }

  private async handleConnection(
    user: UserDocument,
    connectedEmail: string,
  ): Promise<void> {
    const connectedUser = await this.findByEmail(connectedEmail);

    if (user.role === UserRole.PATIENT) {
      if (connectedUser.role !== UserRole.CAREGIVER) {
        throw new BadRequestException(
          'Connected email must belong to a caregiver',
        );
      }

      const hasConnection = user.caregiverIds?.includes(connectedUser.userId);

      if (hasConnection) {
        user.caregiverIds = user.caregiverIds.filter(
          (id) => id !== connectedUser.userId,
        );
        connectedUser.patientIds = connectedUser.patientIds.filter(
          (id) => id !== user.userId,
        );
      } else {
        if (!user.caregiverIds) user.caregiverIds = [];
        if (!connectedUser.patientIds) connectedUser.patientIds = [];
        user.caregiverIds.push(connectedUser.userId);
        connectedUser.patientIds.push(user.userId);
      }

      await this.userRepository.save(connectedUser);
    } else if (user.role === UserRole.CAREGIVER) {
      if (connectedUser.role !== UserRole.PATIENT) {
        throw new BadRequestException(
          'Connected email must belong to a patient',
        );
      }

      const hasConnection = user.patientIds?.includes(connectedUser.userId);

      if (hasConnection) {
        user.patientIds = user.patientIds.filter(
          (id) => id !== connectedUser.userId,
        );
        connectedUser.caregiverIds = connectedUser.caregiverIds.filter(
          (id) => id !== user.userId,
        );
      } else {
        if (!user.patientIds) user.patientIds = [];
        if (!connectedUser.caregiverIds) connectedUser.caregiverIds = [];
        user.patientIds.push(connectedUser.userId);
        connectedUser.caregiverIds.push(user.userId);
      }

      await this.userRepository.save(connectedUser);
    } else {
      throw new BadRequestException(
        'Only patients and caregivers can have connections',
      );
    }
  }

  private async handleDoctorAssignment(
    user: UserDocument,
    doctorEmail: string,
  ): Promise<void> {
    if (!doctorEmail) {
      user.doctorEmail = undefined;
      return;
    }

    const doctor = await this.findByEmail(doctorEmail);
    if (doctor.role !== UserRole.DOCTOR) {
      throw new BadRequestException('Doctor email must belong to a doctor');
    }

    if (doctorEmail === user.doctorEmail) {
      user.doctorEmail = undefined;
    } else {
      user.doctorEmail = doctor.email;
    }
  }

  // === Password management ===
  async changePassword(
    email: string,
    request: ChangePasswordRequestDto,
  ): Promise<void> {
    const user = await this.findByEmail(email);

    if (!user.keycloakId) {
      throw new BadRequestException('User not found in Keycloak');
    }

    await this.keycloakAdminService.changePassword(user.keycloakId, request);
    this.logger.log(`Password changed for user: ${email}`);
  }

  // === Delete methods ===
  async deleteUser(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    await this.deleteUserRelations(user);

    if (user.keycloakId) {
      await this.keycloakAdminService.deleteUser(user.keycloakId);
    }

    await this.userRepository.delete(user);
    this.logger.log(`User deleted: ${email}`);
  }

  async deleteUserById(userId: string): Promise<void> {
    const user = await this.findById(userId);
    await this.deleteUserRelations(user);

    if (user.keycloakId) {
      await this.keycloakAdminService.deleteUser(user.keycloakId);
    }

    await this.userRepository.delete(user);
    this.logger.log(`User deleted by admin: ${userId}`);
  }

  async deleteUserRelations(user: UserDocument): Promise<void> {
    // Make this public if needed elsewhere
    if (user.role === UserRole.PATIENT && user.caregiverIds?.length) {
      await this.userRepository.updateMany(
        { userId: { $in: user.caregiverIds } },
        { $pull: { patientIds: user.userId } },
      );
    } else if (user.role === UserRole.CAREGIVER && user.patientIds?.length) {
      await this.userRepository.updateMany(
        { userId: { $in: user.patientIds } },
        { $pull: { caregiverIds: user.userId } },
      );
    }
  }

  // === Admin methods ===
  async getAllUsers(): Promise<UserDocument[]> {
    return this.userRepository.findAll();
  }

  async getAllUserDtos(): Promise<UserDto[]> {
    const users = await this.userRepository.findAll();
    return Promise.all(users.map((user) => this.mapToUserDto(user)));
  }

  async getUserDtoById(userId: string): Promise<UserDto> {
    const user = await this.findById(userId);
    return this.mapToUserDto(user);
  }

  async getPatientsByCaregiverId(caregiverId: string): Promise<UserDto[]> {
    const caregiver = await this.findById(caregiverId);

    if (caregiver.role !== UserRole.CAREGIVER) {
      throw new BadRequestException('User is not a caregiver');
    }

    const patients = await this.userRepository.findAll();
    return Promise.all(
      patients
        .filter((patient) => caregiver.patientIds?.includes(patient.userId))
        .map((patient) => this.mapToUserDto(patient)),
    );
  }

  async getPatientsForDoctor(doctorEmail: string): Promise<UserDto[]> {
    const users = await this.userRepository.findAll();
    return Promise.all(
      users
        .filter(
          (user) =>
            user.role === UserRole.PATIENT && user.doctorEmail === doctorEmail,
        )
        .map((user) => this.mapToUserDto(user)),
    );
  }

  async syncMedicalRecordProjection(
    payload: MedicalRecordEvent,
  ): Promise<UserDocument> {
    const user = await this.findById(payload.patientId);

    if (payload.eventType === 'MEDICAL_RECORD_DELETED') {
      user.medicalRecord = undefined;
    } else {
      user.medicalRecord = {
        recordId: payload.recordId,
        patientEmail: payload.patientEmail ?? user.email,
        bloodGroup: payload.bloodGroup ?? null,
        alzheimerStage: payload.alzheimerStage ?? null,
        occurredAt: payload.occurredAt
          ? new Date(payload.occurredAt)
          : new Date(),
        lastEventType: payload.eventType,
      };
    }

    const savedUser = await this.userRepository.save(user);
    this.logger.log(
      `Synced medical record event ${payload.eventType} for patient ${payload.patientId}`,
    );
    return savedUser;
  }

  async updateUserByAdmin(
    userId: string,
    request: UpdateUserByAdminDto,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);

    if (request.email && request.email !== user.email) {
      const exists = await this.userRepository.existsByEmail(request.email);
      if (exists) {
        throw new BadRequestException('Email already in use');
      }
      user.email = request.email;
    }

    if (request.role) {
      user.role = request.role;
    }

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`User updated by admin: ${userId}`);
    return savedUser;
  }

  async searchUsersByRole(
    query: string,
    role: UserRole,
  ): Promise<UserDocument[]> {
    return this.userRepository.searchByRoleAndQuery(query, role);
  }

  // === Mapping methods ===
  async mapToUserDto(user: UserDocument): Promise<UserDto> {
    const dto = new UserDto();
    dto.userId = user.userId;
    dto.name = user.name;
    dto.email = user.email;
    dto.role = user.role;
    dto.phone = user.phone;
    dto.isVerified = user.isVerified;
    dto.createdAt = user.createdAt;
    dto.dateOfBirth = user.dateOfBirth;
    dto.emergencyContact = user.emergencyContact;
    dto.profilePicture = user.profilePicture;

    dto.yearsExperience = user.yearsExperience;
    dto.specialization = user.specialization;
    dto.medicalLicense = user.medicalLicense;
    dto.workplaceType = user.workplaceType;
    dto.workplaceName = user.workplaceName;
    dto.doctorEmail = user.doctorEmail;
    dto.medicalRecord = user.medicalRecord as MedicalRecordSummaryDto;

    if (user.role === UserRole.PATIENT && user.caregiverIds?.length) {
      const caregivers = await this.userRepository.findAll();
      dto.caregiverEmails = caregivers
        .filter((c) => user.caregiverIds.includes(c.userId))
        .map((c) => c.email);
    } else if (user.role === UserRole.CAREGIVER && user.patientIds?.length) {
      const patients = await this.userRepository.findAll();
      dto.patientEmails = patients
        .filter((p) => user.patientIds.includes(p.userId))
        .map((p) => p.email);
    }

    return dto;
  }

  mapToUserAdminDto(user: UserDocument): UserAdminDto {
    const dto = new UserAdminDto();
    dto.userId = user.userId;
    dto.name = user.name;
    dto.email = user.email;
    dto.role = user.role;
    dto.phone = user.phone;
    dto.isVerified = user.isVerified;
    dto.createdAt = user.createdAt;
    dto.profilePicture = user.profilePicture;
    return dto;
  }
}
