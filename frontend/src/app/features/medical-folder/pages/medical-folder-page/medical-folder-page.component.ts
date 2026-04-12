import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, of, Subscription, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Patient, UserService } from '../../../../core/services/user.service';
import { AuthService, User } from '../../../front-office/pages/login/auth.service';
import {
  AlzheimerStage,
  AssessmentReport,
  AssessmentReportCreateRequest,
  AssessmentReportUpdateRequest,
  BloodGroup,
  MedicalDocumentCreateRequest,
  MedicalDocumentUpdateRequest,
  MedicalHistoryCreateRequest,
  MedicalHistoryUpdateRequest,
  MedicalRecordCreateRequest,
  MedicalRecordDocument,
  MedicalRecordHistory,
  MedicalRecordArchiveRequest,
  MedicalRecordResponse,
  MedicalRecordUpdateRequest,
  MedicalRecordRealtimeEvent,
} from '../../interfaces/medical-folder';
import { MedicalFolderService } from '../../services/medical-folder.service';

@Component({
  selector: 'app-medical-folder-page',
  templateUrl: './medical-folder-page.component.html',
  styleUrls: ['./medical-folder-page.component.css'],
})
export class MedicalFolderPageComponent implements OnInit, OnDestroy {
  readonly bloodGroupOptions: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  readonly alzheimerStageOptions: AlzheimerStage[] = ['MILD', 'MODERATE', 'SEVERE'];
  readonly historyTypeOptions: string[] = [
    'CONSULTATION',
    'DIAGNOSIS',
    'FOLLOW_UP',
    'TREATMENT',
    'OPERATION',
  ];
  readonly documentTypeOptions: string[] = ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'other'];
  readonly reportTypeOptions: string[] = [
    'COGNITIVE_SCREENING',
    'SELF_ASSESSMENT',
    'MMSE',
    'DOCTOR_REVIEW',
  ];

  activeTab: 'overview' | 'history' | 'reports' | 'documents' = 'overview';
  patientSearchQuery = '';
  searchQuery = '';
  historySearchQuery = '';
  documentSearchQuery = '';
  reportSearchQuery = '';

  currentUser: User | null = null;
  accessiblePatients: Patient[] = [];
  selectedPatientId = '';
  selectedPatient: Patient | null = null;

  medicalRecord: MedicalRecordResponse | null = null;
  histories: MedicalRecordHistory[] = [];
  documents: MedicalRecordDocument[] = [];
  reports: AssessmentReport[] = [];

  isLoadingPatients = false;
  isLoadingRecord = false;
  isSavingRecord = false;
  isSavingHistory = false;
  isSavingDocument = false;
  isSavingReport = false;
  isArchivingRecord = false;

  successMessage = '';
  errorMessage = '';

  recordForm: MedicalRecordCreateRequest = this.createDefaultRecordForm();
  historyForm: MedicalHistoryCreateRequest = this.createDefaultHistoryForm();
  documentForm: MedicalDocumentCreateRequest = this.createDefaultDocumentForm();
  reportForm: AssessmentReportCreateRequest = this.createDefaultReportForm();
  editingHistoryId: string | null = null;
  editingDocumentId: string | null = null;
  editingReportId: string | null = null;

  private handledUserKey: string | null = null;
  private userSubscription?: Subscription;
  private realtimeSubscription?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly medicalFolderService: MedicalFolderService,
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      if (!user) {
        this.currentUser = null;
        this.handledUserKey = null;
        return;
      }

      this.handleUserContext(user);
    });

    const currentUser = this.authService.getCurrentUserValue();
    if (currentUser) {
      this.handleUserContext(currentUser);
      return;
    }

    if (this.authService.getToken()) {
      this.authService.fetchCurrentUser().subscribe({
        next: (user) => this.handleUserContext(user),
        error: () => {
          this.errorMessage = 'Unable to load your profile. Please reconnect and try again.';
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.stopRealtimeSync();
  }

  get filteredPatients(): Patient[] {
    const query = this.patientSearchQuery.trim().toLowerCase();
    if (!query) {
      return this.accessiblePatients;
    }

    return this.accessiblePatients.filter((patient) =>
      [patient.name, patient.email, patient.userId]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }

  get filteredDocuments(): MedicalRecordDocument[] {
    const query = (this.documentSearchQuery || this.searchQuery).trim().toLowerCase();
    if (!query) {
      return this.documents;
    }

    return this.documents.filter((document) =>
      [document.fileName, document.fileType, document.filePath]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }

  get filteredHistories(): MedicalRecordHistory[] {
    const query = this.historySearchQuery.trim().toLowerCase();
    if (!query) {
      return this.histories;
    }

    return this.histories.filter((history) =>
      [history.type, history.date, history.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }

  get filteredReports(): AssessmentReport[] {
    const query = this.reportSearchQuery.trim().toLowerCase();
    if (!query) {
      return this.reports;
    }

    return this.reports.filter((report) =>
      [
        report.reportType,
        report.stage,
        report.assessmentDate,
        report.author ?? '',
        report.recommendation,
        report.summary,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }

  get pageTitle(): string {
    switch (this.currentUser?.role) {
      case 'PATIENT':
        return 'My medical record';
      case 'DOCTOR':
        return 'Patient medical record workspace';
      case 'CAREGIVER':
        return 'Patient follow-up dossier';
      case 'ADMIN':
        return 'Medical record command center';
      default:
        return 'Medical records';
    }
  }

  get pageSubtitle(): string {
    switch (this.currentUser?.role) {
      case 'PATIENT':
        return 'Review your Alzheimer stage, latest reports, medical history, and supporting documents in one simplified personal space.';
      case 'DOCTOR':
        return 'Search patients, open a complete dossier, update stage, add histories, link reports, manage documents, and archive records with traceability.';
      case 'CAREGIVER':
        return 'Consult the patient follow-up context, read the medical record, and stay aligned with the care team through a structured read-only view.';
      case 'ADMIN':
        return 'Supervise the medical-record lifecycle across patients, including active folders, archived dossiers, clinical reports, and supporting evidence.';
      default:
        return 'Centralize medical record information, structured history, assessment reports, and clinical documents in a single workspace.';
    }
  }

  get statusLabel(): string {
    if (!this.selectedPatientId) {
      return 'No patient selected';
    }

    if (!this.medicalRecord) {
      return this.currentUser?.role === 'PATIENT' ? 'Pending dossier' : 'Ready to create';
    }

    return this.medicalRecord.archived ? 'Archived record' : 'Active record';
  }

  get statusDescription(): string {
    if (!this.selectedPatientId) {
      return 'Select a patient to load dossier data.';
    }

    if (!this.medicalRecord) {
      if (this.currentUser?.role === 'PATIENT') {
        return 'Your medical dossier has not been initialized yet. It will appear after onboarding, evaluation, or clinician creation.';
      }

      if (this.currentUser?.role === 'CAREGIVER') {
        return 'No dossier is available yet for consultation for this patient.';
      }

      return 'No medical record exists yet for this patient. Create it to start the structured clinical follow-up.';
    }

    if (this.medicalRecord.archived) {
      return 'This dossier remains visible for traceability, but updates to the record, history, reports, and documents are blocked until it is restored.';
    }

    if (this.currentUser?.role === 'PATIENT') {
      return 'Your dossier is active. You can review the current Alzheimer stage, follow-up progression, linked reports, and document references.';
    }

    if (this.currentUser?.role === 'CAREGIVER') {
      return 'This dossier is active and available in consultation mode for caregiver follow-up.';
    }

    return 'This dossier is active. Stage updates, history entries, assessment reports, and documents can be managed from this workspace.';
  }

  get archiveBadgeClasses(): string {
    return this.medicalRecord?.archived
      ? 'border border-slate-800 bg-slate-900 text-white'
      : 'border border-emerald-200 bg-emerald-100 text-emerald-700';
  }

  get latestReport(): AssessmentReport | null {
    return this.reports[0] ?? null;
  }

  get completionScore(): number {
    if (!this.medicalRecord) {
      return 0;
    }

    let score = 30;

    if (this.medicalRecord.bloodGroup) {
      score += 15;
    }

    if (this.medicalRecord.alzheimerStage) {
      score += 20;
    }

    if (this.histories.length > 0) {
      score += 15;
    }

    if (this.documents.length > 0) {
      score += 10;
    }

    if (this.reports.length > 0) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  get insightMessage(): string {
    if (!this.medicalRecord) {
      return this.isDoctorOrAdmin
        ? 'Create the medical record first, then link histories, reports, and supporting documents.'
        : 'Your dossier will appear here after evaluation onboarding or clinician initialization.';
    }

    if (this.isRecordArchived) {
      return 'This medical record is archived. Reading stays available, but clinical updates are blocked until restore.';
    }

    if (!this.latestReport) {
      return 'No assessment report is linked yet. Add one to document score, stage, and recommendation.';
    }

    if (this.latestReport.score < 40) {
      return 'The latest assessment score is low. Prioritize follow-up planning and richer clinical notes.';
    }

    if (this.histories.length === 0) {
      return 'The dossier is active, but no clinical history has been recorded yet.';
    }

    if (this.documents.length === 0) {
      return 'The dossier is missing supporting documents. Add scans, prescriptions, or reports.';
    }

    return 'The dossier is well structured and ready for longitudinal follow-up.';
  }

  get stageBadgeClasses(): string {
    switch (this.medicalRecord?.alzheimerStage) {
      case 'SEVERE':
        return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'MODERATE':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }
  }

  get canManageRecord(): boolean {
    return this.isDoctorOrAdmin && !!this.selectedPatientId && !this.isRecordArchived;
  }

  get isDoctorOrAdmin(): boolean {
    return this.currentUser?.role === 'DOCTOR' || this.currentUser?.role === 'ADMIN';
  }

  get isRecordArchived(): boolean {
    return !!this.medicalRecord?.archived;
  }

  get canArchiveRecord(): boolean {
    return this.isDoctorOrAdmin && !!this.medicalRecord && !this.isRecordArchived;
  }

  get canRestoreRecord(): boolean {
    return this.isDoctorOrAdmin && !!this.medicalRecord && this.isRecordArchived;
  }

  get canDeleteRecord(): boolean {
    return this.currentUser?.role === 'ADMIN' && !!this.medicalRecord && !this.isRecordArchived;
  }

  get canManageClinicalEntries(): boolean {
    return this.isDoctorOrAdmin && !!this.medicalRecord && !this.isRecordArchived;
  }

  get latestRecommendation(): string {
    return (
      this.latestReport?.recommendation ||
      'No recommendation is available yet. Link an assessment report to capture next steps.'
    );
  }

  get personalProgressSummary(): string {
    if (!this.latestReport) {
      return 'No assessment report has been linked to this record yet.';
    }

    if (this.reports.length === 1) {
      return `Latest score: ${this.latestReport.score}/100 with observed stage ${this.latestReport.stage}.`;
    }

    const previous = this.reports[1];
    const delta = this.latestReport.score - previous.score;

    if (delta > 0) {
      return `Latest score: ${this.latestReport.score}/100, improving by ${delta} points versus the previous report.`;
    }

    if (delta < 0) {
      return `Latest score: ${this.latestReport.score}/100, decreasing by ${Math.abs(delta)} points versus the previous report.`;
    }

    return `Latest score: ${this.latestReport.score}/100, stable compared with the previous report.`;
  }

  onTabChange(tab: 'overview' | 'history' | 'reports' | 'documents'): void {
    this.activeTab = tab;
  }

  onSelectedPatientChange(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.selectedPatient =
      this.accessiblePatients.find((patient) => patient.userId === this.selectedPatientId) ?? null;

    if (!this.selectedPatientId) {
      this.stopRealtimeSync();
      this.clearMedicalRecordState();
      return;
    }

    this.startRealtimeSync(this.selectedPatientId);
    this.loadMedicalRecordForPatient(this.selectedPatientId);
  }

  submitRecord(): void {
    if (!this.selectedPatientId) {
      this.errorMessage = 'Select a patient before saving the medical record.';
      return;
    }

    if (!this.isDoctorOrAdmin) {
      this.errorMessage = 'Only doctors and admins can create or update medical records.';
      return;
    }

    if (this.isRecordArchived) {
      this.errorMessage = 'This dossier is archived. Restore it before updating core information.';
      return;
    }

    this.isSavingRecord = true;
    this.errorMessage = '';

    const payload = {
      bloodGroup: this.recordForm.bloodGroup,
      alzheimerStage: this.recordForm.alzheimerStage,
    };

    const request$ = this.medicalRecord
      ? this.medicalFolderService.updateMedicalRecord(
          this.medicalRecord.id,
          payload as MedicalRecordUpdateRequest,
        )
      : this.medicalFolderService.createMedicalRecord({
          patientId: this.selectedPatientId,
          ...(payload as Omit<MedicalRecordCreateRequest, 'patientId'>),
        });

    request$.subscribe({
      next: () => {
        this.isSavingRecord = false;
        this.successMessage = this.medicalRecord
          ? 'Medical record updated successfully.'
          : 'Medical record created successfully.';
        this.loadMedicalRecordForPatient(this.selectedPatientId, false);
      },
      error: (error) => {
        this.isSavingRecord = false;
        this.errorMessage = this.extractErrorMessage(
          error,
          'Unable to save the medical record.',
        );
      },
    });
  }

  deleteRecord(): void {
    if (!this.medicalRecord || !this.canDeleteRecord) {
      return;
    }

    if (!window.confirm('Delete this medical record and all attached histories/documents/reports?')) {
      return;
    }

    this.errorMessage = '';
    this.medicalFolderService.deleteMedicalRecord(this.medicalRecord.id).subscribe({
      next: () => {
        this.successMessage = 'Medical record deleted successfully.';
        this.clearMedicalRecordState();
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(
          error,
          'Unable to delete the medical record.',
        );
      },
    });
  }

  archiveRecord(): void {
    if (!this.medicalRecord || !this.canArchiveRecord) {
      return;
    }

    const reason = window.prompt(
      'Optional archive reason:',
      this.medicalRecord.archiveReason ?? '',
    );

    this.isArchivingRecord = true;
    this.errorMessage = '';

    const payload: MedicalRecordArchiveRequest = {
      archivedBy: this.currentUser?.email || this.currentUser?.name || 'care-team',
      archiveReason: reason?.trim() || undefined,
    };

    this.medicalFolderService.archiveMedicalRecord(this.medicalRecord.id, payload).subscribe({
      next: () => {
        this.isArchivingRecord = false;
        this.successMessage = 'Medical record archived successfully.';
        this.loadMedicalRecordForPatient(this.selectedPatientId, false);
      },
      error: (error) => {
        this.isArchivingRecord = false;
        this.errorMessage = this.extractErrorMessage(error, 'Unable to archive the medical record.');
      },
    });
  }

  restoreRecord(): void {
    if (!this.medicalRecord || !this.canRestoreRecord) {
      return;
    }

    this.isArchivingRecord = true;
    this.errorMessage = '';

    this.medicalFolderService.restoreMedicalRecord(this.medicalRecord.id).subscribe({
      next: () => {
        this.isArchivingRecord = false;
        this.successMessage = 'Medical record restored successfully.';
        this.loadMedicalRecordForPatient(this.selectedPatientId, false);
      },
      error: (error) => {
        this.isArchivingRecord = false;
        this.errorMessage = this.extractErrorMessage(error, 'Unable to restore the medical record.');
      },
    });
  }

  submitHistory(): void {
    if (!this.medicalRecord) {
      this.errorMessage = 'Create the medical record before adding history entries.';
      return;
    }

    if (!this.canManageClinicalEntries) {
      this.errorMessage = this.isRecordArchived
        ? 'This dossier is archived. History changes are blocked.'
        : 'Only doctors and admins can manage clinical history.';
      return;
    }

    if (!this.historyForm.description.trim()) {
      this.errorMessage = 'History description is required.';
      return;
    }

    this.isSavingHistory = true;
    this.errorMessage = '';

    const payload: MedicalHistoryCreateRequest | MedicalHistoryUpdateRequest = {
      type: this.historyForm.type.trim().toUpperCase(),
      date: this.historyForm.date,
      description: this.historyForm.description.trim(),
    };

    const request$ = this.editingHistoryId
      ? this.medicalFolderService.updateHistory(
          this.medicalRecord.id,
          this.editingHistoryId,
          payload,
        )
      : this.medicalFolderService.createHistory(this.medicalRecord.id, payload);
    const isEditingHistory = !!this.editingHistoryId;

    request$.subscribe({
        next: () => {
          this.isSavingHistory = false;
          this.resetHistoryComposer();
          this.successMessage = isEditingHistory
            ? 'History entry updated successfully.'
            : 'History entry added successfully.';
          this.loadMedicalRecordForPatient(this.selectedPatientId, false);
          this.activeTab = 'history';
        },
        error: (error) => {
          this.isSavingHistory = false;
          this.errorMessage = this.extractErrorMessage(error, 'Unable to add the history entry.');
        },
      });
  }

  startHistoryEdit(history: MedicalRecordHistory): void {
    if (!this.canManageClinicalEntries) {
      return;
    }

    this.editingHistoryId = history.id;
    this.historyForm = {
      type: history.type,
      date: history.date,
      description: history.description,
    };
    this.activeTab = 'history';
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelHistoryEdit(): void {
    this.resetHistoryComposer();
    this.successMessage = '';
    this.errorMessage = '';
  }

  deleteHistory(history: MedicalRecordHistory): void {
    if (!this.medicalRecord || !this.canManageClinicalEntries) {
      return;
    }

    if (!window.confirm(`Delete history entry "${history.type}" dated ${history.date}?`)) {
      return;
    }

    if (this.editingHistoryId === history.id) {
      this.resetHistoryComposer();
    }

    this.medicalFolderService.deleteHistory(this.medicalRecord.id, history.id).subscribe({
      next: () => {
        this.successMessage = 'History entry deleted successfully.';
        this.loadMedicalRecordForPatient(this.selectedPatientId, false);
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Unable to delete the history entry.');
      },
    });
  }

  submitDocument(): void {
    if (!this.medicalRecord) {
      this.errorMessage = 'Create the medical record before adding documents.';
      return;
    }

    if (!this.canManageClinicalEntries) {
      this.errorMessage = this.isRecordArchived
        ? 'This dossier is archived. Document changes are blocked.'
        : 'Only doctors and admins can manage documents.';
      return;
    }

    if (
      !this.documentForm.fileName.trim() ||
      !this.documentForm.fileType.trim() ||
      !this.documentForm.filePath.trim()
    ) {
      this.errorMessage = 'Document name, type, and path are required.';
      return;
    }

    this.isSavingDocument = true;
    this.errorMessage = '';

    const payload: MedicalDocumentCreateRequest | MedicalDocumentUpdateRequest = {
      fileName: this.documentForm.fileName.trim(),
      fileType: this.documentForm.fileType.trim().toLowerCase(),
      filePath: this.documentForm.filePath.trim(),
    };

    const request$ = this.editingDocumentId
      ? this.medicalFolderService.updateDocument(
          this.medicalRecord.id,
          this.editingDocumentId,
          payload,
        )
      : this.medicalFolderService.createDocument(this.medicalRecord.id, payload);
    const isEditingDocument = !!this.editingDocumentId;

    request$.subscribe({
        next: () => {
          this.isSavingDocument = false;
          this.resetDocumentComposer();
          this.successMessage = isEditingDocument
            ? 'Document updated successfully.'
            : 'Document added successfully.';
          this.loadMedicalRecordForPatient(this.selectedPatientId, false);
          this.activeTab = 'documents';
        },
        error: (error) => {
          this.isSavingDocument = false;
          this.errorMessage = this.extractErrorMessage(error, 'Unable to add the document.');
        },
      });
  }

  startDocumentEdit(document: MedicalRecordDocument): void {
    if (!this.canManageClinicalEntries) {
      return;
    }

    this.editingDocumentId = document.id;
    this.documentForm = {
      fileName: document.fileName,
      fileType: document.fileType,
      filePath: document.filePath,
    };
    this.activeTab = 'documents';
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelDocumentEdit(): void {
    this.resetDocumentComposer();
    this.successMessage = '';
    this.errorMessage = '';
  }

  deleteDocument(document: MedicalRecordDocument): void {
    if (!this.medicalRecord || !this.canManageClinicalEntries) {
      return;
    }

    if (!window.confirm(`Delete document "${document.fileName}"?`)) {
      return;
    }

    if (this.editingDocumentId === document.id) {
      this.resetDocumentComposer();
    }

    this.medicalFolderService.deleteDocument(this.medicalRecord.id, document.id).subscribe({
      next: () => {
        this.successMessage = 'Document deleted successfully.';
        this.loadMedicalRecordForPatient(this.selectedPatientId, false);
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Unable to delete the document.');
      },
    });
  }

  submitReport(): void {
    if (!this.medicalRecord) {
      this.errorMessage = 'Create the medical record before adding assessment reports.';
      return;
    }

    if (!this.canManageClinicalEntries) {
      this.errorMessage = this.isRecordArchived
        ? 'This dossier is archived. Report changes are blocked.'
        : 'Only doctors and admins can manage assessment reports.';
      return;
    }

    if (!this.reportForm.recommendation.trim() || !this.reportForm.summary.trim()) {
      this.errorMessage = 'Recommendation and summary are required.';
      return;
    }

    this.isSavingReport = true;
    this.errorMessage = '';

    const payload: AssessmentReportCreateRequest | AssessmentReportUpdateRequest = {
      reportType: this.reportForm.reportType.trim(),
      score: Number(this.reportForm.score),
      stage: this.reportForm.stage,
      recommendation: this.reportForm.recommendation.trim(),
      summary: this.reportForm.summary.trim(),
      author:
        this.reportForm.author?.trim() ||
        this.currentUser?.name ||
        this.currentUser?.email ||
        'Care team',
      assessmentDate: this.reportForm.assessmentDate,
    };

    const request$ = this.editingReportId
      ? this.medicalFolderService.updateReport(this.medicalRecord.id, this.editingReportId, payload)
      : this.medicalFolderService.createReport(this.medicalRecord.id, payload);
    const isEditingReport = !!this.editingReportId;

    request$.subscribe({
      next: () => {
        this.isSavingReport = false;
        this.resetReportComposer();
        this.successMessage = isEditingReport
          ? 'Assessment report updated successfully.'
          : 'Assessment report added successfully.';
        this.loadMedicalRecordForPatient(this.selectedPatientId, false);
        this.activeTab = 'reports';
      },
      error: (error) => {
        this.isSavingReport = false;
        this.errorMessage = this.extractErrorMessage(error, 'Unable to save the assessment report.');
      },
    });
  }

  startReportEdit(report: AssessmentReport): void {
    if (!this.canManageClinicalEntries) {
      return;
    }

    this.editingReportId = report.id;
    this.reportForm = {
      reportType: report.reportType,
      score: report.score,
      stage: (report.stage || 'MILD') as AlzheimerStage,
      recommendation: report.recommendation,
      summary: report.summary,
      author: report.author || this.currentUser?.name || '',
      assessmentDate: report.assessmentDate,
    };
    this.activeTab = 'reports';
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelReportEdit(): void {
    this.resetReportComposer();
    this.successMessage = '';
    this.errorMessage = '';
  }

  deleteReport(report: AssessmentReport): void {
    if (!this.medicalRecord || !this.canManageClinicalEntries) {
      return;
    }

    if (!window.confirm(`Delete assessment report "${report.reportType}" from ${report.assessmentDate}?`)) {
      return;
    }

    if (this.editingReportId === report.id) {
      this.resetReportComposer();
    }

    this.medicalFolderService.deleteReport(this.medicalRecord.id, report.id).subscribe({
      next: () => {
        this.successMessage = 'Assessment report deleted successfully.';
        this.loadMedicalRecordForPatient(this.selectedPatientId, false);
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Unable to delete the assessment report.');
      },
    });
  }

  openDocument(document: MedicalRecordDocument): void {
    if (typeof window === 'undefined' || !document.filePath) {
      return;
    }

    window.open(document.filePath, '_blank', 'noopener');
  }

  trackByPatient(index: number, patient: Patient): string {
    return patient.userId || `${patient.email}-${index}`;
  }

  trackByHistory(index: number, history: MedicalRecordHistory): string {
    return history.id || `${history.date}-${index}`;
  }

  trackByDocument(index: number, document: MedicalRecordDocument): string {
    return document.id || `${document.filePath}-${index}`;
  }

  trackByReport(index: number, report: AssessmentReport): string {
    return report.id || `${report.assessmentDate}-${index}`;
  }

  getRelationshipLabel(patient: Patient | null): string {
    if (!patient) {
      return '';
    }

    const fragments: string[] = [];

    if (patient.doctorEmail) {
      fragments.push(`Doctor: ${patient.doctorEmail}`);
    }

    if (patient.caregiverEmails?.length) {
      fragments.push(`Caregivers: ${patient.caregiverEmails.length}`);
    }

    return fragments.join(' • ');
  }

  getHistoryBadge(type: string): string {
    switch (type) {
      case 'DIAGNOSIS':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'TREATMENT':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'OPERATION':
        return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'FOLLOW_UP':
        return 'bg-violet-100 text-violet-700 border border-violet-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  }

  getReportStageBadge(stage: string): string {
    switch (stage) {
      case 'SEVERE':
        return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'MODERATE':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }
  }

  getDocumentBadge(type: string): string {
    switch (type) {
      case 'pdf':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return 'bg-sky-100 text-sky-700 border border-sky-200';
      case 'docx':
        return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  }

  private handleUserContext(user: User): void {
    const userKey = `${user.userId ?? user.email ?? 'anonymous'}:${user.role}`;
    if (this.handledUserKey === userKey) {
      this.currentUser = user;
      return;
    }

    this.handledUserKey = userKey;
    this.currentUser = user;
    this.loadPatientsForCurrentUser(user);
  }

  private loadPatientsForCurrentUser(user: User): void {
    this.isLoadingPatients = true;
    this.errorMessage = '';

    if (user.role === 'PATIENT') {
      this.loadPatientScopeForPatientRole(user);
      return;
    }

    if (user.role === 'CAREGIVER' && user.patientEmails?.length) {
      const requests = user.patientEmails.map((email) =>
        this.userService.getUserByEmail(email).pipe(catchError(() => of(null))),
      );

      forkJoin(requests).subscribe({
        next: (patients) => {
          const relatedPatients = this.normalizePatients(
            patients.filter((patient): patient is Patient => !!patient),
          );

          if (relatedPatients.length) {
            this.applyPatientScope(relatedPatients);
            return;
          }

          this.loadPatientsFromDirectory(user);
        },
        error: () => this.loadPatientsFromDirectory(user),
      });
      return;
    }

    this.loadPatientsFromDirectory(user);
  }

  private loadPatientScopeForPatientRole(user: User): void {
    if (user.userId) {
      this.applyPatientScope([
        {
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profilePicture: user.profilePicture,
          role: user.role,
        },
      ]);
      return;
    }

    if (!user.email) {
      this.isLoadingPatients = false;
      this.errorMessage = 'Unable to resolve the current patient profile.';
      return;
    }

    this.userService.getUserByEmail(user.email).subscribe({
      next: (patient) => this.applyPatientScope([patient]),
      error: (error) => {
        this.isLoadingPatients = false;
        this.errorMessage = this.extractErrorMessage(
          error,
          'Unable to resolve the current patient profile.',
        );
      },
    });
  }

  private loadPatientsFromDirectory(user: User): void {
    this.userService.getPatients().subscribe({
      next: (patients) => {
        const normalizedPatients = this.normalizePatients(patients);
        const filteredPatients = this.filterPatientsByRole(normalizedPatients, user);
        this.applyPatientScope(filteredPatients);
      },
      error: (error) => {
        this.isLoadingPatients = false;
        this.errorMessage = this.extractErrorMessage(error, 'Unable to load patients.');
      },
    });
  }

  private applyPatientScope(patients: Patient[]): void {
    this.accessiblePatients = this.normalizePatients(patients);
    this.isLoadingPatients = false;

    if (!this.accessiblePatients.length) {
      this.selectedPatientId = '';
      this.selectedPatient = null;
      this.stopRealtimeSync();
      this.clearMedicalRecordState();
      return;
    }

    const selectedPatient =
      this.accessiblePatients.find((patient) => patient.userId === this.selectedPatientId) ??
      this.accessiblePatients[0];

    this.selectedPatientId = selectedPatient.userId;
    this.selectedPatient = selectedPatient;
    this.startRealtimeSync(selectedPatient.userId);
    this.loadMedicalRecordForPatient(selectedPatient.userId);
  }

  private loadMedicalRecordForPatient(patientId: string, clearSuccessMessage = true): void {
    this.isLoadingRecord = true;
    this.errorMessage = '';

    if (clearSuccessMessage) {
      this.successMessage = '';
    }

    this.medicalFolderService
      .getMedicalRecordByPatientId(patientId)
      .pipe(
        switchMap((record) =>
          forkJoin({
            record: of(record),
            histories: this.medicalFolderService.getHistories(record.id).pipe(catchError(() => of([]))),
            documents: this.medicalFolderService.getDocuments(record.id).pipe(catchError(() => of([]))),
            reports: this.medicalFolderService.getReports(record.id).pipe(catchError(() => of([]))),
          }),
        ),
        catchError((error) => {
          if (this.isNotFoundError(error)) {
            return of({
              record: null,
              histories: [] as MedicalRecordHistory[],
              documents: [] as MedicalRecordDocument[],
              reports: [] as AssessmentReport[],
            });
          }

          return throwError(() => error);
        }),
      )
      .subscribe({
        next: ({ record, histories, documents, reports }) => {
          this.medicalRecord = record;
          this.histories = this.sortHistories(histories);
          this.documents = this.sortDocuments(documents);
          this.reports = this.sortReports(reports);
          this.syncRecordForm();
          this.isLoadingRecord = false;
        },
        error: (error) => {
          this.isLoadingRecord = false;
          this.clearMedicalRecordState(false);
          this.errorMessage = this.extractErrorMessage(
            error,
            'Unable to load the selected medical folder.',
          );
        },
      });
  }

  private syncRecordForm(): void {
    if (!this.medicalRecord) {
      this.recordForm = this.createDefaultRecordForm();
      return;
    }

    this.recordForm = {
      patientId: this.medicalRecord.patientId,
      bloodGroup: (this.medicalRecord.bloodGroup || 'A+') as BloodGroup,
      alzheimerStage: (this.medicalRecord.alzheimerStage || 'MILD') as AlzheimerStage,
    };
  }

  private clearMedicalRecordState(resetMessages = true): void {
    this.medicalRecord = null;
    this.histories = [];
    this.documents = [];
    this.reports = [];
    this.recordForm = this.createDefaultRecordForm();
    this.resetHistoryComposer();
    this.resetDocumentComposer();
    this.resetReportComposer();
    this.patientSearchQuery = '';
    this.searchQuery = '';
    this.historySearchQuery = '';
    this.documentSearchQuery = '';
    this.reportSearchQuery = '';

    if (resetMessages) {
      this.errorMessage = '';
    }
  }

  private startRealtimeSync(patientId: string): void {
    this.stopRealtimeSync();
    this.realtimeSubscription = this.medicalFolderService.watchPatientEvents(patientId).subscribe({
      next: (event: MedicalRecordRealtimeEvent) => {
        if (event.patientId !== this.selectedPatientId) {
          return;
        }

        this.successMessage = `Live update received: ${this.formatEventType(event.eventType)}.`;
        this.loadMedicalRecordForPatient(patientId, false);
      },
      error: () => {
        this.successMessage = '';
      },
    });
  }

  private stopRealtimeSync(): void {
    this.realtimeSubscription?.unsubscribe();
    this.realtimeSubscription = undefined;
  }

  private normalizePatients(patients: Patient[]): Patient[] {
    const uniquePatients = new Map<string, Patient>();

    patients.forEach((patient) => {
      if (patient?.userId) {
        uniquePatients.set(patient.userId, patient);
      }
    });

    return Array.from(uniquePatients.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }

  private filterPatientsByRole(patients: Patient[], user: User): Patient[] {
    if (user.role === 'DOCTOR' && user.email) {
      const assignedPatients = patients.filter((patient) => patient.doctorEmail === user.email);
      return assignedPatients.length ? assignedPatients : patients;
    }

    if (user.role === 'CAREGIVER' && user.email) {
      const relatedPatients = patients.filter((patient) =>
        patient.caregiverEmails?.includes(user.email),
      );
      return relatedPatients.length ? relatedPatients : patients;
    }

    return patients;
  }

  private sortHistories(histories: MedicalRecordHistory[]): MedicalRecordHistory[] {
    return [...histories].sort((left, right) => right.date.localeCompare(left.date));
  }

  private sortDocuments(documents: MedicalRecordDocument[]): MedicalRecordDocument[] {
    return [...documents].sort((left, right) => left.fileName.localeCompare(right.fileName));
  }

  private sortReports(reports: AssessmentReport[]): AssessmentReport[] {
    return [...reports].sort((left, right) => {
      const leftKey = `${left.assessmentDate}-${left.createdAt ?? ''}`;
      const rightKey = `${right.assessmentDate}-${right.createdAt ?? ''}`;
      return rightKey.localeCompare(leftKey);
    });
  }

  private createDefaultRecordForm(): MedicalRecordCreateRequest {
    return {
      patientId: this.selectedPatientId,
      bloodGroup: 'A+',
      alzheimerStage: 'MILD',
    };
  }

  private createDefaultHistoryForm(): MedicalHistoryCreateRequest {
    return {
      type: 'CONSULTATION',
      date: new Date().toISOString().slice(0, 10),
      description: '',
    };
  }

  private createDefaultDocumentForm(): MedicalDocumentCreateRequest {
    return {
      fileName: '',
      fileType: 'pdf',
      filePath: '',
    };
  }

  private createDefaultReportForm(): AssessmentReportCreateRequest {
    return {
      reportType: 'DOCTOR_REVIEW',
      score: 50,
      stage: 'MILD',
      recommendation: '',
      summary: '',
      author: this.currentUser?.name || '',
      assessmentDate: new Date().toISOString().slice(0, 10),
    };
  }

  private resetHistoryComposer(): void {
    this.editingHistoryId = null;
    this.historyForm = this.createDefaultHistoryForm();
  }

  private resetDocumentComposer(): void {
    this.editingDocumentId = null;
    this.documentForm = this.createDefaultDocumentForm();
  }

  private resetReportComposer(): void {
    this.editingReportId = null;
    this.reportForm = this.createDefaultReportForm();
  }

  private isNotFoundError(error: unknown): boolean {
    return (error as { status?: number })?.status === 404;
  }

  private formatEventType(eventType: string): string {
    return eventType.split('_').join(' ').toLowerCase();
  }

  private extractErrorMessage(error: unknown, fallbackMessage: string): string {
    const backendError = error as {
      error?: { message?: string; validationErrors?: Record<string, string> } | string;
      message?: string;
    };

    if (typeof backendError.error === 'string' && backendError.error.trim()) {
      return backendError.error;
    }

    if (backendError.error && typeof backendError.error !== 'string') {
      const validationErrors = backendError.error.validationErrors;
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        return Object.entries(validationErrors)
          .map(([field, message]) => `${field}: ${message}`)
          .join(' | ');
      }

      if (backendError.error.message) {
        return backendError.error.message;
      }
    }

    if (backendError.message) {
      return backendError.message;
    }

    return fallbackMessage;
  }
}
