import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductFacade } from '../../../api-facade/products/productFacade';
import { ProductDTO } from '../../../api/product';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container">
      <header class="header">
        <div class="header-left">
          <h1>Produits</h1>
          <span class="badge">{{ products().length }}</span>
        </div>
        <a routerLink="/products/new" class="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouveau produit
        </a>
      </header>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <span>Chargement...</span>
        </div>
      }

      @if (error()) {
        <div class="error">{{ error() }}</div>
      }

      @if (!loading() && !error() && products().length === 0) {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          <h2>Aucun produit</h2>
          <p>Commencez par ajouter votre premier produit</p>
          <a routerLink="/products/new" class="btn-primary">
            Ajouter un produit
          </a>
        </div>
      }

      @if (!loading() && products().length > 0) {
        <div class="table-container">
          <table class="table">
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
              @for (product of paginatedProducts(); track product.id) {
                <tr>
                  <td class="code">{{ product.code }}</td>
                  <td>
                    <strong>{{ product.name }}</strong>
                    @if (product.description) {
                      <small>{{ product.description }}</small>
                    }
                  </td>
                  <td>{{ product.categoryName }}</td>
                  <td class="price">{{ product.basePrice | currency:'EUR' }}</td>
                  <td>
                    <span class="status" [class]="product.status.toLowerCase()">
                      {{ getStatusLabel(product.status) }}
                    </span>
                  </td>
                  <td class="actions">
                    <a [routerLink]="['/products', product.id]" class="action-btn edit" title="Modifier">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </a>
                    <button
                      class="action-btn"
                      [class.activate]="product.status !== 'ACTIVE'"
                      [class.deactivate]="product.status === 'ACTIVE'"
                      (click)="toggleStatus(product)"
                      [title]="product.status === 'ACTIVE' ? 'Desactiver' : 'Activer'"
                    >
                      @if (product.status === 'ACTIVE') {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                        </svg>
                      } @else {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      }
                    </button>
                    <button
                      class="action-btn delete"
                      (click)="confirmDelete(product)"
                      title="Supprimer"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="pagination">
            <div class="pagination-info">
              <span>Afficher</span>
              <select [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange()">
                @for (size of pageSizeOptions; track size) {
                  <option [value]="size">{{ size }}</option>
                }
              </select>
              <span>par page</span>
              <span class="separator">|</span>
              <span>{{ startIndex() + 1 }} - {{ endIndex() }} sur {{ products().length }}</span>
            </div>

            <div class="pagination-controls">
              <button
                class="page-btn"
                (click)="goToFirstPage()"
                [disabled]="currentPage() === 1"
                title="Premiere page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="11 17 6 12 11 7"/>
                  <polyline points="18 17 13 12 18 7"/>
                </svg>
              </button>
              <button
                class="page-btn"
                (click)="previousPage()"
                [disabled]="currentPage() === 1"
                title="Page precedente"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>

              @for (page of visiblePages(); track page) {
                @if (page === '...') {
                  <span class="page-ellipsis">...</span>
                } @else {
                  <button
                    class="page-btn page-number"
                    [class.active]="currentPage() === page"
                    (click)="goToPage(+page)"
                  >
                    {{ page }}
                  </button>
                }
              }

              <button
                class="page-btn"
                (click)="nextPage()"
                [disabled]="currentPage() === totalPages()"
                title="Page suivante"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
              <button
                class="page-btn"
                (click)="goToLastPage()"
                [disabled]="currentPage() === totalPages()"
                title="Derniere page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="13 17 18 12 13 7"/>
                  <polyline points="6 17 11 12 6 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      }

      @if (showDeleteModal) {
        <div class="modal-overlay" (click)="cancelDelete()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Confirmer la suppression</h3>
            <p>Etes-vous sur de vouloir supprimer le produit <strong>{{ productToDelete?.name }}</strong> ?</p>
            <div class="modal-actions">
              <button class="btn-secondary" (click)="cancelDelete()">Annuler</button>
              <button class="btn-danger" (click)="deleteProduct()" [disabled]="deleting">
                @if (deleting) {
                  Suppression...
                } @else {
                  Supprimer
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .container {
      padding: 32px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .badge {
      background: #e0e7ff;
      color: #4f46e5;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 500;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #4f46e5;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: background 0.2s;
    }

    .btn-primary:hover {
      background: #4338ca;
    }

    .btn-primary svg {
      width: 18px;
      height: 18px;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 60px;
      justify-content: center;
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

    .error {
      background: #fee2e2;
      color: #dc2626;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .empty-state svg {
      width: 64px;
      height: 64px;
      color: #9ca3af;
      margin-bottom: 16px;
    }

    .empty-state h2 {
      margin: 0 0 8px;
      font-size: 18px;
      color: #1a1a2e;
    }

    .empty-state p {
      margin: 0 0 24px;
      color: #666;
    }

    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table th {
      background: #f9fafb;
      padding: 14px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .table td {
      padding: 16px;
      border-top: 1px solid #f3f4f6;
      vertical-align: middle;
    }

    .table td strong {
      display: block;
      color: #1a1a2e;
      margin-bottom: 2px;
    }

    .table td small {
      color: #9ca3af;
      font-size: 13px;
    }

    .code {
      font-family: 'SF Mono', Monaco, monospace;
      color: #6b7280;
      font-size: 13px;
    }

    .price {
      font-weight: 600;
      color: #4f46e5;
    }

    .status {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .status.active {
      background: #d1fae5;
      color: #059669;
    }

    .status.inactive {
      background: #fef3c7;
      color: #d97706;
    }

    .status.discontinued {
      background: #fee2e2;
      color: #dc2626;
    }

    .status.out_of_stock {
      background: #fce7f3;
      color: #be185d;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      background: #f3f4f6;
      color: #6b7280;
      text-decoration: none;
    }

    .action-btn:hover {
      background: #e5e7eb;
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
    }

    .action-btn.edit:hover {
      background: #e0e7ff;
      color: #4f46e5;
    }

    .action-btn.activate:hover {
      background: #d1fae5;
      color: #059669;
    }

    .action-btn.deactivate:hover {
      background: #fef3c7;
      color: #d97706;
    }

    .action-btn.delete:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    tr:hover {
      background: #fafafa;
    }

    /* Pagination Styles */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-top: 1px solid #f3f4f6;
      background: #f9fafb;
    }

    .pagination-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #6b7280;
    }

    .pagination-info select {
      padding: 6px 10px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
      font-size: 14px;
      cursor: pointer;
    }

    .pagination-info select:focus {
      outline: none;
      border-color: #4f46e5;
    }

    .pagination-info .separator {
      color: #d1d5db;
      margin: 0 8px;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .page-btn {
      width: 36px;
      height: 36px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      color: #374151;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 500;
    }

    .page-btn:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #d1d5db;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-btn svg {
      width: 16px;
      height: 16px;
    }

    .page-btn.page-number {
      min-width: 36px;
      width: auto;
      padding: 0 12px;
    }

    .page-btn.active {
      background: #4f46e5;
      border-color: #4f46e5;
      color: white;
    }

    .page-btn.active:hover {
      background: #4338ca;
    }

    .page-ellipsis {
      padding: 0 8px;
      color: #9ca3af;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
    }

    .modal {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
    }

    .modal h3 {
      margin: 0 0 12px;
      font-size: 18px;
      color: #1a1a2e;
    }

    .modal p {
      margin: 0 0 24px;
      color: #666;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-secondary,
    .btn-danger {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
      border: none;
    }

    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn-danger:disabled {
      background: #fca5a5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .pagination {
        flex-direction: column;
        gap: 16px;
      }

      .pagination-info {
        flex-wrap: wrap;
        justify-content: center;
      }
    }
  `]
})
export class ProductListComponent implements OnInit {
  private productFacade = inject(ProductFacade);

  readonly products = this.productFacade.products;
  readonly loading = this.productFacade.loading;
  readonly error = this.productFacade.error;

  // Pagination
  pageSizeOptions = [5, 10, 20, 50];
  pageSize = 10;
  private _currentPage = signal(1);
  currentPage = this._currentPage.asReadonly();

  totalPages = computed(() => Math.ceil(this.products().length / this.pageSize) || 1);

  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize);

  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize, this.products().length));

  paginatedProducts = computed(() => {
    const start = this.startIndex();
    const end = start + this.pageSize;
    return this.products().slice(start, end);
  });

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      pages.push(total);
    }

    return pages;
  });

  // Delete modal
  showDeleteModal = false;
  productToDelete: ProductDTO | null = null;
  deleting = false;

  ngOnInit() {
    this.productFacade.loadProducts();
  }

  // Pagination methods
  onPageSizeChange() {
    this._currentPage.set(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this._currentPage.set(page);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this._currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this._currentPage.update(p => p + 1);
    }
  }

  goToFirstPage() {
    this._currentPage.set(1);
  }

  goToLastPage() {
    this._currentPage.set(this.totalPages());
  }

  // Product methods
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'Actif',
      'INACTIVE': 'Inactif',
      'DISCONTINUED': 'Arrete',
      'OUT_OF_STOCK': 'Rupture'
    };
    return labels[status] || status;
  }

  toggleStatus(product: ProductDTO) {
    if (product.status === 'ACTIVE') {
      this.productFacade.deactivateProduct(product.id!).subscribe();
    } else {
      this.productFacade.activateProduct(product.id!).subscribe();
    }
  }

  confirmDelete(product: ProductDTO) {
    this.productToDelete = product;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.productToDelete = null;
  }

  deleteProduct() {
    if (!this.productToDelete?.id) return;

    this.deleting = true;
    this.productFacade.deleteProduct(this.productToDelete.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.productToDelete = null;
        this.deleting = false;
        // Adjust current page if needed
        if (this.currentPage() > this.totalPages()) {
          this._currentPage.set(Math.max(1, this.totalPages()));
        }
      },
      error: () => {
        this.deleting = false;
      }
    });
  }
}
