import { Component, OnInit } from '@angular/core';
import { Appointment, AppointmentStatus } from '../../models/appointment';
import { User } from '../../models/user';
import { ConsultationType } from '../../models/consultation-type.model';
import { AppointmentService } from '../../services/appointments.service';
import { CreateAppointmentRequest } from '../../models/appointment-request';
import { AvailabilityService } from '../../services/availability.service';
import { AuthService } from '../../../front-office/pages/login/auth.service';
import { ConsultationTypeService } from '../../services/consultation-type.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { AppointmentFilter } from '../../models/appointment-filter';
import { PageResponse } from '../../models/api-response';

@Component({
  selector: 'app-appointments-page',
  templateUrl: './appointments-page.component.html',
})
export class AppointmentsPageComponent implements OnInit {
  // ========== PROPERTIES ==========

  currentPatient: User = {
    userId: "",
    name: "",
    email: "",
    role: "PATIENT",
    phone: "",
    profilePicture: "",
  };

  currentDate: Date = new Date();
  isAddDialogOpen = false;
  selectedAppointment: Appointment | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Data
  doctors: User[] = [];
  myCaregivers: User[] = [];
  consultationTypes: ConsultationType[] = [];
  appointments: Appointment[] = [];

  // Filters
  filters = { status: '', doctorId: '' };

  // Pagination
  pageResponse: PageResponse<Appointment> | null = null;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // New appointment form
  newAppointment: any = {
    doctorId: '',
    consultationTypeId: '',
    date: '',
    time: '',
    caregiverId: '',
    caregiverPresence: 'NONE',
    notes: ''
  };

  availableSlots: string[] = [];

  // ========== BOOKING TAB PROPERTIES ==========

  activeTab: 'my-appointments' | 'book-appointment' = 'my-appointments';
  bookingStep: 1 | 2 | 3 = 1;
  selectedDoctorId: string | null = null;
  selectedSlot: any = null;

  constructor(
    private appointmentService: AppointmentService,
    private availabilityService: AvailabilityService,
    private consultationTypeService: ConsultationTypeService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  // ========== INITIALIZATION ==========

  ngOnInit(): void {
    this.loadCurrentPatient();
  }

  loadCurrentPatient(): void {
    this.loading = true;

    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user && user.role === 'PATIENT') {
          this.currentPatient = {
            ...user,
            userId: user.userId || '',
            name: user.name || '',
            email: user.email || '',
            role: 'PATIENT',
            phone: user.phone || '',
            profilePicture: user.profilePicture || '',
          };
          console.log('✅ Patient loaded:', this.currentPatient);
          this.loadInitialData();
        } else if (user && user.role !== 'PATIENT') {
          this.toastr.error('Access denied. This page is for patients only.');
          this.router.navigate(['/']);
        } else {
          this.router.navigate(['/login']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading current user:', error);
        this.toastr.error('Failed to load user information');
        this.router.navigate(['/login']);
        this.loading = false;
      }
    });
  }

  loadInitialData(): void {
    this.loading = true;
    this.errorMessage = '';

    // Load all data in parallel
    Promise.all([
      this.loadDoctors(),
      this.loadCaregivers(),
      this.loadConsultationTypes(),
      this.loadAppointments()
    ]).catch((error) => {
      console.error('Error loading initial data:', error);
      this.errorMessage = 'Failed to load some data. Please refresh the page.';
      setTimeout(() => this.errorMessage = '', 3000);
    }).finally(() => {
      this.loading = false;
    });
  }

  // ========== DATA LOADING METHODS ==========

  loadDoctors(): Promise<void> {
    return new Promise((resolve) => {
      this.authService.searchUsersByRole('', 'DOCTOR').subscribe({
        next: (doctors) => {
          this.doctors = doctors || [];
          console.log('✅ Doctors loaded:', this.doctors.length);
          resolve();
        },
        error: (error) => {
          console.error('Error loading doctors:', error);
          this.toastr.warning('Could not load doctors list');
          this.doctors = [];
          resolve();
        }
      });
    });
  }

  loadCaregivers(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentPatient.email) {
        this.myCaregivers = [];
        resolve();
        return;
      }

      this.authService.searchUsersByRole('', 'CAREGIVER').subscribe({
        next: (caregivers) => {
          // Filter caregivers that are associated with this patient
          this.myCaregivers = caregivers.filter(c =>
            c.patientEmails?.includes(this.currentPatient.email)
          );
          console.log('✅ Caregivers loaded:', this.myCaregivers.length);
          resolve();
        },
        error: (error) => {
          console.error('Error loading caregivers:', error);
          this.myCaregivers = [];
          resolve();
        }
      });
    });
  }

  loadConsultationTypes(): Promise<void> {
    return new Promise((resolve) => {
      this.consultationTypeService.getAllConsultationTypes().subscribe({
        next: (types) => {
          this.consultationTypes = types || [];
          console.log('✅ Consultation types loaded:', this.consultationTypes.length);
          resolve();
        },
        error: (error) => {
          console.error('Error loading consultation types:', error);
          this.consultationTypes = [];
          resolve();
        }
      });
    });
  }

// ========== FIXED LOAD APPOINTMENTS METHOD ==========

  // In appointments-page.component.ts - Focus ONLY on appointments

  // In appointments-page.component.ts - Replace only the loadAppointments method

  loadAppointments(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentPatient.userId) {
        console.warn('⚠️ No patient ID available');
        this.appointments = [];
        this.errorMessage = 'Patient ID not found';
        resolve();
        return;
      }

      this.loadAppointmentsPage(0);
      resolve();
    });
  }

  loadAppointmentsPage(page: number): void {
    const filter: AppointmentFilter = {
      patientId: this.currentPatient.userId!,
      page: page,
      size: this.pageSize,
      sort: 'startDateTime',
      direction: 'DESC'
    };

    if (this.filters.status) {
      filter.status = this.filters.status as AppointmentStatus;
    }
    if (this.filters.doctorId) {
      filter.doctorId = this.filters.doctorId;
    }

    console.log('📅 Loading appointments page:', page, 'with filter:', filter);

    this.loading = true;

    this.appointmentService.searchAppointments(filter).subscribe({
      next: (response) => {
        console.log('📦 PageResponse received:', response);

        this.pageResponse = response;
        this.currentPage = response.number;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;

        this.appointments = response.content.map(item => ({
          ...item,
          startDateTime: new Date(item.startDateTime),
          endDateTime: new Date(item.endDateTime),
          createdAt: new Date(item.createdAt),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          confirmationDatePatient: item.confirmationDatePatient ? new Date(item.confirmationDatePatient) : undefined,
          confirmationDateCaregiver: item.confirmationDateCaregiver ? new Date(item.confirmationDateCaregiver) : undefined
        }));

        console.log(`✅ Loaded ${this.appointments.length} appointments (page ${this.currentPage + 1} of ${this.totalPages})`);

        if (this.appointments.length === 0) {
          this.errorMessage = 'No appointments found for this patient';
        } else {
          this.errorMessage = '';
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading appointments:', error);

        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check if backend is running.';
        } else if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please login again.';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else if (error.status === 403) {
          this.errorMessage = 'You do not have permission to access these appointments.';
        } else if (error.status === 404) {
          this.errorMessage = 'Appointment endpoint not found.';
        } else if (error.status === 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else {
          this.errorMessage = 'Failed to load appointments. Please try again.';
        }

        this.appointments = [];
        this.loading = false;
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadAppointmentsPage(page);
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  // ========== GETTERS ==========

  get filteredAppointments(): Appointment[] {
    return this.appointments.filter(apt => {
      let matches = true;
      if (this.filters.status && apt.status !== this.filters.status) matches = false;
      if (this.filters.doctorId && apt.doctorId !== this.filters.doctorId) matches = false;
      return matches;
    });
  }

  get upcomingAppointments(): Appointment[] {
    const now = new Date();
    return this.filteredAppointments
      .filter(apt =>
        (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED_BY_PATIENT' || apt.status === 'CONFIRMED_BY_CAREGIVER') &&
        new Date(apt.startDateTime) > now
      )
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }

  get pastAppointments(): Appointment[] {
    const now = new Date();
    return this.filteredAppointments
      .filter(apt => new Date(apt.startDateTime) < now || apt.status === 'COMPLETED' || apt.status === 'CANCELLED')
      .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());
  }

  // ========== EVENT HANDLERS ==========

  onFiltersChanged(filters: { status: string; doctorId: string }): void {
    this.filters = filters;
    this.currentPage = 0;
    this.loadAppointmentsPage(0);
  }

  onMonthChanged(newDate: Date): void {
    this.currentDate = newDate;
  }

  onDateSelected(date: string): void {
    console.log('Date selected:', date);
    setTimeout(() => {
      const element = document.getElementById('appointments-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  // ========== APPOINTMENT ACTIONS ==========

  viewAppointmentDetails(appointment: Appointment): void {
    this.selectedAppointment = appointment;
  }

  closeDetailsDialog(): void {
    this.selectedAppointment = null;
  }

  handleAppointmentAction(appointment: Appointment): void {
    if (appointment.status === 'SCHEDULED') {
      this.confirmAppointment(appointment.appointmentId);
    } else if (appointment.videoLink && this.canJoinCall(appointment)) {
      this.joinVideoCall(appointment.videoLink);
    }
  }

  confirmAppointment(appointmentId: string): void {
    this.loading = true;
    this.appointmentService.confirmByPatient(appointmentId).subscribe({
      next: (updatedAppointment) => {
        const index = this.appointments.findIndex(a => a.appointmentId === appointmentId);
        if (index !== -1) {
          this.appointments[index] = updatedAppointment;
        }
        this.loading = false;
        this.toastr.success('Appointment confirmed successfully');
      },
      error: (error) => {
        console.error('Error confirming appointment:', error);
        this.toastr.error('Failed to confirm appointment. Please try again.');
        this.loading = false;
      }
    });
  }

  cancelAppointment(appointmentId: string): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.loading = true;
      this.appointmentService.cancelAppointment(appointmentId).subscribe({
        next: (updatedAppointment) => {
          const index = this.appointments.findIndex(a => a.appointmentId === appointmentId);
          if (index !== -1) {
            this.appointments[index] = updatedAppointment;
          }
          this.closeDetailsDialog();
          this.loading = false;
          this.toastr.success('Appointment cancelled successfully');
        },
        error: (error) => {
          console.error('Error cancelling appointment:', error);
          this.toastr.error('Failed to cancel appointment. Please try again.');
          this.loading = false;
        }
      });
    }
  }

  joinVideoCall(videoLink: string | undefined): void {
    if (videoLink) {
      window.open(videoLink, '_blank');
    }
  }

  canJoinCall(appointment: Appointment): boolean {
    const now = new Date();
    const appointmentTime = new Date(appointment.startDateTime);
    const diffMinutes = (appointmentTime.getTime() - now.getTime()) / 60000;

    return (appointment.status === 'CONFIRMED_BY_PATIENT' ||
        appointment.status === 'CONFIRMED_BY_CAREGIVER') &&
      diffMinutes <= 15 && diffMinutes >= -30;
  }

  // ========== ADD APPOINTMENT METHODS ==========

  openAddDialog(): void {
    this.isAddDialogOpen = true;
    this.resetNewAppointment();
  }

  closeAddDialog(): void {
    this.isAddDialogOpen = false;
    this.resetNewAppointment();
  }

  resetNewAppointment(): void {
    this.newAppointment = {
      doctorId: '',
      consultationTypeId: '',
      date: '',
      time: '',
      caregiverId: '',
      caregiverPresence: 'NONE',
      notes: ''
    };
    this.availableSlots = [];
  }

  loadAvailableSlots(doctorId: string, date: string): void {
    if (!doctorId || !date) {
      this.availableSlots = [];
      return;
    }

    const selectedDate = new Date(date);
    const durationMinutes = 20;

    this.loading = true;

    this.availabilityService.getAvailableTimeSlots(doctorId, selectedDate, durationMinutes).subscribe({
      next: (slots: string[]) => {
        this.availableSlots = slots;
        this.loading = false;

        if (slots.length === 0) {
          this.toastr.info('No available slots for this date');
        }
      },
      error: (error) => {
        console.error('Error loading available slots:', error);
        this.toastr.warning('Could not load available slots');
        this.availableSlots = [];
        this.loading = false;
      }
    });
  }

  onDoctorOrDateChange(): void {
    if (this.newAppointment.doctorId && this.newAppointment.date) {
      this.loadAvailableSlots(
        this.newAppointment.doctorId,
        this.newAppointment.date
      );
    } else {
      this.availableSlots = [];
    }
  }

  addAppointment(formData: any): void {
    if (!this.isFormValid()) {
      this.toastr.warning('Please fill in all required fields');
      return;
    }

    const selectedDoctor = this.doctors.find(d => d.userId === formData.doctorId);
    const selectedType = this.consultationTypes.find(t => t.typeId === formData.consultationTypeId);
    const selectedCaregiver = this.myCaregivers.find(c => c.userId === formData.caregiverId);

    if (!selectedDoctor || !selectedType) {
      this.toastr.error('Please select a valid doctor and consultation type');
      return;
    }

    const startDateTime = new Date(formData.date + 'T' + formData.time);
    const endDateTime = new Date(startDateTime.getTime() + ((selectedType?.defaultDurationMinutes || 20) * 60000));

    const formatDateTime = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const newAppointmentPayload: CreateAppointmentRequest = {
      patientId: this.currentPatient.userId!,
      patientName: this.currentPatient.name,
      doctorId: formData.doctorId,
      doctorName: selectedDoctor?.name || '',
      caregiverId: formData.caregiverId || undefined,
      caregiverName: selectedCaregiver?.name,
      consultationTypeId: formData.consultationTypeId,
      consultationTypeName: selectedType?.name || '',
      startDateTime: formatDateTime(startDateTime) as any,
      endDateTime: formatDateTime(endDateTime) as any,
      status: 'SCHEDULED',
      caregiverPresence: formData.caregiverPresence,
      videoLink: `https://consult.evercare.com/room/${formData.doctorId}-${this.currentPatient.userId}`,
      doctorNotes: formData.notes,
      isRecurring: false
    };

    this.loading = true;
    this.appointmentService.createAppointment(newAppointmentPayload).subscribe({
      next: (createdAppointment) => {
        this.appointments.push(createdAppointment);
        this.closeAddDialog();
        this.loading = false;
        this.toastr.success('Appointment created successfully');
      },
      error: (error) => {
        console.error('Error creating appointment:', error);
        if (error.status === 0) {
          this.toastr.error('Cannot connect to server. Please check if backend is running.');
        } else if (error.status === 401) {
          this.toastr.error('Session expired. Please login again.');
          this.router.navigate(['/login']);
        } else if (error.status === 404) {
          this.toastr.error('API endpoint not found. Please check the URL.');
        } else if (error.status === 500) {
          this.toastr.error('Server error. Please try again later.');
        } else {
          this.toastr.error('Failed to create appointment. Please try again.');
        }
        this.loading = false;
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.newAppointment.doctorId &&
      this.newAppointment.consultationTypeId &&
      this.newAppointment.date &&
      this.newAppointment.time
    );
  }

  // ========== UTILITY METHODS ==========

  getDuration(appointment: Appointment): number {
    const diff = new Date(appointment.endDateTime).getTime() - new Date(appointment.startDateTime).getTime();
    return Math.round(diff / 60000);
  }

  refreshAppointments(): void {
    this.loadAppointments().then(() => {
      this.toastr.success('Appointments refreshed');
    });
  }

  // ========== BOOKING TAB METHODS ==========

  onDoctorSelected(doctorId: string): void {
    this.selectedDoctorId = doctorId;
    this.bookingStep = 2;
    this.newAppointment.doctorId = doctorId;
  }

  onSlotSelected(slot: any): void {
    this.selectedSlot = slot;
    this.newAppointment.date = this.formatDate(slot.date);
    this.newAppointment.time = slot.startTime;
  }

  getSelectedDoctor(): User {
    if (!this.selectedDoctorId) {
      return {
        userId: '',
        name: '',
        email: '',
        role: 'DOCTOR',
        phone: '',
        profilePicture: ''
      };
    }
    const doctor = this.doctors.find(d => d.userId === this.selectedDoctorId);
    return doctor || {
      userId: '',
      name: '',
      email: '',
      role: 'DOCTOR',
      phone: '',
      profilePicture: ''
    };
  }

  bookAppointment(formData: any): void {
    this.addAppointment(formData);
    this.activeTab = 'my-appointments';
    this.bookingStep = 1;
    this.selectedDoctorId = null;
    this.selectedSlot = null;
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
