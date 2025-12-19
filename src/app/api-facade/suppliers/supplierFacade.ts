import { Injectable, signal } from '@angular/core';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import {
  SupplierControllerService,
  SupplierDTO,
  SupplierCreateDTO,
  SupplierUpdateDTO
} from '../../api/supplier';

@Injectable({ providedIn: 'root' })
export class SupplierFacade {

  private readonly _suppliers = signal<SupplierDTO[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly suppliers = this._suppliers.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor(private api: SupplierControllerService) {}

  loadSuppliers() {
    this._loading.set(true);
    this._error.set(null);

    this.api.getAllSuppliers().subscribe({
      next: (res: any) => {
        this._suppliers.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load suppliers', err);
        this._error.set(err.message || 'Erreur lors du chargement des fournisseurs');
        this._loading.set(false);
        this._suppliers.set([]);
      }
    });
  }

  getSupplier(id: number): Observable<SupplierDTO | null> {
    return this.api.getSupplierById(id).pipe(
      map((res: any) => res?.data ?? null),
      catchError(err => {
        console.error('Failed to load supplier', err);
        return throwError(() => new Error(err.message || 'Erreur lors du chargement du fournisseur'));
      })
    );
  }

  createSupplier(data: SupplierCreateDTO): Observable<SupplierDTO> {
    return this.api.createSupplier(data).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadSuppliers()),
      catchError(err => {
        console.error('Failed to create supplier', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la creation du fournisseur'));
      })
    );
  }

  updateSupplier(id: number, data: SupplierUpdateDTO): Observable<SupplierDTO> {
    return this.api.updateSupplier(id, data).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadSuppliers()),
      catchError(err => {
        console.error('Failed to update supplier', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la modification du fournisseur'));
      })
    );
  }

  deleteSupplier(id: number): Observable<void> {
    return this.api.deleteSupplier(id).pipe(
      map(() => undefined),
      tap(() => this.loadSuppliers()),
      catchError(err => {
        console.error('Failed to delete supplier', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la suppression du fournisseur'));
      })
    );
  }

  activateSupplier(id: number): Observable<SupplierDTO> {
    return this.api.activateSupplier(id).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadSuppliers()),
      catchError(err => {
        console.error('Failed to activate supplier', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de l\'activation du fournisseur'));
      })
    );
  }

  deactivateSupplier(id: number): Observable<SupplierDTO> {
    return this.api.deactivateSupplier(id).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadSuppliers()),
      catchError(err => {
        console.error('Failed to deactivate supplier', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la desactivation du fournisseur'));
      })
    );
  }

  suspendSupplier(id: number): Observable<SupplierDTO> {
    return this.api.suspendSupplier(id).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadSuppliers()),
      catchError(err => {
        console.error('Failed to suspend supplier', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la suspension du fournisseur'));
      })
    );
  }
}
