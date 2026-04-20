import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { LoginPayload, LoginResponse, RegisterPayload, RegisterResponse, UserProfile } from '../models';
import { API_BASE_URL } from '../shared/app-constants';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = API_BASE_URL;
  private readonly accessTokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly accessToken = signal<string | null>(localStorage.getItem(this.accessTokenKey));
  private restoreRequest$: Observable<UserProfile | null> | null = null;

  user = signal<UserProfile | null>(null);
  profileLoaded = signal(false);
  loading = signal(false);
  isAuthenticated = computed(() => !!this.accessToken() && !!this.user());
  hasToken = computed(() => !!this.accessToken());
  canSell = computed(() => this.user()?.can_sell === true);

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<UserProfile> {
    this.loading.set(true);

    return this.http.post<LoginResponse>(`${this.apiUrl}/login/`, payload).pipe(
      tap((session) => this.setSession(session.access, session.refresh)),
      switchMap(() => this.fetchProfile()),
      tap(() => this.loading.set(false)),
      catchError((error) => {
        this.loading.set(false);
        return throwError(() => error);
      })
    );
  }

  register(payload: RegisterPayload): Observable<UserProfile> {
    this.loading.set(true);

    return this.http.post<RegisterResponse>(`${this.apiUrl}/register/`, payload).pipe(
      tap((session) => {
        this.setSession(session.access, session.refresh);
        this.user.set(session.user);
        this.profileLoaded.set(true);
      }),
      map((session) => session.user),
      tap(() => this.loading.set(false)),
      catchError((error) => {
        this.loading.set(false);
        return throwError(() => error);
      })
    );
  }

  fetchProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me/`).pipe(
      tap((user) => {
        this.user.set(user);
        this.profileLoaded.set(true);
      })
    );
  }

  restoreSession(): Observable<UserProfile | null> {
    if (this.user()) {
      this.profileLoaded.set(true);
      return of(this.user());
    }

    const access = this.getAccessToken();
    if (!access) {
      this.clearSession();
      return of(null);
    }

    if (!this.restoreRequest$) {
      this.restoreRequest$ = this.fetchProfile().pipe(
        catchError(() => {
          this.clearSession();
          return of(null);
        }),
        tap(() => (this.restoreRequest$ = null)),
        shareReplay(1)
      );
    }

    return this.restoreRequest$;
  }

  updateProfile(payload: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/me/`, payload).pipe(
      tap((user) => this.user.set(user))
    );
  }

  logout(): Observable<void> {
    const refresh = localStorage.getItem(this.refreshTokenKey);

    if (!refresh) {
      this.clearSession();
      return of(void 0);
    }

    return this.http.post(`${this.apiUrl}/logout/`, { refresh }).pipe(
      map(() => void 0),
      catchError(() => of(void 0)),
      tap(() => this.clearSession())
    );
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  clearSession() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.accessToken.set(null);
    this.user.set(null);
    this.profileLoaded.set(true);
    this.restoreRequest$ = null;
  }

  private setSession(access: string, refresh: string) {
    localStorage.setItem(this.accessTokenKey, access);
    localStorage.setItem(this.refreshTokenKey, refresh);
    this.accessToken.set(access);
  }
}
