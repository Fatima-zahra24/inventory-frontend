import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: route.url.map(s => s.path).join('/') }
    });
    return false;
  }

  // Check for required roles if specified in route data
  const requiredRoles = route.data['roles'] as string[] | undefined;

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = authService.hasAnyRole(requiredRoles);

    if (!hasRequiredRole) {
      // User is logged in but doesn't have the required role
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};

// Guard for admin-only routes
export const adminGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: route.url.map(s => s.path).join('/') }
    });
    return false;
  }

  if (!authService.isAdmin()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

// Guard to redirect authenticated users away from login page
export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
