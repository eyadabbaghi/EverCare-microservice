import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from './user-role.enum';
import * as uuid from 'uuid';

export type UserDocument = User & Document;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class User {
  @Prop({
    type: String,
    default: () => uuid.v4(),
    unique: true,
    required: true,
  })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ unique: true, sparse: true })
  keycloakId?: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole), // This ensures proper type comparison
    required: true,
  })
  role: UserRole;
  @Prop()
  phone?: string;

  @Prop({ default: false })
  isVerified: boolean;

  // Common profile fields
  @Prop()
  dateOfBirth?: Date;

  @Prop()
  emergencyContact?: string;

  @Prop()
  profilePicture?: string;

  // Doctor-specific fields
  @Prop()
  yearsExperience?: number;

  @Prop()
  specialization?: string;

  @Prop()
  medicalLicense?: string;

  @Prop()
  workplaceType?: string;

  @Prop()
  workplaceName?: string;

  @Prop()
  doctorEmail?: string;

  // Relationships - instead of ManyToMany, we store arrays of IDs
  @Prop({ type: [String], default: [] })
  caregiverIds: string[]; // For PATIENT: IDs of their caregivers

  @Prop({ type: [String], default: [] })
  patientIds: string[]; // For CAREGIVER: IDs of their patients

  // Timestamps will be handled by the schema options
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ userId: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ name: 'text', email: 'text' }); // For text search
