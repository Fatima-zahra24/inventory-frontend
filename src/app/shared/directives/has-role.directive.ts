import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  private roles: string[] = [];
  private isVisible = false;
  private subscription?: Subscription;

  @Input()
  set appHasRole(roles: string | string[]) {
    this.roles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateView(): void {
    const hasRole = this.authService.hasAnyRole(this.roles);

    if (hasRole && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasRole && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
}

@Directive({
  selector: '[appIsAdmin]',
  standalone: true
})
export class IsAdminDirective implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  private isVisible = false;
  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe(() => {
      this.updateView();
    });
    this.updateView();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateView(): void {
    const isAdmin = this.authService.isAdmin();

    if (isAdmin && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!isAdmin && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
}

@Directive({
  selector: '[appIsAuthenticated]',
  standalone: true
})
export class IsAuthenticatedDirective implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  private isVisible = false;
  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe(() => {
      this.updateView();
    });
    this.updateView();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateView(): void {
    const isAuthenticated = this.authService.isLoggedIn();

    if (isAuthenticated && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!isAuthenticated && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
}
