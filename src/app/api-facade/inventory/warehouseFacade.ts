import { Injectable, signal } from '@angular/core';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import {
  WarehouseControllerService,
  WarehouseDTO,
  WarehouseCreateDTO,
  WarehouseUpdateDTO
} from '../../api/inventory';

@Injectable({ providedIn: 'root' })
export class WarehouseFacade {

  private readonly _warehouses = signal<WarehouseDTO[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly warehouses = this._warehouses.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor(private api: WarehouseControllerService) {}

  loadWarehouses() {
    this._loading.set(true);
    this._error.set(null);

    this.api.getAllWarehouses().subscribe({
      next: (res: any) => {
        this._warehouses.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load warehouses', err);
        this._error.set(err.message || 'Erreur lors du chargement des entrepots');
        this._loading.set(false);
        this._warehouses.set([]);
      }
    });
  }

  getWarehouse(id: number): Observable<WarehouseDTO | null> {
    return this.api.getWarehouseById(id).pipe(
      map((res: any) => res?.data ?? null),
      catchError(err => {
        console.error('Failed to load warehouse', err);
        return throwError(() => new Error(err.message || 'Erreur lors du chargement de l\'entrepot'));
      })
    );
  }

  createWarehouse(data: WarehouseCreateDTO): Observable<WarehouseDTO> {
    return this.api.createWarehouse(data).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadWarehouses()),
      catchError(err => {
        console.error('Failed to create warehouse', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la creation de l\'entrepot'));
      })
    );
  }

  updateWarehouse(id: number, data: WarehouseUpdateDTO): Observable<WarehouseDTO> {
    return this.api.updateWarehouse(id, data).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadWarehouses()),
      catchError(err => {
        console.error('Failed to update warehouse', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la modification de l\'entrepot'));
      })
    );
  }

  deleteWarehouse(id: number): Observable<void> {
    return this.api.deleteWarehouse(id).pipe(
      map(() => undefined),
      tap(() => this.loadWarehouses()),
      catchError(err => {
        console.error('Failed to delete warehouse', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la suppression de l\'entrepot'));
      })
    );
  }
}
