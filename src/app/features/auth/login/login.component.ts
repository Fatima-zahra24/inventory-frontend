import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">
            <span class="logo-icon">INV</span>
          </div>
          <h1>Inventory Management</h1>
          <p>Connectez-vous pour acceder au systeme</p>
        </div>

        @if (expiredSession()) {
          <div class="alert alert-warning">
            <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Votre session a expire. Veuillez vous reconnecter.</span>
          </div>
        }

        @if (errorMessage()) {
          <div class="alert alert-error">
            <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="username">Nom d'utilisateur</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                id="username"
                formControlName="username"
                placeholder="Entrez votre nom d'utilisateur"
                [class.invalid]="isFieldInvalid('username')"
                autocomplete="username"
              />
            </div>
            @if (isFieldInvalid('username')) {
              <span class="error-text">Le nom d'utilisateur est requis</span>
            }
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="password"
                formControlName="password"
                placeholder="Entrez votre mot de passe"
                [class.invalid]="isFieldInvalid('password')"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="password-toggle"
                (click)="togglePassword()"
                tabindex="-1"
              >
                @if (showPassword()) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                }
              </button>
            </div>
            @if (isFieldInvalid('password')) {
              <span class="error-text">Le mot de passe est requis</span>
            }
          </div>

          <button
            type="submit"
            class="btn-login"
            [disabled]="isLoading() || loginForm.invalid"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
              <span>Connexion en cours...</span>
            } @else {
              <span>Se connecter</span>
            }
          </button>
        </form>

        <div class="login-footer">
          <p class="hint">
            <strong>Utilisateurs de test:</strong><br/>
            admin / admin123 (Admin)<br/>
            user / user123 (Utilisateur)
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      padding: 40px;
      width: 100%;
      max-width: 420px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo {
      display: inline-flex;
      margin-bottom: 16px;
    }

    .logo-icon {
      background: #4f46e5;
      color: white;
      padding: 12px 18px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 18px;
    }

    .login-header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 8px 0;
    }

    .login-header p {
      color: #64748b;
      margin: 0;
      font-size: 14px;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-size: 14px;
    }

    .alert-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .alert-warning {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
    }

    .alert-error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      width: 20px;
      height: 20px;
      color: #9ca3af;
      pointer-events: none;
    }

    .input-wrapper input {
      width: 100%;
      padding: 12px 44px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.2s ease;
      background: #f9fafb;
    }

    .input-wrapper input:focus {
      outline: none;
      border-color: #4f46e5;
      background: white;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .input-wrapper input.invalid {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .input-wrapper input.invalid:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .password-toggle {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .password-toggle svg {
      width: 20px;
      height: 20px;
      color: #9ca3af;
    }

    .password-toggle:hover svg {
      color: #4f46e5;
    }

    .error-text {
      font-size: 12px;
      color: #ef4444;
    }

    .btn-login {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 8px;
    }

    .btn-login:hover:not(:disabled) {
      background: #4338ca;
    }

    .btn-login:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .login-footer {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }

    .hint {
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      margin: 0;
      line-height: 1.6;
    }

    .hint strong {
      color: #374151;
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  expiredSession = signal(false);

  private returnUrl: string = '/dashboard';

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    // Check for returnUrl and expired session
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/dashboard';
      if (params['expired'] === 'true') {
        this.expiredSession.set(true);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.expiredSession.set(false);

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: () => {
        this.router.navigate([this.returnUrl]);
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      }
    });
  }
}
