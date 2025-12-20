import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LoginRequest,
  AuthResponse,
  User,
  AUTH_STORAGE_KEY,
  TOKEN_STORAGE_KEY
} from './auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly authUrl = `${environment.apiGateway}/auth`;

  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly _isAuthenticated = signal<boolean>(this.hasValidToken());
  public readonly isAuthenticated = this._isAuthenticated.asReadonly();

  constructor() {
    this.checkTokenExpiration();
  }

  login(username: string, password: string): Observable<AuthResponse> {
    const request: LoginRequest = { username, password };

    return this.http.post<AuthResponse>(`${this.authUrl}/login`, request).pipe(
      tap((response) => this.handleLoginSuccess(response)),
      catchError((error) => this.handleLoginError(error))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.currentUserSubject.next(null);
    this._isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.roles) {
      return false;
    }
    return user.roles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  private handleLoginSuccess(response: AuthResponse): void {
    const user: User = {
      username: response.username,
      roles: response.roles,
      token: response.token
    };

    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

    this.currentUserSubject.next(user);
    this._isAuthenticated.set(true);
  }

  private handleLoginError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de la connexion';

    if (error.status === 401) {
      errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de contacter le serveur';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  private loadUserFromStorage(): User | null {
    const userJson = localStorage.getItem(AUTH_STORAGE_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson) as User;
      } catch {
        return null;
      }
    }
    return null;
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Decode JWT to check expiration
    try {
      const payload = this.decodeToken(token);
      if (payload && payload.exp) {
        const expirationDate = new Date(payload.exp * 1000);
        return expirationDate > new Date();
      }
      return true; // If no exp claim, assume valid
    } catch {
      return false;
    }
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  private checkTokenExpiration(): void {
    const token = this.getToken();
    if (token) {
      const payload = this.decodeToken(token);
      if (payload && payload.exp) {
        const expirationDate = new Date(payload.exp * 1000);
        const now = new Date();

        if (expirationDate <= now) {
          this.logout();
        } else {
          // Set timeout to logout when token expires
          const timeUntilExpiry = expirationDate.getTime() - now.getTime();
          setTimeout(() => this.logout(), timeUntilExpiry);
        }
      }
    }
  }

  handleUnauthorized(): void {
    this.logout();
  }
}
