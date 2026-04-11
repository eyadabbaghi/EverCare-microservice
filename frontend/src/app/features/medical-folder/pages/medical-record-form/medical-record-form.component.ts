import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Patient, UserService } from '../../../../core/services/user.service';
import { AuthService, User } from '../../../front-office/pages/login/auth.service';
import {
  AlzheimerStage,
  BloodGroup,
  MedicalRecordCreateRequest,
  MedicalRecordResponse,
  MedicalRecordUpdateRequest,
} from '../../interfaces/medical-folder';
import { MedicalFolderService } from '../../services/medical-folder.service';

@Component({
  selector: 'app-medical-record-form',
  templateUrl: './medical-record-form.component.html',
  styleUrls: ['./medical-record-form.component.css'],
})
export class MedicalRecordFormComponent implements OnInit {
  readonly bloodGroupOptions: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  readonly alzheimerStageOptions: AlzheimerStage[] = ['MILD', 'MODERATE', 'SEVERE'];

  currentUser: User | null = null;
  accessiblePatients: Patient[] = [];
  selectedPatient: Patient | null = null;
  record: MedicalRecordResponse | null = null;

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  isEditMode = false;

  form: MedicalRecordCreateRequest = {
    patientId: '',
    bloodGroup: 'A+',
    alzheimerStage: 'MILD',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly medicalFolderService: MedicalFolderService,
  ) {}

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!routeId;

    const user = this.authService.getCurrentUserValue();
    if (user) {
      this.currentUser = user;
      this.loadFormContext(routeId);
      return;
    }

    if (this.authService.getToken()) {
      this.authService.fetchCurrentUser().subscribe({
        next: (resolvedUser) => {
          this.currentUser = resolvedUser;
          this.loadFormContext(routeId);
        },
        error: () => {
          this.errorMessage = 'Unable to resolve the current user profile.';
        },
      });
      return;
    }

    this.errorMessage = 'You need to be connected to access this page.';
  }

  get canEditRecord(): boolean {
    return this.currentUser?.role === 'DOCTOR' || this.currentUser?.role === 'ADMIN';
  }

  get isArchived(): boolean {
    return !!this.record?.archived;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Update Medical Record' : 'Create Medical Record';
  }

  get pageSubtitle(): string {
    return this.isEditMode
      ? 'Adjust stage and clinical identity fields while keeping the patient link anchored to the user service.'
      : 'Create a new dossier for a patient and initialize the Alzheimer stage follow-up.';
  }

  onPatientChange(patientId: string): void {
    this.form.patientId = patientId;
    this.selectedPatient =
      this.accessiblePatients.find((patient) => patient.userId === patientId) ?? null;
  }

  submit(): void {
    if (!this.canEditRecord) {
      this.errorMessage = 'Only doctors and admins can create or update a medical record.';
      return;
    }

    if (!this.form.patientId) {
      this.errorMessage = 'Select a patient before saving the record.';
      return;
    }

    if (this.record?.archived) {
      this.errorMessage = 'This dossier is archived. Restore it before updating it.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = this.isEditMode && this.record
      ? this.medicalFolderService.updateMedicalRecord(this.record.id, {
          bloodGroup: this.form.bloodGroup,
          alzheimerStage: this.form.alzheimerStage,
        } as MedicalRecordUpdateRequest)
      : this.medicalFolderService.createMedicalRecord({
          patientId: this.form.patientId,
          bloodGroup: this.form.bloodGroup,
          alzheimerStage: this.form.alzheimerStage,
        });

    request$.subscribe({
      next: (savedRecord) => {
        this.isSaving = false;
        this.successMessage = this.isEditMode
          ? 'Medical record updated successfully.'
          : 'Medical record created successfully.';
        void this.router.navigate(['/medical-folder', savedRecord.id]);
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = this.extractErrorMessage(error, 'Unable to save the medical record.');
      },
    });
  }

  back(): void {
    if (this.record?.id) {
      void this.router.navigate(['/medical-folder', this.record.id]);
      return;
    }

    void this.router.navigate(['/medical-folder']);
  }

  private loadFormContext(routeId: string | null): void {
    if (!this.currentUser) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const patients$ = this.userService.getPatients().pipe(catchError(() => of([] as Patient[])));

    if (!routeId) {
      patients$.subscribe({
        next: (patients) => {
          this.accessiblePatients = this.filterPatientsByRole(patients);
          if (this.accessiblePatients.length === 1) {
            this.onPatientChange(this.accessiblePatients[0].userId);
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to load patients.');
          this.isLoading = false;
        },
      });
      return;
    }

    forkJoin({
      patients: patients$,
      record: this.medicalFolderService.getMedicalRecordById(routeId),
    }).subscribe({
      next: ({ patients, record }) => {
        this.record = record;
        this.accessiblePatients = this.filterPatientsByRole(patients);
        this.form = {
          patientId: record.patientId,
          bloodGroup: (record.bloodGroup || 'A+') as BloodGroup,
          alzheimerStage: (record.alzheimerStage || 'MILD') as AlzheimerStage,
        };
        this.selectedPatient =
          this.accessiblePatients.find((patient) => patient.userId === record.patientId) ??
          null;
        if (!this.selectedPatient) {
          this.userService.getUserById(record.patientId).pipe(catchError(() => of(null))).subscribe({
            next: (patient) => {
              this.selectedPatient = patient;
            },
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Unable to load the medical record.');
        this.isLoading = false;
      },
    });
  }

  private filterPatientsByRole(patients: Patient[]): Patient[] {
    if (!this.currentUser) {
      return [];
    }

    if (this.currentUser.role === 'ADMIN') {
      return patients;
    }

    if (this.currentUser.role === 'DOCTOR' && this.currentUser.email) {
      const scoped = patients.filter((patient) => patient.doctorEmail === this.currentUser?.email);
      return scoped.length ? scoped : patients;
    }

    return patients;
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
