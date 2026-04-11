import { Component, OnInit } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { Patient, UserService } from '../../../../core/services/user.service';
import { AuthService, User } from '../../../front-office/pages/login/auth.service';
import { MedicalRecordResponse } from '../../interfaces/medical-folder';
import { MedicalFolderService } from '../../services/medical-folder.service';

type RecordStatusFilter = 'active' | 'archived' | 'all';

@Component({
  selector: 'app-medical-record-list',
  templateUrl: './medical-record-list.component.html',
  styleUrls: ['./medical-record-list.component.css'],
})
export class MedicalRecordListComponent implements OnInit {
  currentUser: User | null = null;
  records: MedicalRecordResponse[] = [];
  visibleRecords: MedicalRecordResponse[] = [];
  patients: Patient[] = [];

  isLoading = false;
  errorMessage = '';
  searchQuery = '';
  statusFilter: RecordStatusFilter = 'active';

  private readonly patientMap = new Map<string, Patient>();

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly medicalFolderService: MedicalFolderService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUserValue();
    if (user) {
      this.currentUser = user;
      this.loadRecords();
      return;
    }

    if (this.authService.getToken()) {
      this.authService.fetchCurrentUser().subscribe({
        next: (resolvedUser) => {
          this.currentUser = resolvedUser;
          this.loadRecords();
        },
        error: () => {
          this.errorMessage = 'Unable to resolve the current user profile.';
        },
      });
      return;
    }

    this.errorMessage = 'You need to be connected to access medical records.';
  }

  get isPatientRole(): boolean {
    return this.currentUser?.role === 'PATIENT';
  }

  get canCreate(): boolean {
    return this.currentUser?.role === 'DOCTOR' || this.currentUser?.role === 'ADMIN';
  }

  get canUpdate(): boolean {
    return this.currentUser?.role === 'DOCTOR' || this.currentUser?.role === 'ADMIN';
  }

  get canArchive(): boolean {
    return this.currentUser?.role === 'DOCTOR' || this.currentUser?.role === 'ADMIN';
  }

  get canRestore(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  get totalCount(): number {
    return this.records.length;
  }

  get activeCount(): number {
    return this.records.filter((record) => !record.archived).length;
  }

  get archivedCount(): number {
    return this.records.filter((record) => record.archived).length;
  }

  get criticalCount(): number {
    return this.records.filter((record) => record.alzheimerStage === 'SEVERE').length;
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.applyFilters();
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter = (value as RecordStatusFilter) || 'active';
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = this.isPatientRole ? 'all' : 'active';
    this.applyFilters();
  }

  archiveRecord(record: MedicalRecordResponse): void {
    if (!this.canArchive || record.archived) {
      return;
    }

    const reason = window.prompt('Archive reason (optional):', record.archiveReason ?? '');
    this.medicalFolderService
      .archiveMedicalRecord(record.id, {
        archivedBy: this.currentUser?.email || this.currentUser?.name || 'care-team',
        archiveReason: reason?.trim() || undefined,
      })
      .subscribe({
        next: () => this.loadRecords(false),
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to archive the record.');
        },
      });
  }

  restoreRecord(record: MedicalRecordResponse): void {
    if (!this.canRestore || !record.archived) {
      return;
    }

    this.medicalFolderService.restoreMedicalRecord(record.id).subscribe({
      next: () => this.loadRecords(false),
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Unable to restore the record.');
      },
    });
  }

  getPatientDisplayName(record: MedicalRecordResponse): string {
    const patient = this.patientMap.get(record.patientId);
    return patient?.name || patient?.email || record.patientId;
  }

  getPatientSubtitle(record: MedicalRecordResponse): string {
    const patient = this.patientMap.get(record.patientId);
    if (!patient) {
      return record.patientId;
    }

    return patient.email || record.patientId;
  }

  private loadRecords(resetError = true): void {
    if (!this.currentUser) {
      return;
    }

    this.isLoading = true;
    if (resetError) {
      this.errorMessage = '';
    }

    if (this.currentUser.role === 'PATIENT' && this.currentUser.userId) {
      this.userService.getUserById(this.currentUser.userId).pipe(
        catchError(() =>
          of({
            userId: this.currentUser?.userId || '',
            name: this.currentUser?.name || '',
            email: this.currentUser?.email || '',
            role: 'PATIENT',
          } as Patient),
        ),
      ).subscribe({
        next: (patient) => {
          this.patientMap.clear();
          this.patientMap.set(patient.userId, patient);
          this.medicalFolderService.getMedicalRecordByPatientId(patient.userId).pipe(
            catchError((error) => {
              if (error?.status === 404) {
                return of(null);
              }
              throw error;
            }),
          ).subscribe({
            next: (record) => {
              this.records = record ? [record] : [];
              this.applyFilters();
              this.isLoading = false;
            },
            error: (error) => {
              this.errorMessage = this.extractErrorMessage(error, 'Unable to load your medical record.');
              this.records = [];
              this.visibleRecords = [];
              this.isLoading = false;
            },
          });
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to resolve the patient profile.');
          this.isLoading = false;
        },
      });
      return;
    }

    forkJoin({
      records: this.medicalFolderService.getAllMedicalRecords(),
      patients: this.userService.getPatients().pipe(catchError(() => of([] as Patient[]))),
    }).subscribe({
      next: ({ records, patients }) => {
        this.patients = patients;
        this.patientMap.clear();
        patients.forEach((patient) => this.patientMap.set(patient.userId, patient));
        this.records = this.filterRecordsByRole(records, patients);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Unable to load medical records.');
        this.records = [];
        this.visibleRecords = [];
        this.isLoading = false;
      },
    });
  }

  private filterRecordsByRole(
    records: MedicalRecordResponse[],
    patients: Patient[],
  ): MedicalRecordResponse[] {
    if (!this.currentUser) {
      return [];
    }

    if (this.currentUser.role === 'ADMIN') {
      return records;
    }

    if (this.currentUser.role === 'DOCTOR') {
      return records;
    }

    if (this.currentUser.role === 'CAREGIVER' && this.currentUser.email) {
      const patientIds = new Set(
        patients
          .filter((patient) => patient.caregiverEmails?.includes(this.currentUser?.email || ''))
          .map((patient) => patient.userId),
      );
      return records.filter((record) => patientIds.has(record.patientId));
    }

    return records;
  }

  private applyFilters(): void {
    const query = this.searchQuery.trim().toLowerCase();

    this.visibleRecords = this.records.filter((record) => {
      if (this.statusFilter === 'active' && record.archived) {
        return false;
      }

      if (this.statusFilter === 'archived' && !record.archived) {
        return false;
      }

      if (!query) {
        return true;
      }

      const patient = this.patientMap.get(record.patientId);
      const haystack = [
        record.patientId,
        patient?.name || '',
        patient?.email || '',
        record.alzheimerStage || '',
        record.bloodGroup || '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
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
