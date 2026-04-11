import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Patient, UserService } from '../../../../core/services/user.service';
import { AuthService, User } from '../../../front-office/pages/login/auth.service';
import { AssessmentReport, MedicalRecordResponse } from '../../interfaces/medical-folder';
import { MedicalFolderService } from '../../services/medical-folder.service';

interface ReportRow extends AssessmentReport {
  patientId: string;
  recordId: string;
  patientName: string;
  patientEmail: string;
  needsAttention: boolean;
}

@Component({
  selector: 'app-doctor-reports-list',
  templateUrl: './doctor-reports-list.component.html',
  styleUrls: ['./doctor-reports-list.component.css'],
})
export class DoctorReportsListComponent implements OnInit {
  currentUser: User | null = null;
  reports: ReportRow[] = [];
  visibleReports: ReportRow[] = [];
  patients: Patient[] = [];

  isLoading = false;
  errorMessage = '';
  query = '';
  stageFilter = '';
  patientFilterId = '';
  alertsOnly = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly medicalFolderService: MedicalFolderService,
  ) {}

  ngOnInit(): void {
    this.patientFilterId = this.route.snapshot.queryParamMap.get('patientId') || '';

    const user = this.authService.getCurrentUserValue();
    if (user) {
      this.currentUser = user;
      this.loadReports();
      return;
    }

    if (this.authService.getToken()) {
      this.authService.fetchCurrentUser().subscribe({
        next: (resolvedUser) => {
          this.currentUser = resolvedUser;
          this.loadReports();
        },
        error: () => {
          this.errorMessage = 'Unable to resolve the current user profile.';
        },
      });
      return;
    }

    this.errorMessage = 'You need to be connected to access reports.';
  }

  get isPatientFiltered(): boolean {
    return !!this.patientFilterId;
  }

  onQueryChange(value: string): void {
    this.query = value;
    this.applyFilters();
  }

  onStageChange(value: string): void {
    this.stageFilter = value;
    this.applyFilters();
  }

  toggleAlertsOnly(): void {
    this.alertsOnly = !this.alertsOnly;
    this.applyFilters();
  }

  clearPatientFilter(): void {
    this.patientFilterId = '';
    void this.router.navigate(['/medical-folder/reports']);
    this.applyFilters();
  }

  openRecord(report: ReportRow): void {
    void this.router.navigate(['/medical-folder', report.recordId]);
  }

  private loadReports(): void {
    if (!this.currentUser) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      records: this.medicalFolderService.getAllMedicalRecords(),
      patients: this.userService.getPatients().pipe(catchError(() => of([] as Patient[]))),
    }).subscribe({
      next: ({ records, patients }) => {
        this.patients = patients;
        const scopedRecords = this.filterRecordsByRole(records, patients);

        if (!scopedRecords.length) {
          this.reports = [];
          this.visibleReports = [];
          this.isLoading = false;
          return;
        }

        const reportRequests = scopedRecords.map((record) =>
          this.medicalFolderService.getReports(record.id).pipe(
            catchError(() => of([] as AssessmentReport[])),
          ),
        );

        forkJoin(reportRequests).subscribe({
          next: (reportGroups) => {
            const patientMap = new Map(patients.map((patient) => [patient.userId, patient]));

            this.reports = scopedRecords.flatMap((record, index) =>
              reportGroups[index].map((report) => {
                const patient = patientMap.get(record.patientId);
                const needsAttention = report.stage === 'SEVERE' || Number(report.score) < 40;

                return {
                  ...report,
                  patientId: record.patientId,
                  recordId: record.id,
                  patientName: patient?.name || record.patientId,
                  patientEmail: patient?.email || '',
                  needsAttention,
                };
              }),
            ).sort((a, b) =>
              `${b.assessmentDate}-${b.createdAt ?? ''}`.localeCompare(`${a.assessmentDate}-${a.createdAt ?? ''}`),
            );

            this.applyFilters();
            this.isLoading = false;
          },
          error: (error) => {
            this.errorMessage = this.extractErrorMessage(error, 'Unable to load reports.');
            this.isLoading = false;
          },
        });
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Unable to load report context.');
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

    return [];
  }

  private applyFilters(): void {
    const query = this.query.trim().toLowerCase();

    this.visibleReports = this.reports.filter((report) => {
      if (this.patientFilterId && report.patientId !== this.patientFilterId) {
        return false;
      }

      if (this.alertsOnly && !report.needsAttention) {
        return false;
      }

      if (this.stageFilter && report.stage !== this.stageFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        report.patientName,
        report.patientEmail,
        report.patientId,
        report.reportType,
        report.stage,
        report.recommendation,
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
