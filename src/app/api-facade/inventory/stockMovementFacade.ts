import { Injectable, signal } from '@angular/core';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import {
  StockMovementControllerService,
  StockMovementDTO,
  StockMovementCreateDTO
} from '../../api/inventory';

@Injectable({ providedIn: 'root' })
export class StockMovementFacade {

  private readonly _movements = signal<StockMovementDTO[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly movements = this._movements.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor(private api: StockMovementControllerService) {}

  loadMovements() {
    this._loading.set(true);
    this._error.set(null);

    this.api.getAllMovements().subscribe({
      next: (res: any) => {
        this._movements.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load movements', err);
        this._error.set(err.message || 'Erreur lors du chargement des mouvements');
        this._loading.set(false);
        this._movements.set([]);
      }
    });
  }

  loadMovementsByProduct(productId: number) {
    this._loading.set(true);
    this._error.set(null);

    this.api.getMovementsByProduct(productId).subscribe({
      next: (res: any) => {
        this._movements.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load movements by product', err);
        this._error.set(err.message || 'Erreur lors du chargement des mouvements');
        this._loading.set(false);
      }
    });
  }

  loadMovementsByWarehouse(warehouseId: number) {
    this._loading.set(true);
    this._error.set(null);

    this.api.getMovementsByWarehouse(warehouseId).subscribe({
      next: (res: any) => {
        this._movements.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load movements by warehouse', err);
        this._error.set(err.message || 'Erreur lors du chargement des mouvements');
        this._loading.set(false);
      }
    });
  }

  loadMovementsByType(type: StockMovementDTO.TypeEnum) {
    this._loading.set(true);
    this._error.set(null);

    this.api.getMovementsByType(type).subscribe({
      next: (res: any) => {
        this._movements.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load movements by type', err);
        this._error.set(err.message || 'Erreur lors du chargement des mouvements');
        this._loading.set(false);
      }
    });
  }

  loadMovementsByDateRange(startDate: string, endDate: string) {
    this._loading.set(true);
    this._error.set(null);

    this.api.getMovementsByDateRange(startDate, endDate).subscribe({
      next: (res: any) => {
        this._movements.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load movements by date range', err);
        this._error.set(err.message || 'Erreur lors du chargement des mouvements');
        this._loading.set(false);
      }
    });
  }

  createMovement(data: StockMovementCreateDTO): Observable<StockMovementDTO> {
    return this.api.createMovement(data).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadMovements()),
      catchError(err => {
        console.error('Failed to create movement', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la creation du mouvement'));
      })
    );
  }
}
