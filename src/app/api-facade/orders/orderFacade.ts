import { Injectable, signal } from '@angular/core';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import {
  OrderControllerService,
  OrderDTO,
  OrderSummaryDTO,
  OrderCreateDTO,
  OrderUpdateDTO,
  OrderStatsDTO
} from '../../api/order';

@Injectable({ providedIn: 'root' })
export class OrderFacade {

  private readonly _orders = signal<OrderSummaryDTO[]>([]);
  private readonly _stats = signal<OrderStatsDTO | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly orders = this._orders.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor(private api: OrderControllerService) {}

  loadOrders() {
    this._loading.set(true);
    this._error.set(null);

    this.api.getAllOrders().subscribe({
      next: (res: any) => {
        this._orders.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load orders', err);
        this._error.set(err.message || 'Erreur lors du chargement des commandes');
        this._loading.set(false);
        this._orders.set([]);
      }
    });
  }

  loadStats() {
    this.api.getOrderStats().subscribe({
      next: (res: any) => {
        this._stats.set(res?.data ?? null);
      },
      error: err => {
        console.error('Failed to load order stats', err);
      }
    });
  }

  loadOrdersByStatus(status: OrderDTO.StatusEnum) {
    this._loading.set(true);
    this._error.set(null);

    this.api.getOrdersByStatus(status).subscribe({
      next: (res: any) => {
        this._orders.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load orders by status', err);
        this._error.set(err.message || 'Erreur lors du chargement des commandes');
        this._loading.set(false);
      }
    });
  }

  loadOrdersByCustomerEmail(email: string) {
    this._loading.set(true);
    this._error.set(null);

    this.api.getOrdersByCustomerEmail(email).subscribe({
      next: (res: any) => {
        this._orders.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load orders by customer', err);
        this._error.set(err.message || 'Erreur lors du chargement des commandes');
        this._loading.set(false);
      }
    });
  }

  loadOrdersByDateRange(startDate: string, endDate: string) {
    this._loading.set(true);
    this._error.set(null);

    this.api.getOrdersByDateRange(startDate, endDate).subscribe({
      next: (res: any) => {
        this._orders.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load orders by date range', err);
        this._error.set(err.message || 'Erreur lors du chargement des commandes');
        this._loading.set(false);
      }
    });
  }

  getOrder(id: number): Observable<OrderDTO | null> {
    return this.api.getOrderById(id).pipe(
      map((res: any) => res?.data ?? null),
      catchError(err => {
        console.error('Failed to load order', err);
        return throwError(() => new Error(err.message || 'Erreur lors du chargement de la commande'));
      })
    );
  }

  getOrderByNumber(orderNumber: string): Observable<OrderDTO | null> {
    return this.api.getOrderByNumber(orderNumber).pipe(
      map((res: any) => res?.data ?? null),
      catchError(err => {
        console.error('Failed to load order by number', err);
        return throwError(() => new Error(err.message || 'Erreur lors du chargement de la commande'));
      })
    );
  }

  createOrder(data: OrderCreateDTO): Observable<OrderDTO> {
    return this.api.createOrder(data).pipe(
      map((res: any) => res?.data),
      tap(() => {
        this.loadOrders();
        this.loadStats();
      }),
      catchError(err => {
        console.error('Failed to create order', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la creation de la commande'));
      })
    );
  }

  updateOrder(id: number, data: OrderUpdateDTO): Observable<OrderDTO> {
    return this.api.updateOrder(id, data).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadOrders()),
      catchError(err => {
        console.error('Failed to update order', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la modification de la commande'));
      })
    );
  }

  updateOrderStatus(id: number, status: OrderDTO.StatusEnum): Observable<OrderDTO> {
    return this.api.updateOrderStatus(id, status).pipe(
      map((res: any) => res?.data),
      tap(() => {
        this.loadOrders();
        this.loadStats();
      }),
      catchError(err => {
        console.error('Failed to update order status', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors du changement de statut'));
      })
    );
  }

  updatePaymentStatus(id: number, paymentStatus: OrderDTO.PaymentStatusEnum): Observable<OrderDTO> {
    return this.api.updatePaymentStatus(id, paymentStatus).pipe(
      map((res: any) => res?.data),
      tap(() => {
        this.loadOrders();
        this.loadStats();
      }),
      catchError(err => {
        console.error('Failed to update payment status', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors du changement de statut de paiement'));
      })
    );
  }

  cancelOrder(id: number): Observable<OrderDTO> {
    return this.api.cancelOrder(id).pipe(
      map((res: any) => res?.data),
      tap(() => {
        this.loadOrders();
        this.loadStats();
      }),
      catchError(err => {
        console.error('Failed to cancel order', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de l\'annulation de la commande'));
      })
    );
  }

  deleteOrder(id: number): Observable<void> {
    return this.api.deleteOrder(id).pipe(
      map(() => undefined),
      tap(() => {
        this.loadOrders();
        this.loadStats();
      }),
      catchError(err => {
        console.error('Failed to delete order', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la suppression de la commande'));
      })
    );
  }
}
