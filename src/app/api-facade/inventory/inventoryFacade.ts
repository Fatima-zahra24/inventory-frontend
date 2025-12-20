import { Injectable, signal } from '@angular/core';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import {
  InventoryControllerService,
  InventoryDTO,
  InventoryCreateDTO,
  InventoryUpdateDTO,
  StockAlertDTO,
  InventoryStatsDTO
} from '../../api/inventory';

@Injectable({ providedIn: 'root' })
export class InventoryFacade {

  private readonly _inventories = signal<InventoryDTO[]>([]);
  private readonly _alerts = signal<StockAlertDTO[]>([]);
  private readonly _stats = signal<InventoryStatsDTO | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly inventories = this._inventories.asReadonly();
  readonly alerts = this._alerts.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor(private api: InventoryControllerService) {}

  loadInventories() {
    this._loading.set(true);
    this._error.set(null);

    this.api.getAllInventories().subscribe({
      next: (res: any) => {
        this._inventories.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load inventories', err);
        this._error.set(err.message || 'Erreur lors du chargement des stocks');
        this._loading.set(false);
        this._inventories.set([]);
      }
    });
  }

  loadAlerts() {
    this.api.getStockAlerts().subscribe({
      next: (res: any) => {
        this._alerts.set(res?.data ?? []);
      },
      error: err => {
        console.error('Failed to load alerts', err);
      }
    });
  }

  loadStats() {
    this.api.getInventoryStats().subscribe({
      next: (res: any) => {
        this._stats.set(res?.data ?? null);
      },
      error: err => {
        console.error('Failed to load inventory stats', err);
      }
    });
  }

  getInventory(id: number): Observable<InventoryDTO | null> {
    return this.api.getInventoryById(id).pipe(
      map((res: any) => res?.data ?? null),
      catchError(err => {
        console.error('Failed to load inventory', err);
        return throwError(() => new Error(err.message || 'Erreur lors du chargement du stock'));
      })
    );
  }

  getInventoriesByWarehouse(warehouseId: number): Observable<InventoryDTO[]> {
    return this.api.getInventoriesByWarehouse(warehouseId).pipe(
      map((res: any) => res?.data ?? []),
      catchError(err => {
        console.error('Failed to load inventories by warehouse', err);
        return throwError(() => new Error(err.message || 'Erreur lors du chargement des stocks'));
      })
    );
  }

  getInventoriesByProduct(productId: number): Observable<InventoryDTO[]> {
    return this.api.getInventoriesByProduct(productId).pipe(
      map((res: any) => res?.data ?? []),
      catchError(err => {
        console.error('Failed to load inventories by product', err);
        return throwError(() => new Error(err.message || 'Erreur lors du chargement des stocks'));
      })
    );
  }

  createInventory(data: InventoryCreateDTO): Observable<InventoryDTO> {
    return this.api.createInventory(data).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadInventories()),
      catchError(err => {
        console.error('Failed to create inventory', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la creation du stock'));
      })
    );
  }

  updateInventory(id: number, data: InventoryUpdateDTO): Observable<InventoryDTO> {
    return this.api.updateInventory(id, data).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadInventories()),
      catchError(err => {
        console.error('Failed to update inventory', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la modification du stock'));
      })
    );
  }

  adjustQuantity(id: number, adjustment: number): Observable<InventoryDTO> {
    return this.api.adjustQuantity(id, adjustment).pipe(
      map((res: any) => res?.data),
      tap(() => {
        this.loadInventories();
        this.loadAlerts();
      }),
      catchError(err => {
        console.error('Failed to adjust quantity', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de l\'ajustement du stock'));
      })
    );
  }

  deleteInventory(id: number): Observable<void> {
    return this.api.deleteInventory(id).pipe(
      map(() => undefined),
      tap(() => this.loadInventories()),
      catchError(err => {
        console.error('Failed to delete inventory', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la suppression du stock'));
      })
    );
  }
}
