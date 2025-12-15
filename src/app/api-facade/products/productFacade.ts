import { Injectable, signal } from '@angular/core';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import {
  ProductControllerService,
  ProductDTO,
  ProductCreateDTO,
  ProductUpdateDTO
} from '../../api/product';

@Injectable({ providedIn: 'root' })
export class ProductFacade {

  private readonly _products = signal<ProductDTO[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly products = this._products.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor(private api: ProductControllerService) {}

  loadProducts() {
    this._loading.set(true);
    this._error.set(null);

    this.api.getAllProducts().subscribe({
      next: (res: any) => {
        console.log('Products loaded:', res);
        this._products.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load products', err);
        this._error.set(err.message || 'Erreur lors du chargement des produits');
        this._loading.set(false);
        this._products.set([]);
      }
    });
  }

  getProduct(id: number): Observable<ProductDTO | null> {
    return this.api.getProductById(id).pipe(
      map((res: any) => res?.data ?? null),
      catchError(err => {
        console.error('Failed to load product', err);
        return throwError(() => new Error(err.message || 'Erreur lors du chargement du produit'));
      })
    );
  }

  createProduct(data: ProductCreateDTO): Observable<ProductDTO> {
    return this.api.createProduct(data).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadProducts()),
      catchError(err => {
        console.error('Failed to create product', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la creation du produit'));
      })
    );
  }

  updateProduct(id: number, data: ProductUpdateDTO): Observable<ProductDTO> {
    return this.api.updateProduct(id, data).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadProducts()),
      catchError(err => {
        console.error('Failed to update product', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la modification du produit'));
      })
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.api.deleteProduct(id).pipe(
      map(() => undefined),
      tap(() => this.loadProducts()),
      catchError(err => {
        console.error('Failed to delete product', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la suppression du produit'));
      })
    );
  }

  activateProduct(id: number): Observable<ProductDTO> {
    return this.api.activateProduct(id).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadProducts()),
      catchError(err => {
        console.error('Failed to activate product', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de l\'activation du produit'));
      })
    );
  }

  deactivateProduct(id: number): Observable<ProductDTO> {
    return this.api.deactivateProduct(id).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadProducts()),
      catchError(err => {
        console.error('Failed to deactivate product', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la desactivation du produit'));
      })
    );
  }
}
