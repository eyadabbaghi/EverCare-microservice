import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService, User } from '../login/auth.service';
import {
  AlzheimerStage,
  AssessmentReportCreateRequest,
  MedicalHistoryCreateRequest,
  MedicalRecordResponse,
} from '../../../medical-folder/interfaces/medical-folder';
import { MedicalFolderService } from '../../../medical-folder/services/medical-folder.service';

type ScreeningKey =
  | 'memoryChanges'
  | 'orientationIssues'
  | 'dailyAutonomy'
  | 'communicationIssues'
  | 'behaviorChanges';

type DetectionLevel = 'STABLE' | 'EARLY' | 'MIDDLE' | 'ADVANCED';

interface ScreeningOption {
  label: string;
  value: number;
}

interface ScreeningQuestion {
  key: ScreeningKey;
  label: string;
  helper: string;
  options: ScreeningOption[];
}

interface ScreeningResult {
  rawScore: number;
  scoreOn100: number;
  detectionLevel: DetectionLevel;
  detectedLabel: string;
  medicalStage: AlzheimerStage;
  recommendation: string;
  badgeClasses: string;
}

@Component({
  selector: 'app-patient-intake',
  templateUrl: './patient-intake.component.html',
})
export class PatientIntakeComponent implements OnInit {
  readonly screeningQuestions: ScreeningQuestion[] = [
    {
      key: 'memoryChanges',
      label: 'How often do memory lapses affect you?',
      helper: 'Choose the option that best reflects the last few weeks.',
      options: [
        { label: 'Almost never', value: 0 },
        { label: 'Sometimes, but still manageable', value: 1 },
        { label: 'Frequent and noticeable', value: 2 },
        { label: 'Very frequent and disabling', value: 3 },
      ],
    },
    {
      key: 'orientationIssues',
      label: 'How often do you feel disoriented in time or place?',
      helper: 'For example: confusion about dates, location, or routine landmarks.',
      options: [
        { label: 'Never or almost never', value: 0 },
        { label: 'Occasionally', value: 1 },
        { label: 'Repeated episodes', value: 2 },
        { label: 'Often and difficult to control', value: 3 },
      ],
    },
    {
      key: 'dailyAutonomy',
      label: 'How much help do you need for daily activities?',
      helper: 'Think about medication, meals, appointments, or moving around safely.',
      options: [
        { label: 'Fully independent', value: 0 },
        { label: 'Needs reminders sometimes', value: 1 },
        { label: 'Needs help every day', value: 2 },
        { label: 'Depends heavily on another person', value: 3 },
      ],
    },
    {
      key: 'communicationIssues',
      label: 'How difficult is it to speak clearly or follow conversations?',
      helper: 'Choose the closest communication profile for you right now.',
      options: [
        { label: 'No real difficulty', value: 0 },
        { label: 'Sometimes searching for words', value: 1 },
        { label: 'Frequent communication blocks', value: 2 },
        { label: 'Major communication difficulty', value: 3 },
      ],
    },
    {
      key: 'behaviorChanges',
      label: 'How important are mood or behavior changes right now?',
      helper: 'For example: irritability, anxiety, agitation, withdrawal, or sleep disruption.',
      options: [
        { label: 'No notable change', value: 0 },
        { label: 'Mild changes', value: 1 },
        { label: 'Clear and repeated changes', value: 2 },
        { label: 'Strong changes that need supervision', value: 3 },
      ],
    },
  ];

  intakeForm: FormGroup;
  isInitializing = true;
  isSubmitting = false;
  currentUser: User | null = null;
  existingRecord: MedicalRecordResponse | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly toastr: ToastrService,
    private readonly authService: AuthService,
    private readonly medicalFolderService: MedicalFolderService,
  ) {
    this.intakeForm = this.fb.group({
      memoryChanges: [null, Validators.required],
      orientationIssues: [null, Validators.required],
      dailyAutonomy: [null, Validators.required],
      communicationIssues: [null, Validators.required],
      behaviorChanges: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadContext();
  }

  get answeredQuestions(): number {
    return this.screeningQuestions.filter((question) => this.intakeForm.get(question.key)?.value !== null).length;
  }

  get maxQuestionScore(): number {
    return this.screeningQuestions.length * 3;
  }

  get screeningResult(): ScreeningResult | null {
    if (!this.screeningQuestions.every((question) => this.intakeForm.get(question.key)?.value !== null)) {
      return null;
    }

    const rawScore = this.screeningQuestions.reduce(
      (total, question) => total + Number(this.intakeForm.get(question.key)?.value || 0),
      0,
    );
    const scoreOn100 = Math.round((rawScore / this.maxQuestionScore) * 100);

    if (rawScore <= 2) {
      return {
        rawScore,
        scoreOn100,
        detectionLevel: 'STABLE',
        detectedLabel: 'Stable profile / low alert',
        medicalStage: 'MILD',
        recommendation:
          'No major cognitive alert is suggested by this intake form. Continue routine follow-up and seek medical review if symptoms evolve.',
        badgeClasses: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      };
    }

    if (rawScore <= 6) {
      return {
        rawScore,
        scoreOn100,
        detectionLevel: 'EARLY',
        detectedLabel: 'Early signs detected',
        medicalStage: 'MILD',
        recommendation:
          'An early medical follow-up is recommended, with symptom monitoring and memory-support routines.',
        badgeClasses: 'bg-sky-100 text-sky-700 border-sky-200',
      };
    }

    if (rawScore <= 10) {
      return {
        rawScore,
        scoreOn100,
        detectionLevel: 'MIDDLE',
        detectedLabel: 'Middle stage suspicion',
        medicalStage: 'MODERATE',
        recommendation:
          'A structured neurological follow-up and caregiver coordination are recommended from the start.',
        badgeClasses: 'bg-amber-100 text-amber-700 border-amber-200',
      };
    }

    return {
      rawScore,
      scoreOn100,
      detectionLevel: 'ADVANCED',
      detectedLabel: 'Advanced stage suspicion',
      medicalStage: 'SEVERE',
      recommendation:
        'A priority specialist review is recommended, with daily support planning and close medical supervision.',
      badgeClasses: 'bg-rose-100 text-rose-700 border-rose-200',
    };
  }

  submit(): void {
    if (this.isInitializing || !this.currentUser) {
      this.toastr.warning('Your account is still loading. Please wait a moment.');
      return;
    }

    if (this.intakeForm.invalid) {
      this.intakeForm.markAllAsTouched();
      this.toastr.warning('Please answer all screening questions before creating the dossier.');
      return;
    }

    const result = this.screeningResult;
    if (!result) {
      this.toastr.warning('The screening score could not be calculated.');
      return;
    }

    if (!this.currentUser.userId) {
      this.toastr.error('Your patient identifier is missing. Please sign in again.');
      return;
    }

    this.isSubmitting = true;
    this.medicalFolderService.autoCreateMedicalRecord({
      patientId: this.currentUser.userId,
      bloodGroup: 'O+',
      alzheimerStage: result.medicalStage,
    }).pipe(
      catchError((error) => {
        if (!this.isExistingRecordError(error)) {
          return throwError(() => error);
        }

        return this.medicalFolderService.getMedicalRecordByPatientId(this.currentUser?.userId || '').pipe(
          map((record) => ({ record, existed: true })),
        );
      }),
      map((response) => {
        if ('record' in response && 'existed' in response) {
          return response;
        }

        return { record: response, existed: false };
      }),
      switchMap(({ record, existed }) => {
        this.existingRecord = record;
        if (existed) {
          return of({ record, history: null, report: null, existed: true });
        }

        const historyPayload = this.buildHistoryPayload(result);
        const reportPayload = this.buildReportPayload(result);

        return forkJoin({
          record: of(record),
          history: this.medicalFolderService.createHistory(record.id, historyPayload).pipe(catchError(() => of(null))),
          report: this.medicalFolderService.createReport(record.id, reportPayload).pipe(catchError(() => of(null))),
          existed: of(false),
        });
      }),
    ).subscribe({
      next: ({ record, history, report, existed }) => {
        this.isSubmitting = false;
        if (existed) {
          this.toastr.info('A medical dossier already exists for this patient. It has been opened directly.');
        } else {
          this.toastr.success('Your medical dossier was created successfully.');
        }

        if (!existed && (!history || !report)) {
          this.toastr.warning('The dossier exists, but some clinical initialization data could not be saved completely.');
        }

        void this.router.navigate(['/medical-folder', record.id]);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.toastr.error(this.extractErrorMessage(error, 'Unable to create the medical dossier right now.'));
      },
    });
  }

  getOptionLabel(question: ScreeningQuestion, value: number | null): string {
    if (value === null || value === undefined) {
      return 'Not answered';
    }

    return question.options.find((option) => option.value === Number(value))?.label || 'Not answered';
  }

  isSelected(questionKey: ScreeningKey, optionValue: number): boolean {
    return Number(this.intakeForm.get(questionKey)?.value) === optionValue;
  }

  private loadContext(): void {
    if (!this.authService.getToken()) {
      this.isInitializing = false;
      this.toastr.info('Please sign in again to continue.');
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
      error: (error) => {
        console.error('Failed to resolve current user for patient intake', error);
        this.isInitializing = false;
        this.toastr.error('Unable to load your patient account. Please sign in again.');
        void this.router.navigate(['/login']);
      },
    });
  }

  private applyUserContext(user: User): void {
    this.currentUser = user;

    if (user.role !== 'PATIENT') {
      this.isInitializing = false;
      this.toastr.info('This page is reserved for patient intake.');
      void this.router.navigate(['/']);
      return;
    }

    if (!user.userId) {
      this.isInitializing = false;
      this.toastr.error('Unable to resolve your patient identifier.');
      return;
    }

    this.medicalFolderService.getMedicalRecordByPatientId(user.userId).subscribe({
      next: (record) => {
        this.existingRecord = record;
        this.isInitializing = false;
        this.toastr.info('Your medical dossier already exists.');
        void this.router.navigate(['/medical-folder', record.id]);
      },
      error: (error) => {
        this.isInitializing = false;
        if (error?.status === 404) {
          return;
        }

        this.toastr.warning(
          this.extractErrorMessage(error, 'Unable to verify whether your medical dossier already exists.'),
        );
      },
    });
  }

  private buildHistoryPayload(result: ScreeningResult): MedicalHistoryCreateRequest {
    const submittedAt = new Date().toISOString().slice(0, 10);
    const formValue = this.intakeForm.getRawValue();
    const questionLines = this.screeningQuestions.map(
      (question) => `${question.label}: ${this.getOptionLabel(question, formValue[question.key])}`,
    );

    return {
      type: 'INITIAL_SCREENING',
      date: submittedAt,
      description: [
        'First patient questionnaire completed automatically at account activation.',
        `Detected profile: ${result.detectedLabel}.`,
        `Score: ${result.scoreOn100}/100.`,
        `Medical stage saved in dossier: ${result.medicalStage}.`,
        ...questionLines,
      ].join('\n'),
    };
  }

  private buildReportPayload(result: ScreeningResult): AssessmentReportCreateRequest {
    const today = new Date().toISOString().slice(0, 10);
    const formValue = this.intakeForm.getRawValue();
    const questionSummary = this.screeningQuestions
      .map((question) => `${question.label}: ${this.getOptionLabel(question, formValue[question.key])}`)
      .join(' | ');

    return {
      reportType: 'Patient screening questionnaire',
      score: result.scoreOn100,
      stage: result.medicalStage,
      recommendation: result.recommendation,
      summary: [
        `Self-intake result: ${result.detectedLabel}.`,
        `Questionnaire details: ${questionSummary}.`,
      ].join(' '),
      author: this.currentUser?.name || 'Patient self-intake',
      assessmentDate: today,
    };
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

  private isExistingRecordError(error: unknown): boolean {
    const message = this.extractErrorMessage(error, '').toLowerCase();
    return (
      message.includes('already exists') ||
      message.includes('already exist') ||
      message.includes('existe déjà') ||
      message.includes('existe deja')
    );
  }
}
