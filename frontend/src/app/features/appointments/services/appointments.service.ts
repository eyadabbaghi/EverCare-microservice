// services/appointment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout, retry } from 'rxjs/operators';
import { Appointment, AppointmentStatus, CaregiverPresence, RecurrencePattern } from '../models/appointment';
import { AppointmentFilter } from '../models/appointment-filter';
import { CreateAppointmentRequest } from '../models/appointment-request';
import { PageResponse } from '../models/api-response';
import { DoctorStats } from '../models/doctor-stats';
import { DoctorTrendPoint } from '../models/doctor-trend-point';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  private baseUrl = "http://localhost:8089/EverCare/appointments";
  private readonly TIMEOUT = 30000; // 30 seconds timeout

  constructor(private http: HttpClient) { }

  // ========== READ OPERATIONS ==========

  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.baseUrl).pipe(
      timeout(this.TIMEOUT),
      retry(1),
      catchError(error => {
        console.error('Error in getAllAppointments:', error);
        return throwError(() => error);
      })
    );
  }

  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.baseUrl}/${id}`).pipe(
      timeout(this.TIMEOUT),
      retry(1),
      catchError(error => {
        console.error('Error in getAppointmentById:', error);
        return throwError(() => error);
      })
    );
  }

  getAppointmentsByPatient(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/patient/${patientId}`).pipe(
      timeout(this.TIMEOUT),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getAppointmentsByDoctor(doctorId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/doctor/${doctorId}`).pipe(
      timeout(this.TIMEOUT),
      retry(1),
      catchError(error => {
        console.error('Error in getAppointmentsByDoctor:', error);
        return throwError(() => error);
      })
    );
  }

  getAppointmentsByCaregiver(caregiverId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/caregiver/${caregiverId}`).pipe(
      timeout(this.TIMEOUT),
      retry(1),
      catchError(error => {
        console.error('Error in getAppointmentsByCaregiver:', error);
        return throwError(() => error);
      })
    );
  }

  getAppointmentsByStatus(status: AppointmentStatus): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/status/${status}`).pipe(
      timeout(this.TIMEOUT),
      retry(1),
      catchError(error => {
        console.error('Error in getAppointmentsByStatus:', error);
        return throwError(() => error);
      })
    );
  }

  getAppointmentsByDateRange(start: Date, end: Date): Observable<Appointment[]> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString());

    return this.http.get<Appointment[]>(`${this.baseUrl}/date-range`, { params }).pipe(
      timeout(this.TIMEOUT),
      retry(1),
      catchError(error => {
        console.error('Error in getAppointmentsByDateRange:', error);
        return throwError(() => error);
      })
    );
  }

  getAppointmentsByDoctorAndDateRange(doctorId: string, start: Date, end: Date): Observable<Appointment[]> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString());

    return this.http.get<Appointment[]>(`${this.baseUrl}/doctor/${doctorId}/date-range`, { params }).pipe(
      timeout(this.TIMEOUT),
      retry(1),
      catchError(error => {
        console.error('Error in getAppointmentsByDoctorAndDateRange:', error);
        return throwError(() => error);
      })
    );
  }

  getFutureAppointmentsByPatient(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/patient/${patientId}/future`).pipe(
      timeout(this.TIMEOUT),
      retry(1),
      catchError(error => {
        console.error('Error in getFutureAppointmentsByPatient:', error);
        return throwError(() => error);
      })
    );
  }

  checkDoctorAvailability(doctorId: string, dateTime: Date): Observable<boolean> {
    const params = new HttpParams()
      .set('doctorId', doctorId)
      .set('dateTime', dateTime.toISOString());

    return this.http.get<boolean>(`${this.baseUrl}/check-availability`, { params }).pipe(
      timeout(this.TIMEOUT),
      retry(1),
      catchError(error => {
        console.error('Error in checkDoctorAvailability:', error);
        return throwError(() => error);
      })
    );
  }

  // ========== CREATE OPERATIONS ==========

  createAppointment(appointmentData: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.baseUrl, appointmentData).pipe(
      timeout(this.TIMEOUT),
      catchError(error => {
        console.error('Error in createAppointment:', error);
        return throwError(() => error);
      })
    );
  }

  // ========== UPDATE OPERATIONS ==========

  updateAppointment(id: string, appointment: Partial<Appointment>): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/${id}`, appointment).pipe(
      timeout(this.TIMEOUT),
      catchError(error => {
        console.error('Error in updateAppointment:', error);
        return throwError(() => error);
      })
    );
  }

  confirmByPatient(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.baseUrl}/${id}/confirm-patient`, {}).pipe(
      timeout(this.TIMEOUT),
      catchError(error => {
        console.error('Error in confirmByPatient:', error);
        return throwError(() => error);
      })
    );
  }

  confirmByCaregiver(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.baseUrl}/${id}/confirm-caregiver`, {}).pipe(
      timeout(this.TIMEOUT),
      catchError(error => {
        console.error('Error in confirmByCaregiver:', error);
        return throwError(() => error);
      })
    );
  }

  cancelAppointment(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.baseUrl}/${id}/cancel`, {}).pipe(
      timeout(this.TIMEOUT),
      catchError(error => {
        console.error('Error in cancelAppointment:', error);
        return throwError(() => error);
      })
    );
  }

  rescheduleAppointment(id: string, newDateTime: Date): Observable<Appointment> {
    const params = new HttpParams()
      .set('newDateTime', newDateTime.toISOString());

    return this.http.patch<Appointment>(`${this.baseUrl}/${id}/reschedule`, null, { params }).pipe(
      timeout(this.TIMEOUT),
      catchError(error => {
        console.error('Error in rescheduleAppointment:', error);
        return throwError(() => error);
      })
    );
  }

  updateDoctorNotes(id: string, notes: string): Observable<Appointment> {
    const params = new HttpParams().set('notes', notes);
    return this.http.patch<Appointment>(`${this.baseUrl}/${id}/notes`, null, { params }).pipe(
      timeout(this.TIMEOUT),
      catchError(error => {
        console.error('Error in updateDoctorNotes:', error);
        return throwError(() => error);
      })
    );
  }

  updateSimpleSummary(id: string, summary: string): Observable<Appointment> {
    const params = new HttpParams().set('summary', summary);
    return this.http.patch<Appointment>(`${this.baseUrl}/${id}/summary`, null, { params }).pipe(
      timeout(this.TIMEOUT),
      catchError(error => {
        console.error('Error in updateSimpleSummary:', error);
        return throwError(() => error);
      })
    );
  }

  // ========== DELETE OPERATIONS ==========

  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      timeout(this.TIMEOUT),
      catchError(error => {
        console.error('Error in deleteAppointment:', error);
        return throwError(() => error);
      })
    );
  }

  deleteAppointmentsByPatient(patientId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/patient/${patientId}`).pipe(
      timeout(this.TIMEOUT),
      catchError(error => {
        console.error('Error in deleteAppointmentsByPatient:', error);
        return throwError(() => error);
      })
    );
  }

  // ========== UTILITY OPERATIONS ==========

  countAppointmentsByDoctorAndDate(doctorId: string, date: Date): Observable<number> {
    const params = new HttpParams()
      .set('doctorId', doctorId)
      .set('date', date.toISOString());

    return this.http.get<number>(`${this.baseUrl}/count`, { params }).pipe(
      timeout(this.TIMEOUT),
      retry(1),
      catchError(error => {
        console.error('Error in countAppointmentsByDoctorAndDate:', error);
        return throwError(() => error);
      })
    );
  }

  searchAppointments(filter: AppointmentFilter = {}): Observable<PageResponse<Appointment>> {
    let params = new HttpParams()
      .set('page', (filter.page ?? 0).toString())
      .set('size', (filter.size ?? 10).toString())
      .set('sort', filter.sort ?? 'startDateTime')
      .set('direction', filter.direction ?? 'DESC');

    if (filter.patientId) params = params.set('patientId', filter.patientId);
    if (filter.doctorId) params = params.set('doctorId', filter.doctorId);
    if (filter.caregiverId) params = params.set('caregiverId', filter.caregiverId);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
    if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());
    if (filter.consultationTypeId) params = params.set('consultationTypeId', filter.consultationTypeId);

    return this.http.get<PageResponse<Appointment>>(`${this.baseUrl}/search`, { params }).pipe(
      timeout(this.TIMEOUT),
      retry(1),
      catchError(error => {
        console.error('Error in searchAppointments:', error);
        return throwError(() => error);
      })
    );
  }

  getDoctorWorkloadStats(doctorId: string): Observable<DoctorStats> {
    return this.http.get<DoctorStats>(`${this.baseUrl}/stats/doctor/${doctorId}`).pipe(
      timeout(this.TIMEOUT),
      retry(1),
      catchError(error => {
        console.error('Error in getDoctorWorkloadStats:', error);
        return throwError(() => error);
      })
    );
  }

  getDoctorWorkloadTrend(doctorId: string, days: number = 7): Observable<DoctorTrendPoint[]> {
    const params = new HttpParams().set('days', days.toString());

    return this.http.get<DoctorTrendPoint[]>(`${this.baseUrl}/stats/doctor/${doctorId}/trend`, { params }).pipe(
      timeout(this.TIMEOUT),
      retry(1),
      catchError(error => {
        console.error('Error in getDoctorWorkloadTrend:', error);
        return throwError(() => error);
      })
    );
  }

  sendReminders(): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/send-reminders`, {}).pipe(
      timeout(this.TIMEOUT),
      catchError(error => {
        console.error('Error in sendReminders:', error);
        return throwError(() => error);
      })
    );
  }
}
