import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService, UpdateUserRequest, User } from '../login/auth.service';
import { AlzheimerStage, BloodGroup, MedicalRecordResponse } from '../../../medical-folder/interfaces/medical-folder';
import { MedicalFolderService } from '../../../medical-folder/services/medical-folder.service';

@Component({
  selector: 'app-setup-profile',
  templateUrl: './setup-profile.component.html',
})
export class SetupProfileComponent implements OnInit {
  readonly bloodGroupOptions: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  readonly alzheimerStageOptions: AlzheimerStage[] = ['MILD', 'MODERATE', 'SEVERE'];

  profileForm: FormGroup;
  profileImage: string | null = null;
  selectedFile: File | null = null;
  isLoading = false;
  isInitializing = true;
  currentUser: User | null = null;
  existingRecord: MedicalRecordResponse | null = null;

  // User data from registration (passed via state)
  name: string = '';
  email: string = '';
  role: string = '';

  // For conditional rendering
  workplaceType: 'hospital' | 'private' = 'hospital';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private authService: AuthService,
    private medicalFolderService: MedicalFolderService,
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { name: string; email: string; role: string } | undefined;
    if (state) {
      this.name = state.name;
      this.email = state.email;
      this.role = state.role;
    }

    // Build form with all possible fields
    this.profileForm = this.fb.group({
      dateOfBirth: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-() ]+$/)]],
      emergencyContact: [''],           // initially no validator
      connectedEmail: ['', Validators.email], // email validator only, not required
      doctorEmail: ['', Validators.email],
      yearsExperience: [''],
      specialization: [''],
      medicalLicense: [''],
      workplace: [''],
      bloodGroup: ['O+' as BloodGroup],
      alzheimerStage: ['MILD' as AlzheimerStage],
      symptomDuration: ['NOT_SURE'],
      autonomyLevel: ['INDEPENDENT'],
      currentSymptoms: [''],
      medicalBackground: [''],
      currentTreatments: [''],
      patientGoal: [''],
    });

    this.updateValidators();
  }

  ngOnInit(): void {
    this.loadUserContext();
  }

  get isPatientOnboarding(): boolean {
    return this.role === 'PATIENT' && !this.existingRecord;
  }

  get submitLabel(): string {
    if (this.isPatientOnboarding) {
      return 'Create My Medical Record';
    }

    return 'Complete Profile Setup';
  }

  private loadUserContext(): void {
    if (!this.authService.getToken()) {
      this.isInitializing = false;
      this.toastr.info('Please sign in again to continue your onboarding.');
      void this.router.navigate(['/login']);
      return;
    }

    const storedUser = this.authService.getCurrentUserValue();
    if (storedUser) {
      this.applyUserContext(storedUser);
      return;
    }

    this.authService.fetchCurrentUser().subscribe({
      next: (user) => this.applyUserContext(user),
      error: (err) => {
        console.error('Failed to resolve current user for setup-profile', err);
        this.isInitializing = false;
        this.toastr.error('Unable to load your account context. Please sign in again.');
        void this.router.navigate(['/login']);
      },
    });
  }

  private applyUserContext(user: User): void {
    this.currentUser = user;
    this.name = user.name || this.name;
    this.email = user.email || this.email;
    this.role = user.role || this.role;

    if (this.role === 'PATIENT') {
      this.isInitializing = false;
      void this.router.navigate(['/patient-intake']);
      return;
    }

    this.patchProfileForm(user);
    this.updateValidators();

    this.isInitializing = false;
  }

  private patchProfileForm(user: User): void {
    this.profileForm.patchValue({
      dateOfBirth: this.normalizeDateForInput(user.dateOfBirth),
      phoneNumber: user.phone || '',
      emergencyContact: user.emergencyContact || '',
      connectedEmail: this.resolveConnectedEmail(user),
      doctorEmail: user.doctorEmail || '',
      yearsExperience: user.yearsExperience ?? '',
      specialization: user.specialization || '',
      medicalLicense: user.medicalLicense || '',
      workplace: user.workplaceName || '',
    });

    if (user.profilePicture) {
      this.profileImage = user.profilePicture;
    }
  }

  private resolveConnectedEmail(user: User): string {
    if (user.role === 'PATIENT') {
      return user.caregiverEmails?.[0] || '';
    }

    if (user.role === 'CAREGIVER') {
      return user.patientEmails?.[0] || '';
    }

    return '';
  }

  private checkExistingMedicalRecord(patientId: string): void {
    this.medicalFolderService.getMedicalRecordByPatientId(patientId).subscribe({
      next: (record) => {
        this.existingRecord = record;
        this.isInitializing = false;
        this.toastr.info('Your medical record is already available.');
        this.resolveRouteAfterProfileSetup(record);
      },
      error: (error) => {
        this.isInitializing = false;

        if (error?.status === 404) {
          this.existingRecord = null;
          return;
        }

        this.toastr.warning(
          this.extractErrorMessage(
            error,
            'Unable to verify your medical record yet. You can still complete your profile.',
          ),
        );
      },
    });
  }

  /**
   * Dynamically set required validators based on role.
   */
  private updateValidators(): void {
    const dateOfBirthControl = this.profileForm.get('dateOfBirth');
    const phoneNumberControl = this.profileForm.get('phoneNumber');
    const emergencyControl = this.profileForm.get('emergencyContact');
    const yearsControl = this.profileForm.get('yearsExperience');
    const workplaceControl = this.profileForm.get('workplace');
    const doctorEmailControl = this.profileForm.get('doctorEmail');
    const bloodGroupControl = this.profileForm.get('bloodGroup');
    const alzheimerStageControl = this.profileForm.get('alzheimerStage');
    const symptomDurationControl = this.profileForm.get('symptomDuration');
    const autonomyLevelControl = this.profileForm.get('autonomyLevel');
    const currentSymptomsControl = this.profileForm.get('currentSymptoms');
    const medicalBackgroundControl = this.profileForm.get('medicalBackground');
    const patientGoalControl = this.profileForm.get('patientGoal');

    // Clear all role‑specific validators first
    dateOfBirthControl?.clearValidators();
    phoneNumberControl?.clearValidators();
    emergencyControl?.clearValidators();
    yearsControl?.clearValidators();
    workplaceControl?.clearValidators();
    doctorEmailControl?.clearValidators();
    bloodGroupControl?.clearValidators();
    alzheimerStageControl?.clearValidators();
    symptomDurationControl?.clearValidators();
    autonomyLevelControl?.clearValidators();
    currentSymptomsControl?.clearValidators();
    medicalBackgroundControl?.clearValidators();
    patientGoalControl?.clearValidators();

    if (this.role !== 'PATIENT') {
      dateOfBirthControl?.setValidators(Validators.required);
      phoneNumberControl?.setValidators([Validators.required, Validators.pattern(/^[0-9+\-() ]+$/)]);
    }

    if (this.role === 'PATIENT' || this.role === 'CAREGIVER') {
      // emergency contact is required for patients and caregivers
      emergencyControl?.setValidators(Validators.required);
    }

    if (this.role === 'PATIENT') {
      doctorEmailControl?.setValidators([Validators.required, Validators.email]);
      bloodGroupControl?.setValidators(Validators.required);
      alzheimerStageControl?.setValidators(Validators.required);
      currentSymptomsControl?.setValidators([Validators.required, Validators.minLength(8)]);
    } else if (this.role === 'DOCTOR') {
      // experience and workplace required for doctors
      yearsControl?.setValidators([Validators.required, Validators.min(0), Validators.max(60)]);
      workplaceControl?.setValidators(Validators.required);
      // emergency contact is optional for doctors
    }

    // Update validity
    dateOfBirthControl?.updateValueAndValidity();
    phoneNumberControl?.updateValueAndValidity();
    emergencyControl?.updateValueAndValidity();
    yearsControl?.updateValueAndValidity();
    workplaceControl?.updateValueAndValidity();
    doctorEmailControl?.updateValueAndValidity();
    bloodGroupControl?.updateValueAndValidity();
    alzheimerStageControl?.updateValueAndValidity();
    symptomDurationControl?.updateValueAndValidity();
    autonomyLevelControl?.updateValueAndValidity();
    currentSymptomsControl?.updateValueAndValidity();
    medicalBackgroundControl?.updateValueAndValidity();
    patientGoalControl?.updateValueAndValidity();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(): void {
    document.getElementById('profile-picture-input')?.click();
  }

  getInitials(): string {
    return this.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  getRoleColor(): string {
    switch (this.role) {
      case 'PATIENT': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'CAREGIVER': return 'bg-green-100 text-green-700 border-green-300';
      case 'DOCTOR': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  }

  onSubmit(): void {
    if (this.isInitializing || !this.currentUser) {
      this.toastr.warning('Your account context is still loading. Please wait a moment.');
      return;
    }

    // Log invalid fields for debugging
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        const control = this.profileForm.get(key);
        if (control?.invalid) {
          console.log(`Field ${key} is invalid:`, control.errors);
        }
      });
      this.profileForm.markAllAsTouched();
      this.toastr.warning('Please fill all required fields correctly');
      return;
    }

    this.isLoading = true;

    const formValue = this.profileForm.value;
    const updateData: UpdateUserRequest = {};

    if (formValue.dateOfBirth && String(formValue.dateOfBirth).trim() !== '') {
      updateData.dateOfBirth = String(formValue.dateOfBirth).trim();
    }

    if (formValue.phoneNumber && String(formValue.phoneNumber).trim() !== '') {
      updateData.phone = String(formValue.phoneNumber).trim();
    }

    // Only include emergencyContact if it has a value (doctors may leave it blank)
    if (formValue.emergencyContact && formValue.emergencyContact.trim() !== '') {
      updateData.emergencyContact = formValue.emergencyContact.trim();
    }

    // Only include connectedEmail if not empty
    if (formValue.connectedEmail && formValue.connectedEmail.trim() !== '') {
      updateData.connectedEmail = formValue.connectedEmail.trim();
    }

    if (this.role === 'PATIENT') {
      updateData.doctorEmail = formValue.doctorEmail?.trim();
    }

    if (this.role === 'DOCTOR') {
      updateData.yearsExperience = formValue.yearsExperience ? parseInt(formValue.yearsExperience) : undefined;
      updateData.specialization = formValue.specialization;
      updateData.medicalLicense = formValue.medicalLicense;
      updateData.workplaceType = this.workplaceType;
      updateData.workplaceName = formValue.workplace;
    }

    if (Object.keys(updateData).length === 0) {
      this.finalizeProfileFlow(this.currentUser);
      return;
    }

    // If a profile picture was selected, upload it first
    if (this.selectedFile) {
      this.authService.uploadProfilePicture(this.selectedFile).subscribe({
        next: (picResponse) => {
          updateData.profilePicture = picResponse.profilePicture;
          this.sendProfileUpdate(updateData);
        },
        error: (err) => {
          this.toastr.error('Failed to upload profile picture');
          this.isLoading = false;
        }
      });
    } else {
      this.sendProfileUpdate(updateData);
    }
  }

  private sendProfileUpdate(updateData: UpdateUserRequest): void {
    this.authService.updateProfile(updateData).subscribe({
      next: () => {
        this.authService.fetchCurrentUser().subscribe({
          next: (user) => this.finalizeProfileFlow(user),
          error: () => this.finalizeProfileFlow(this.currentUser),
        });
      },
      error: (err) => {
        console.error('Profile update failed', err);
        const errorMsg = err.error?.message || 'Failed to save profile. Please try again.';
        this.toastr.error(errorMsg);
        this.isLoading = false;
      }
    });
  }

  private finalizeProfileFlow(user: User | null): void {
    if (user) {
      this.currentUser = user;
    }

    if (this.role === 'PATIENT' && !this.existingRecord) {
      if (!this.currentUser?.userId) {
        this.isLoading = false;
        this.toastr.error('Your profile was saved, but your patient identifier is missing.');
        return;
      }

      this.createMedicalRecordForPatient(this.currentUser.userId);
      return;
    }

    this.toastr.success('Profile setup complete!');
    this.isLoading = false;
    this.resolveRouteAfterProfileSetup(this.existingRecord);
  }

  private createMedicalRecordForPatient(patientId: string): void {
    const formValue = this.profileForm.getRawValue();

    this.medicalFolderService.autoCreateMedicalRecord({
      patientId,
      bloodGroup: formValue.bloodGroup as BloodGroup,
      alzheimerStage: formValue.alzheimerStage as AlzheimerStage,
    }).subscribe({
      next: (record) => {
        this.existingRecord = record;
        this.savePatientIntakeSummary(record.id, formValue);
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error(
          this.extractErrorMessage(
            error,
            'Your profile was saved, but the medical record could not be created yet.',
          ),
        );
      },
    });
  }

  private savePatientIntakeSummary(recordId: string, formValue: any): void {
    const submittedAt = new Date().toISOString().slice(0, 10);
    const summaryLines = [
      'Initial patient first-login intake submitted.',
      `Main concern: ${formValue.currentSymptoms?.trim() || 'Not provided'}`,
      `Medical background: ${formValue.medicalBackground?.trim() || 'Not provided'}`,
      `Declared Alzheimer stage: ${formValue.alzheimerStage || 'Not provided'}`,
      `Doctor email: ${formValue.doctorEmail?.trim() || 'Not provided'}`,
      `Caregiver email: ${formValue.connectedEmail?.trim() || 'Not provided'}`,
      `Emergency contact: ${formValue.emergencyContact?.trim() || 'Not provided'}`,
    ];

    this.medicalFolderService.createHistory(recordId, {
      type: 'ONBOARDING',
      date: submittedAt,
      description: summaryLines.join('\n'),
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastr.success('Medical record created successfully!');
        this.resolveRouteAfterProfileSetup(this.existingRecord);
      },
      error: () => {
        this.isLoading = false;
        this.toastr.success('Medical record created successfully!');
        this.toastr.warning('The initial intake summary could not be written into the medical history.');
        this.resolveRouteAfterProfileSetup(this.existingRecord);
      },
    });
  }

  private resolveRouteAfterProfileSetup(record?: MedicalRecordResponse | null): void {
    if (this.role === 'PATIENT' && record?.id) {
      void this.router.navigate(['/medical-folder', record.id]);
      return;
    }

    if (this.role === 'DOCTOR' || this.role === 'ADMIN') {
      void this.router.navigate(['/medical-folder']);
      return;
    }

    void this.router.navigate(['/']);
  }

  private normalizeDateForInput(date?: string): string {
    if (!date) {
      return '';
    }

    return date.slice(0, 10);
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
