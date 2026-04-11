import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from '../../front-office/pages/login/auth.service';
import {
  AssessmentReport,
  AssessmentReportCreateRequest,
  AssessmentReportUpdateRequest,
  MedicalRecordArchiveRequest,
  MedicalDocumentCreateRequest,
  MedicalDocumentUpdateRequest,
  MedicalHistoryCreateRequest,
  MedicalHistoryUpdateRequest,
  MedicalRecordCreateRequest,
  MedicalRecordDocument,
  MedicalRecordHistory,
  MedicalRecordRealtimeEvent,
  MedicalRecordResponse,
  MedicalRecordUpdateRequest,
} from '../interfaces/medical-folder';

@Injectable({
  providedIn: 'root',
})
export class MedicalFolderService {
  private readonly baseUrl = 'http://localhost:8089/api/medical-records';
  private readonly websocketUrl = 'http://localhost:8089/ws-medical-records';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  getAllMedicalRecords(): Observable<MedicalRecordResponse[]> {
    return this.http.get<MedicalRecordResponse[]>(
      this.baseUrl,
      this.getRequestOptions(),
    );
  }

  getMedicalRecordById(recordId: string): Observable<MedicalRecordResponse> {
    return this.http.get<MedicalRecordResponse>(
      `${this.baseUrl}/${recordId}`,
      this.getRequestOptions(),
    );
  }

  getMedicalRecordByPatientId(patientId: string): Observable<MedicalRecordResponse> {
    return this.http.get<MedicalRecordResponse>(
      `${this.baseUrl}/patient/${encodeURIComponent(patientId)}`,
      this.getRequestOptions(),
    );
  }

  createMedicalRecord(payload: MedicalRecordCreateRequest): Observable<MedicalRecordResponse> {
    return this.http.post<MedicalRecordResponse>(
      this.baseUrl,
      payload,
      this.getRequestOptions(),
    );
  }

  autoCreateMedicalRecord(payload: MedicalRecordCreateRequest): Observable<MedicalRecordResponse> {
    return this.http.post<MedicalRecordResponse>(
      `${this.baseUrl}/auto-create`,
      payload,
      this.getRequestOptions(),
    ).pipe(
      catchError((error) => {
        if (error?.status === 404 || error?.status === 405) {
          return this.createMedicalRecord(payload);
        }

        return throwError(() => error);
      }),
    );
  }

  updateMedicalRecord(
    recordId: string,
    payload: MedicalRecordUpdateRequest,
  ): Observable<MedicalRecordResponse> {
    return this.http.put<MedicalRecordResponse>(
      `${this.baseUrl}/${recordId}`,
      payload,
      this.getRequestOptions(),
    );
  }

  archiveMedicalRecord(
    recordId: string,
    payload: MedicalRecordArchiveRequest,
  ): Observable<MedicalRecordResponse> {
    return this.http.patch<MedicalRecordResponse>(
      `${this.baseUrl}/${recordId}/archive`,
      payload,
      this.getRequestOptions(),
    ).pipe(
      catchError((error) => {
        if (error?.status === 404) {
          return throwError(() => new Error(
            'Archive endpoint not available in the running medical-record service. Restart the medical-record backend and try again.',
          ));
        }

        return throwError(() => error);
      }),
    );
  }

  restoreMedicalRecord(recordId: string): Observable<MedicalRecordResponse> {
    return this.http.patch<MedicalRecordResponse>(
      `${this.baseUrl}/${recordId}/restore`,
      {},
      this.getRequestOptions(),
    ).pipe(
      catchError((error) => {
        if (error?.status === 404) {
          return throwError(() => new Error(
            'Restore endpoint not available in the running medical-record service. Restart the medical-record backend and try again.',
          ));
        }

        return throwError(() => error);
      }),
    );
  }

  deleteMedicalRecord(recordId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${recordId}`, this.getRequestOptions());
  }

  getHistories(recordId: string): Observable<MedicalRecordHistory[]> {
    return this.http.get<MedicalRecordHistory[]>(
      `${this.baseUrl}/${recordId}/histories`,
      this.getRequestOptions(),
    );
  }

  createHistory(
    recordId: string,
    payload: MedicalHistoryCreateRequest,
  ): Observable<MedicalRecordHistory> {
    return this.http.post<MedicalRecordHistory>(
      `${this.baseUrl}/${recordId}/histories`,
      payload,
      this.getRequestOptions(),
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
      this.getRequestOptions(),
    );
  }

  deleteHistory(recordId: string, historyId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${recordId}/histories/${historyId}`,
      this.getRequestOptions(),
    );
  }

  getDocuments(recordId: string): Observable<MedicalRecordDocument[]> {
    return this.http.get<MedicalRecordDocument[]>(
      `${this.baseUrl}/${recordId}/documents`,
      this.getRequestOptions(),
    );
  }

  createDocument(
    recordId: string,
    payload: MedicalDocumentCreateRequest,
  ): Observable<MedicalRecordDocument> {
    return this.http.post<MedicalRecordDocument>(
      `${this.baseUrl}/${recordId}/documents`,
      payload,
      this.getRequestOptions(),
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
      this.getRequestOptions(),
    );
  }

  deleteDocument(recordId: string, documentId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${recordId}/documents/${documentId}`,
      this.getRequestOptions(),
    );
  }

  getReports(recordId: string): Observable<AssessmentReport[]> {
    return this.http.get<AssessmentReport[]>(
      `${this.baseUrl}/${recordId}/reports`,
      this.getRequestOptions(),
    );
  }

  createReport(
    recordId: string,
    payload: AssessmentReportCreateRequest,
  ): Observable<AssessmentReport> {
    return this.http.post<AssessmentReport>(
      `${this.baseUrl}/${recordId}/reports`,
      payload,
      this.getRequestOptions(),
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
      this.getRequestOptions(),
    );
  }

  deleteReport(recordId: string, reportId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${recordId}/reports/${reportId}`,
      this.getRequestOptions(),
    );
  }

  watchPatientEvents(patientId: string): Observable<MedicalRecordRealtimeEvent> {
    return new Observable<MedicalRecordRealtimeEvent>((observer) => {
      if (typeof window === 'undefined') {
        observer.complete();
        return undefined;
      }

      const socket = new SockJS(this.websocketUrl);
      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        debug: () => undefined,
      });

      let subscription: StompSubscription | undefined;

      client.onConnect = () => {
        subscription = client.subscribe(
          `/topic/medical-records/${patientId}`,
          (message: IMessage) => {
            observer.next(JSON.parse(message.body) as MedicalRecordRealtimeEvent);
          },
        );
      };

      client.onStompError = (frame) => {
        observer.error(new Error(frame.body || frame.headers['message'] || 'WebSocket error'));
      };

      client.activate();

      return () => {
        subscription?.unsubscribe();
        void client.deactivate();
      };
    });
  }

  private getRequestOptions(): { headers?: HttpHeaders } {
    const token = this.authService.getToken();
    if (!token) {
      return {};
    }

    return {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`),
    };
  }
}
