import {Injectable, signal} from '@angular/core';
import {ProductControllerService, ProductDTO} from '../../api/product';

@Injectable({ providedIn: 'root' })
export class ProductFacade {

  private readonly _products = signal<ProductDTO[]>([]);
  readonly products = this._products.asReadonly();

  constructor(private api: ProductControllerService) {}

  loadProducts() {
    this.api.getAllProducts().subscribe({
      next: res => {
        this._products.set(res?.data ?? []);
        console.error('Load products succeed', res?.success);
      },
      error: err => {
        console.error('Failed to load products', err);
        this._products.set([]);
      }
    });
  }
}
