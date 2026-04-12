export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type AlzheimerStage = 'MILD' | 'MODERATE' | 'SEVERE';

export interface MedicalRecordResponse {
  id: string;
  patientId: string;
  bloodGroup: BloodGroup | string;
  alzheimerStage: AlzheimerStage | string;
  archived: boolean;
  archivedAt?: string | null;
  archivedBy?: string | null;
  archiveReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MedicalRecordCreateRequest {
  patientId: string;
  bloodGroup: BloodGroup | string;
  alzheimerStage: AlzheimerStage | string;
}

export interface MedicalRecordUpdateRequest {
  bloodGroup: BloodGroup | string;
  alzheimerStage: AlzheimerStage | string;
}

export interface MedicalRecordArchiveRequest {
  archivedBy?: string;
  archiveReason?: string;
}

export interface MedicalRecordHistory {
  id: string;
  type: string;
  date: string;
  description: string;
}

export interface MedicalHistoryCreateRequest {
  type: string;
  date: string;
  description: string;
}

export interface MedicalHistoryUpdateRequest {
  type: string;
  date: string;
  description: string;
}

export interface MedicalRecordDocument {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
}

export interface MedicalDocumentCreateRequest {
  fileName: string;
  fileType: string;
  filePath: string;
}

export interface MedicalDocumentUpdateRequest {
  fileName: string;
  fileType: string;
  filePath: string;
}

export interface AssessmentReport {
  id: string;
  reportType: string;
  score: number;
  stage: AlzheimerStage | string;
  recommendation: string;
  summary: string;
  author?: string | null;
  assessmentDate: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AssessmentReportCreateRequest {
  reportType: string;
  score: number;
  stage: AlzheimerStage | string;
  recommendation: string;
  summary: string;
  author?: string;
  assessmentDate: string;
}

export interface AssessmentReportUpdateRequest {
  reportType: string;
  score: number;
  stage: AlzheimerStage | string;
  recommendation: string;
  summary: string;
  author?: string;
  assessmentDate: string;
}

export interface MedicalRecordRealtimeEvent {
  eventType: string;
  recordId: string;
  patientId: string;
  patientEmail?: string | null;
  bloodGroup?: string | null;
  alzheimerStage?: string | null;
  archived?: boolean;
  archiveReason?: string | null;
  occurredAt?: string | null;
}

// Legacy mock-page interfaces kept so the old static page still compiles if needed.
export interface MedicalDocument {
  id: string;
  name: string;
  type: 'lab-result' | 'prescription' | 'report' | 'scan' | 'other';
  date: string;
  size: string;
  doctor?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  active: boolean;
}

export interface VitalSign {
  id: string;
  type: 'blood-pressure' | 'heart-rate' | 'temperature' | 'weight';
  value: string;
  date: string;
  time: string;
}
