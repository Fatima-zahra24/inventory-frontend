import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductFacade } from '../../../api-facade/products/productFacade';
import { ProductDTO } from '../../../api/product';

@Component({
  selector: 'app-supplier-products-dialog',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dialog-overlay" (click)="onOverlayClick($event)">
      <div class="dialog-container">
        <div class="dialog-header">
          <div>
            <h2>Produits fournis</h2>
            <p class="supplier-name">{{ supplierName() }}</p>
          </div>
          <button class="close-btn" (click)="close()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="dialog-content">
          @if (loading()) {
            <div class="loading">
              <div class="spinner"></div>
              <span>Chargement des produits...</span>
            </div>
          } @else if (error()) {
            <div class="error-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              <p>{{ error() }}</p>
              <button (click)="loadProducts()" class="btn-secondary">Reessayer</button>
            </div>
          } @else if (products().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <h3>Aucun produit</h3>
              <p>Ce fournisseur n'a pas encore de produits associes</p>
            </div>
          } @else {
            <div class="products-count">
              <span class="count-badge">{{ products().length }}</span>
              produit{{ products().length > 1 ? 's' : '' }} trouve{{ products().length > 1 ? 's' : '' }}
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Nom</th>
                    <th>Categorie</th>
                    <th>Prix</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (product of products(); track product.id) {
                    <tr>
                      <td class="code">{{ product.code }}</td>
                      <td class="name">{{ product.name }}</td>
                      <td>{{ product.categoryName || '-' }}</td>
                      <td class="price">{{ product.basePrice | number:'1.2-2' }} DH</td>
                      <td>
                        <span class="status-badge" [class]="getStatusClass(product.status)">
                          {{ getStatusLabel(product.status) }}
                        </span>
                      </td>
                      <td class="actions">
                        <a [routerLink]="['/products', product.id]" class="btn-icon" title="Voir le produit" (click)="close()">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <div class="dialog-footer">
          <button class="btn-secondary" (click)="close()">Fermer</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .dialog-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 900px;
      width: 100%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.2s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .dialog-header h2 {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .supplier-name {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }

    .close-btn {
      padding: 8px;
      background: #f3f4f6;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #e5e7eb;
    }

    .close-btn svg {
      width: 20px;
      height: 20px;
      color: #6b7280;
    }

    .dialog-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 60px;
      color: #666;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #e5e7eb;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state,
    .empty-state {
      text-align: center;
      padding: 40px 20px;
    }

    .error-state svg {
      width: 48px;
      height: 48px;
      color: #dc2626;
      margin-bottom: 16px;
    }

    .error-state p {
      color: #dc2626;
      margin: 0 0 16px;
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .empty-icon svg {
      width: 32px;
      height: 32px;
      color: #4f46e5;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      font-size: 16px;
      color: #1a1a2e;
    }

    .empty-state p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .products-count {
      margin-bottom: 16px;
      font-size: 14px;
      color: #6b7280;
    }

    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 8px;
      background: #4f46e5;
      color: white;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 6px;
    }

    .table-container {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    td {
      padding: 12px 16px;
      font-size: 14px;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover {
      background: #f9fafb;
    }

    .code {
      font-family: monospace;
      font-weight: 600;
      color: #4f46e5;
    }

    .name {
      font-weight: 500;
      color: #1a1a2e;
    }

    .price {
      font-weight: 500;
      color: #059669;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 500;
    }

    .status-badge.active {
      background: #d1fae5;
      color: #059669;
    }

    .status-badge.inactive {
      background: #f3f4f6;
      color: #6b7280;
    }

    .status-badge.discontinued {
      background: #fee2e2;
      color: #dc2626;
    }

    .status-badge.out-of-stock {
      background: #fef3c7;
      color: #d97706;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      padding: 6px;
      background: #f3f4f6;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: #374151;
    }

    .btn-icon:hover {
      background: #e0e7ff;
      color: #4f46e5;
    }

    .btn-icon svg {
      width: 16px;
      height: 16px;
    }

    .dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
    }

    .btn-secondary {
      padding: 10px 20px;
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }
  `]
})
export class SupplierProductsDialogComponent implements OnInit {
  private productFacade = inject(ProductFacade);

  private _supplierId = signal<number | null>(null);
  private _supplierName = signal<string>('');
  private _visible = signal<boolean>(false);
  private _products = signal<ProductDTO[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _onClose: (() => void) | null = null;

  supplierName = this._supplierName.asReadonly();
  visible = this._visible.asReadonly();
  products = this._products.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  ngOnInit() {
    if (this._supplierId()) {
      this.loadProducts();
    }
  }

  open(supplierId: number, supplierName: string, onClose?: () => void) {
    this._supplierId.set(supplierId);
    this._supplierName.set(supplierName);
    this._visible.set(true);
    this._onClose = onClose ?? null;
    this.loadProducts();
  }

  close() {
    this._visible.set(false);
    this._products.set([]);
    this._error.set(null);
    if (this._onClose) {
      this._onClose();
    }
  }

  loadProducts() {
    const supplierId = this._supplierId();
    if (!supplierId) return;

    this._loading.set(true);
    this._error.set(null);

    this.productFacade.getProductsBySupplier(supplierId).subscribe({
      next: (products) => {
        this._products.set(products);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(err.message || 'Erreur lors du chargement des produits');
        this._loading.set(false);
      }
    });
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.close();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'active';
      case 'INACTIVE': return 'inactive';
      case 'DISCONTINUED': return 'discontinued';
      case 'OUT_OF_STOCK': return 'out-of-stock';
      default: return 'inactive';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'INACTIVE': return 'Inactif';
      case 'DISCONTINUED': return 'Arrete';
      case 'OUT_OF_STOCK': return 'Rupture';
      default: return 'Inconnu';
    }
  }
}
