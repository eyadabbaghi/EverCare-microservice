import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Patient, UserService } from '../../../../core/services/user.service';
import { AuthService, User } from '../../../front-office/pages/login/auth.service';
import {
  AlzheimerStage,
  MedicalDocumentCreateRequest,
  MedicalDocumentUpdateRequest,
  MedicalHistoryCreateRequest,
  MedicalHistoryUpdateRequest,
  MedicalRecordArchiveRequest,
  MedicalRecordDocument,
  MedicalRecordHistory,
  MedicalRecordResponse,
  AssessmentReport,
  AssessmentReportCreateRequest,
  AssessmentReportUpdateRequest,
} from '../../interfaces/medical-folder';
import { MedicalFolderService } from '../../services/medical-folder.service';

@Component({
  selector: 'app-medical-record-details',
  templateUrl: './medical-record-details.component.html',
  styleUrls: ['./medical-record-details.component.css'],
})
export class MedicalRecordDetailsComponent implements OnInit {
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
  readonly alzheimerStageOptions: AlzheimerStage[] = ['MILD', 'MODERATE', 'SEVERE'];

  currentUser: User | null = null;
  record: MedicalRecordResponse | null = null;
  patient: Patient | null = null;
  histories: MedicalRecordHistory[] = [];
  documents: MedicalRecordDocument[] = [];
  reports: AssessmentReport[] = [];

  isLoading = false;
  isSavingHistory = false;
  isSavingDocument = false;
  isSavingReport = false;
  isArchiving = false;
  isDeleting = false;
  errorMessage = '';
  successMessage = '';

  historyForm: MedicalHistoryCreateRequest = this.createDefaultHistoryForm();
  documentForm: MedicalDocumentCreateRequest = this.createDefaultDocumentForm();
  reportForm: AssessmentReportCreateRequest = this.createDefaultReportForm();

  editingHistoryId: string | null = null;
  editingDocumentId: string | null = null;
  editingReportId: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly medicalFolderService: MedicalFolderService,
  ) {}

  ngOnInit(): void {
    const recordId = this.route.snapshot.paramMap.get('id');
    if (!recordId) {
      this.errorMessage = 'Medical record id is missing.';
      return;
    }

    const user = this.authService.getCurrentUserValue();
    if (user) {
      this.currentUser = user;
      this.loadRecord(recordId);
      return;
    }

    if (this.authService.getToken()) {
      this.authService.fetchCurrentUser().subscribe({
        next: (resolvedUser) => {
          this.currentUser = resolvedUser;
          this.loadRecord(recordId);
        },
        error: () => {
          this.errorMessage = 'Unable to resolve the current user profile.';
        },
      });
      return;
    }

    this.errorMessage = 'You need to be connected to access this page.';
  }

  get isDoctorOrAdmin(): boolean {
    return this.currentUser?.role === 'DOCTOR' || this.currentUser?.role === 'ADMIN';
  }

  get canEditRecord(): boolean {
    return this.isDoctorOrAdmin && !!this.record && !this.record.archived;
  }

  get canArchiveRecord(): boolean {
    return this.isDoctorOrAdmin && !!this.record && !this.record.archived;
  }

  get canRestoreRecord(): boolean {
    return this.currentUser?.role === 'ADMIN' && !!this.record && !!this.record.archived;
  }

  get canDeleteRecord(): boolean {
    return this.isDoctorOrAdmin && !!this.record;
  }

  get latestReport(): AssessmentReport | null {
    return this.reports[0] ?? null;
  }

  get completionScore(): number {
    if (!this.record) {
      return 0;
    }

    let total = 35;

    if (this.record.bloodGroup) {
      total += 10;
    }

    if (this.record.alzheimerStage) {
      total += 15;
    }

    if (this.histories.length) {
      total += 15;
    }

    if (this.documents.length) {
      total += 10;
    }

    if (this.reports.length) {
      total += 15;
    }

    return Math.min(total, 100);
  }

  get completionLabel(): string {
    if (this.completionScore >= 90) {
      return 'Dossier almost complete';
    }

    if (this.completionScore >= 65) {
      return 'Dossier progressing well';
    }

    return 'Dossier needs enrichment';
  }

  submitHistory(): void {
    if (!this.record || !this.canEditRecord) {
      this.errorMessage = this.record?.archived
        ? 'This dossier is archived. History changes are blocked.'
        : 'Only doctors and admins can manage medical history.';
      return;
    }

    if (!this.historyForm.description.trim()) {
      this.errorMessage = 'History description is required.';
      return;
    }

    this.isSavingHistory = true;
    this.errorMessage = '';

    const payload: MedicalHistoryCreateRequest | MedicalHistoryUpdateRequest = {
      type: this.historyForm.type,
      date: this.historyForm.date,
      description: this.historyForm.description.trim(),
    };

    const request$ = this.editingHistoryId
      ? this.medicalFolderService.updateHistory(this.record.id, this.editingHistoryId, payload)
      : this.medicalFolderService.createHistory(this.record.id, payload);

    request$.subscribe({
      next: () => {
        this.isSavingHistory = false;
        this.successMessage = this.editingHistoryId
          ? 'History entry updated successfully.'
          : 'History entry added successfully.';
        this.resetHistoryComposer();
        this.reloadNestedData();
      },
      error: (error) => {
        this.isSavingHistory = false;
        this.errorMessage = this.extractErrorMessage(error, 'Unable to save the history entry.');
      },
    });
  }

  startHistoryEdit(history: MedicalRecordHistory): void {
    if (!this.canEditRecord) {
      return;
    }

    this.editingHistoryId = history.id;
    this.historyForm = {
      type: history.type,
      date: history.date,
      description: history.description,
    };
  }

  cancelHistoryEdit(): void {
    this.resetHistoryComposer();
  }

  deleteHistory(historyId: string): void {
    if (!this.record || !this.canEditRecord) {
      return;
    }

    if (!window.confirm('Delete this history entry?')) {
      return;
    }

    this.medicalFolderService.deleteHistory(this.record.id, historyId).subscribe({
      next: () => {
        this.successMessage = 'History entry deleted successfully.';
        this.reloadNestedData();
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Unable to delete the history entry.');
      },
    });
  }

  submitDocument(): void {
    if (!this.record || !this.canEditRecord) {
      this.errorMessage = this.record?.archived
        ? 'This dossier is archived. Document changes are blocked.'
        : 'Only doctors and admins can manage document metadata.';
      return;
    }

    if (!this.documentForm.fileName.trim() || !this.documentForm.filePath.trim()) {
      this.errorMessage = 'Document name and path are required.';
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
      ? this.medicalFolderService.updateDocument(this.record.id, this.editingDocumentId, payload)
      : this.medicalFolderService.createDocument(this.record.id, payload);

    request$.subscribe({
      next: () => {
        this.isSavingDocument = false;
        this.successMessage = this.editingDocumentId
          ? 'Document updated successfully.'
          : 'Document added successfully.';
        this.resetDocumentComposer();
        this.reloadNestedData();
      },
      error: (error) => {
        this.isSavingDocument = false;
        this.errorMessage = this.extractErrorMessage(error, 'Unable to save the document.');
      },
    });
  }

  startDocumentEdit(document: MedicalRecordDocument): void {
    if (!this.canEditRecord) {
      return;
    }

    this.editingDocumentId = document.id;
    this.documentForm = {
      fileName: document.fileName,
      fileType: document.fileType,
      filePath: document.filePath,
    };
  }

  cancelDocumentEdit(): void {
    this.resetDocumentComposer();
  }

  deleteDocument(documentId: string): void {
    if (!this.record || !this.canEditRecord) {
      return;
    }

    if (!window.confirm('Delete this document reference?')) {
      return;
    }

    this.medicalFolderService.deleteDocument(this.record.id, documentId).subscribe({
      next: () => {
        this.successMessage = 'Document deleted successfully.';
        this.reloadNestedData();
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Unable to delete the document.');
      },
    });
  }

  submitReport(): void {
    if (!this.record || !this.canEditRecord) {
      this.errorMessage = this.record?.archived
        ? 'This dossier is archived. Report changes are blocked.'
        : 'Only doctors and admins can manage reports.';
      return;
    }

    if (!this.reportForm.recommendation.trim() || !this.reportForm.summary.trim()) {
      this.errorMessage = 'Report recommendation and summary are required.';
      return;
    }

    this.isSavingReport = true;
    this.errorMessage = '';

    const payload: AssessmentReportCreateRequest | AssessmentReportUpdateRequest = {
      reportType: this.reportForm.reportType,
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
      ? this.medicalFolderService.updateReport(this.record.id, this.editingReportId, payload)
      : this.medicalFolderService.createReport(this.record.id, payload);

    request$.subscribe({
      next: () => {
        this.isSavingReport = false;
        this.successMessage = this.editingReportId
          ? 'Assessment report updated successfully.'
          : 'Assessment report added successfully.';
        this.resetReportComposer();
        this.reloadNestedData();
      },
      error: (error) => {
        this.isSavingReport = false;
        this.errorMessage = this.extractErrorMessage(error, 'Unable to save the report.');
      },
    });
  }

  startReportEdit(report: AssessmentReport): void {
    if (!this.canEditRecord) {
      return;
    }

    this.editingReportId = report.id;
    this.reportForm = {
      reportType: report.reportType,
      score: report.score,
      stage: (report.stage || 'MILD') as AlzheimerStage,
      recommendation: report.recommendation,
      summary: report.summary,
      author: report.author || '',
      assessmentDate: report.assessmentDate,
    };
  }

  cancelReportEdit(): void {
    this.resetReportComposer();
  }

  deleteReport(reportId: string): void {
    if (!this.record || !this.canEditRecord) {
      return;
    }

    if (!window.confirm('Delete this assessment report?')) {
      return;
    }

    this.medicalFolderService.deleteReport(this.record.id, reportId).subscribe({
      next: () => {
        this.successMessage = 'Assessment report deleted successfully.';
        this.reloadNestedData();
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Unable to delete the report.');
      },
    });
  }

  archiveRecord(): void {
    if (!this.record || !this.canArchiveRecord) {
      return;
    }

    const reason = window.prompt('Archive reason (optional):', this.record.archiveReason ?? '');
    const payload: MedicalRecordArchiveRequest = {
      archivedBy: this.currentUser?.email || this.currentUser?.name || 'care-team',
      archiveReason: reason?.trim() || undefined,
    };

    this.isArchiving = true;
    this.medicalFolderService.archiveMedicalRecord(this.record.id, payload).subscribe({
      next: () => {
        this.successMessage = 'Medical record archived successfully.';
        this.isArchiving = false;
        this.reloadAll();
      },
      error: (error) => {
        this.isArchiving = false;
        this.errorMessage = this.extractErrorMessage(error, 'Unable to archive the record.');
      },
    });
  }

  restoreRecord(): void {
    if (!this.record || !this.canRestoreRecord) {
      return;
    }

    this.isArchiving = true;
    this.medicalFolderService.restoreMedicalRecord(this.record.id).subscribe({
      next: () => {
        this.successMessage = 'Medical record restored successfully.';
        this.isArchiving = false;
        this.reloadAll();
      },
      error: (error) => {
        this.isArchiving = false;
        this.errorMessage = this.extractErrorMessage(error, 'Unable to restore the record.');
      },
    });
  }

  deleteRecord(): void {
    if (!this.record || !this.canDeleteRecord) {
      return;
    }

    const patientLabel = this.patient?.name || this.patient?.email || this.record.patientId;
    const confirmed = window.confirm(
      `Delete the medical record for ${patientLabel}? This action permanently removes the dossier.`,
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.medicalFolderService.deleteMedicalRecord(this.record.id).subscribe({
      next: () => {
        this.isDeleting = false;
        void this.router.navigate(['/medical-folder']);
      },
      error: (error) => {
        this.isDeleting = false;
        this.errorMessage = this.extractErrorMessage(error, 'Unable to delete the record.');
      },
    });
  }

  openDocument(document: MedicalRecordDocument): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.open(document.filePath, '_blank', 'noopener');
  }

  openReportsList(): void {
    if (!this.record) {
      return;
    }

    void this.router.navigate(['/medical-folder/reports'], {
      queryParams: { patientId: this.record.patientId },
    });
  }

  backToList(): void {
    void this.router.navigate(['/medical-folder']);
  }

  private loadRecord(recordId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      record: this.medicalFolderService.getMedicalRecordById(recordId),
    }).subscribe({
      next: ({ record }) => {
        this.record = record;
        this.reloadAll();
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Unable to load the medical record.');
        this.isLoading = false;
      },
    });
  }

  private reloadAll(): void {
    if (!this.record) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    forkJoin({
      patient: this.userService.getUserById(this.record.patientId).pipe(catchError(() => of(null))),
      histories: this.medicalFolderService.getHistories(this.record.id).pipe(catchError(() => of([]))),
      documents: this.medicalFolderService.getDocuments(this.record.id).pipe(catchError(() => of([]))),
      reports: this.medicalFolderService.getReports(this.record.id).pipe(catchError(() => of([]))),
      freshRecord: this.medicalFolderService.getMedicalRecordById(this.record.id),
    }).subscribe({
      next: ({ patient, histories, documents, reports, freshRecord }) => {
        this.record = freshRecord;
        this.patient = patient;
        this.histories = [...histories].sort((a, b) => b.date.localeCompare(a.date));
        this.documents = [...documents].sort((a, b) => a.fileName.localeCompare(b.fileName));
        this.reports = [...reports].sort((a, b) =>
          `${b.assessmentDate}-${b.createdAt ?? ''}`.localeCompare(`${a.assessmentDate}-${a.createdAt ?? ''}`),
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Unable to refresh the record details.');
        this.isLoading = false;
      },
    });
  }

  private reloadNestedData(): void {
    this.successMessage = this.successMessage;
    this.reloadAll();
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

  private extractErrorMessage(error: unknown, fallbackMessage: string): string {
    const backendError = error as {
      error?: { message?: string } | string;
      message?: string;
    };

    if (typeof backendError.error === 'string' && backendError.error.trim()) {
      return backendError.error;
    }

    if (backendError.error && typeof backendError.error !== 'string' && backendError.error.message) {
      return backendError.error.message;
    }

    return backendError.message || fallbackMessage;
  }
}
