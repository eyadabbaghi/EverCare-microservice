import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, switchMap, tap, catchError, delay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
  scope?: string;
}

export interface User {
  userId?: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isVerified?: boolean;
  createdAt?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  yearsExperience?: number;
  specialization?: string;
  medicalLicense?: string;
  workplaceType?: string;
  workplaceName?: string;
  caregiverEmails?: string[];
  patientEmails?: string[];
  doctorEmail?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  profilePicture?: string;
  yearsExperience?: number;
  specialization?: string;
  medicalLicense?: string;
  workplaceType?: string;
  workplaceName?: string;
  connectedEmail?: string;
  doctorEmail?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Backend URLs - go through API Gateway
private apiUrl = 'http://localhost:8089/api/auth';
private usersUrl = 'http://localhost:8089/api/users';

  // Keycloak configuration
  private keycloakUrl =
    'http://localhost:8090/realms/EverCareRealm/protocol/openid-connect/token';
  private keycloakLogoutUrl =
    'http://localhost:8090/realms/EverCareRealm/protocol/openid-connect/logout';
  private clientId = 'frontend-app';
  private clientSecret = 'apXvSUUINGfnW7gVXQC7g019eO4Zs4Ap'; 

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadStoredUser();
  }

  // ---------- Login via backend (bypasses Keycloak client config) ----------
  login(credentials: LoginRequest): Observable<KeycloakTokenResponse> {
    // Use backend login endpoint which handles Keycloak auth internally
    return this.http
      .post<KeycloakTokenResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((tokenResponse) => this.storeTokens(tokenResponse)),
        switchMap((tokenResponse) =>
          this.fetchCurrentUser().pipe(map(() => tokenResponse)),
        ),
        catchError((error) => {
          console.error('Login error', error);
          this.toastr.error(
            'Invalid email or password. Please try again.',
            'Login failed',
          );
          throw error;
        }),
      );
  }

  // ---------- Register (backend proxy) ----------
  register(userData: RegisterRequest): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(() =>
          this.toastr.success('Registration successful. Logging you in...'),
        ),
        delay(3000),
        switchMap(() =>
          this.login({ email: userData.email, password: userData.password }),
        ),
        map(() => ({ message: 'Registration and login successful' })),
        catchError((error) => {
          console.error('Registration error', error);
          this.toastr.error(
            'Registration failed. Please try again.',
            'Error',
          );
          throw error;
        }),
      );
  }

  // ---------- Fetch current user ----------
  fetchCurrentUser(): Observable<User> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getToken()}`,
    );
    return this.http.get<User>(`${this.apiUrl}/me`, { headers }).pipe(
      tap((user) => this.storeUser(user)),
      catchError((error) => {
        console.error('Failed to fetch current user from /auth/me', error);
        this.toastr.error(
          'Login reached Keycloak, but loading your profile failed.',
          'Profile loading failed',
        );
        throw error;
      }),
    );
  }

  // ---------- Token refresh ----------
  refreshToken(): Observable<KeycloakTokenResponse> {
    const storedRefreshToken = this.getRefreshToken();
    if (!storedRefreshToken) {
      this.logout();
      throw new Error('No refresh token available');
    }

    const body =
      `grant_type=refresh_token` +
      `&client_id=${this.clientId}` +
      `&client_secret=${this.clientSecret}` +
      `&refresh_token=${storedRefreshToken}`;

    return this.http
      .post<KeycloakTokenResponse>(this.keycloakUrl, body, {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      })
      .pipe(
        tap((tokenResponse) => this.storeTokens(tokenResponse)),
        catchError((error) => {
          console.error('Token refresh failed', error);
          this.logout();
          throw error;
        }),
      );
  }

  // ---------- Token handling ----------
  private storeTokens(tokenResponse: KeycloakTokenResponse): void {
    if (this.isBrowser) {
      localStorage.setItem('auth_token', tokenResponse.access_token);
      if (tokenResponse.refresh_token) {
        localStorage.setItem('refresh_token', tokenResponse.refresh_token);
      }
    }
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  // ---------- Role helpers ----------
  getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.realm_access?.roles ?? [];
    } catch {
      return [];
    }
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  isAdmin(): boolean { return this.hasRole('ADMIN'); }
  isDoctor(): boolean { return this.hasRole('DOCTOR'); }
  isCaregiver(): boolean { return this.hasRole('CAREGIVER'); }
  isPatient(): boolean { return this.hasRole('PATIENT'); }

  // ---------- Logout ----------
  logout(): void {
    const refreshToken = this.getRefreshToken();

    // Notify Keycloak to invalidate the session
    if (refreshToken) {
      const body =
        `client_id=${this.clientId}` +
        `&client_secret=${this.clientSecret}` +
        `&refresh_token=${refreshToken}`;

      this.http
        .post(this.keycloakLogoutUrl, body, {
          headers: new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }

    if (this.isBrowser) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('current_user');
      localStorage.removeItem('userId');
    }

    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private loadStoredUser(): void {
    if (this.isBrowser) {
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }

  private storeUser(user: User): void {
    this.currentUserSubject.next(user);
    if (this.isBrowser) {
      localStorage.setItem('current_user', JSON.stringify(user));
      if (user.userId) {
        localStorage.setItem('userId', user.userId);
      }
    }
  }

  // ---------- Profile endpoints ----------
  updateProfile(data: UpdateUserRequest): Observable<any> {
    return this.http.put<any>(`${this.usersUrl}/profile`, data);
  }

  changePassword(data: ChangePasswordRequest): Observable<any> {
    return this.http.put(`${this.usersUrl}/change-password`, data);
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.usersUrl}/profile`);
  }

  uploadProfilePicture(file: File): Observable<{ profilePicture: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ profilePicture: string }>(
      `${this.usersUrl}/profile/picture`,
      formData,
    );
  }

  removeProfilePicture(): Observable<any> {
    return this.http.delete(`${this.usersUrl}/profile/picture`);
  }

  searchUsersByRole(term: string, role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.usersUrl}/search`, {
      params: { q: term, role },
    });
  }

  getUserByEmail(email: string): Observable<User> {
    return this.http.get<User>(`${this.usersUrl}/by-email`, {
      params: { email },
    });
  }

  // ---------- Google login – disabled ----------
  googleLogin(idToken: string): Observable<any> {
    this.toastr.warning(
      'Google login is being migrated. Please use email/password.',
      'Not available',
    );
    return of(null);
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}
