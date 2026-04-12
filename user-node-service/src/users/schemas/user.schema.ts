import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
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
    enum: Object.values(UserRole),
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

  // Medical record summary (embedded from RabbitMQ events)
  @Prop(
    raw({
      recordId: { type: String },
      patientEmail: { type: String, default: null },
      bloodGroup: { type: String, default: null },
      alzheimerStage: { type: String, default: null },
      occurredAt: { type: Date },
      lastEventType: { type: String },
    }),
  )
  medicalRecord?: {
    recordId?: string;
    patientEmail?: string | null;
    bloodGroup?: string | null;
    alzheimerStage?: string | null;
    occurredAt?: Date;
    lastEventType?: string;
  };

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
UserSchema.index({ role: 1 });
UserSchema.index({ name: 'text', email: 'text' }); // For text search
