import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AuthService } from '../../front-office/pages/login/auth.service';
import {
  AssessmentReport,
  AssessmentReportCreateRequest,
  AssessmentReportUpdateRequest,
  MedicalDocumentCreateRequest,
  MedicalDocumentUpdateRequest,
  MedicalHistoryCreateRequest,
  MedicalHistoryUpdateRequest,
  MedicalRecordArchiveRequest,
  MedicalRecordCreateRequest,
  MedicalRecordDocument,
  MedicalRecordHistory,
  MedicalRecordResponse,
  MedicalRecordUpdateRequest,
  MedicalRecordRealtimeEvent,
} from '../interfaces/medical-folder';

@Injectable({
  providedIn: 'root',
})
export class MedicalFolderService {
  private readonly baseUrl = 'http://localhost:8089/api/medical-records';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  getAllMedicalRecords(): Observable<MedicalRecordResponse[]> {
    return this.http.get<MedicalRecordResponse[]>(this.baseUrl, this.requestOptions());
  }

  getMedicalRecordById(id: string): Observable<MedicalRecordResponse> {
    return this.http.get<MedicalRecordResponse>(`${this.baseUrl}/${id}`, this.requestOptions());
  }

  getMedicalRecordByPatientId(patientId: string): Observable<MedicalRecordResponse> {
    return this.http.get<MedicalRecordResponse>(`${this.baseUrl}/patient/${patientId}`, this.requestOptions());
  }

  createMedicalRecord(payload: MedicalRecordCreateRequest): Observable<MedicalRecordResponse> {
    return this.http.post<MedicalRecordResponse>(this.baseUrl, payload, this.requestOptions());
  }

  autoCreateMedicalRecord(payload: MedicalRecordCreateRequest): Observable<MedicalRecordResponse> {
    return this.createMedicalRecord(payload);
  }

  updateMedicalRecord(id: string, payload: MedicalRecordUpdateRequest): Observable<MedicalRecordResponse> {
    return this.http.put<MedicalRecordResponse>(`${this.baseUrl}/${id}`, payload, this.requestOptions());
  }

  archiveMedicalRecord(id: string, payload: MedicalRecordArchiveRequest): Observable<MedicalRecordResponse> {
    return this.http.post<MedicalRecordResponse>(`${this.baseUrl}/${id}/archive`, payload, this.requestOptions());
  }

  restoreMedicalRecord(id: string): Observable<MedicalRecordResponse> {
    return this.http.post<MedicalRecordResponse>(`${this.baseUrl}/${id}/restore`, {}, this.requestOptions());
  }

  deleteMedicalRecord(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, this.requestOptions());
  }

  getHistories(recordId: string): Observable<MedicalRecordHistory[]> {
    return this.http.get<MedicalRecordHistory[]>(`${this.baseUrl}/${recordId}/histories`, this.requestOptions());
  }

  createHistory(recordId: string, payload: MedicalHistoryCreateRequest): Observable<MedicalRecordHistory> {
    return this.http.post<MedicalRecordHistory>(
      `${this.baseUrl}/${recordId}/histories`,
      payload,
      this.requestOptions(),
    );
  }

  updateHistory(
    recordId: string,
    historyId: string,
    payload: MedicalHistoryUpdateRequest,
  ): Observable<MedicalRecordHistory> {
    return this.http.put<MedicalRecordHistory>(
      `${this.baseUrl}/${recordId}/histories/${historyId}`,
      payload,
      this.requestOptions(),
    );
  }

  deleteHistory(recordId: string, historyId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${recordId}/histories/${historyId}`, this.requestOptions());
  }

  getDocuments(recordId: string): Observable<MedicalRecordDocument[]> {
    return this.http.get<MedicalRecordDocument[]>(`${this.baseUrl}/${recordId}/documents`, this.requestOptions());
  }

  createDocument(recordId: string, payload: MedicalDocumentCreateRequest): Observable<MedicalRecordDocument> {
    return this.http.post<MedicalRecordDocument>(
      `${this.baseUrl}/${recordId}/documents`,
      payload,
      this.requestOptions(),
    );
  }

  updateDocument(
    recordId: string,
    documentId: string,
    payload: MedicalDocumentUpdateRequest,
  ): Observable<MedicalRecordDocument> {
    return this.http.put<MedicalRecordDocument>(
      `${this.baseUrl}/${recordId}/documents/${documentId}`,
      payload,
      this.requestOptions(),
    );
  }

  deleteDocument(recordId: string, documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${recordId}/documents/${documentId}`, this.requestOptions());
  }

  getReports(recordId: string): Observable<AssessmentReport[]> {
    return this.http.get<AssessmentReport[]>(`${this.baseUrl}/${recordId}/reports`, this.requestOptions());
  }

  createReport(recordId: string, payload: AssessmentReportCreateRequest): Observable<AssessmentReport> {
    return this.http.post<AssessmentReport>(
      `${this.baseUrl}/${recordId}/reports`,
      payload,
      this.requestOptions(),
    );
  }

  updateReport(
    recordId: string,
    reportId: string,
    payload: AssessmentReportUpdateRequest,
  ): Observable<AssessmentReport> {
    return this.http.put<AssessmentReport>(
      `${this.baseUrl}/${recordId}/reports/${reportId}`,
      payload,
      this.requestOptions(),
    );
  }

  deleteReport(recordId: string, reportId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${recordId}/reports/${reportId}`, this.requestOptions());
  }

  // Real-time events (mock implementation - replace with WebSocket when backend ready)
  watchPatientEvents(patientId: string): Observable<MedicalRecordRealtimeEvent> {
    const eventSubject = new Subject<MedicalRecordRealtimeEvent>();
    // For now, return an empty observable - WebSocket implementation needed
    return eventSubject.asObservable();
  }

  private requestOptions() {
    const token = this.authService.getToken();
    const headers = token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : new HttpHeaders();

    return { headers };
  }
}
