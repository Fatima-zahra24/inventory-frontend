import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TOKEN_STORAGE_KEY } from '../auth/auth.models';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  // Don't add token for auth endpoints
  const isAuthEndpoint = req.url.includes('/auth/');

  if (token && !isAuthEndpoint) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        // Token expired or invalid - clear storage and redirect to login
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem('auth_user');
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url, expired: 'true' }
        });
      }
      return throwError(() => error);
    })
  );
};
