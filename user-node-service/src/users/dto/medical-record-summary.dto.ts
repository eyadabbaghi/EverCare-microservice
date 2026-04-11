export class MedicalRecordSummaryDto {
  recordId?: string;
  patientEmail?: string | null;
  bloodGroup?: string | null;
  alzheimerStage?: string | null;
  occurredAt?: Date;
  lastEventType?: string;
}
