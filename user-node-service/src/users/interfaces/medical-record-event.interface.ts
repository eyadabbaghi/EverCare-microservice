export interface MedicalRecordEvent {
  eventType: 'MEDICAL_RECORD_CREATED' | 'MEDICAL_RECORD_UPDATED' | 'MEDICAL_RECORD_DELETED';
  recordId: string;
  patientId: string;
  patientEmail?: string | null;
  bloodGroup?: string | null;
  alzheimerStage?: string | null;
  occurredAt?: string;
}
