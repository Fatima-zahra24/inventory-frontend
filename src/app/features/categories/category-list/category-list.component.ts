import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryFacade } from '../../../api-facade/categories/categoryFacade';
import { CategoryDTO } from '../../../api/product';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container">
      <header class="header">
        <div class="header-left">
          <h1>Categories</h1>
          <span class="badge">{{ categories().length }}</span>
        </div>
        <a routerLink="/categories/new" class="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvelle categorie
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

      @if (!loading() && !error() && categories().length === 0) {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <h2>Aucune categorie</h2>
          <p>Commencez par ajouter votre premiere categorie</p>
          <a routerLink="/categories/new" class="btn-primary">
            Ajouter une categorie
          </a>
        </div>
      }

      @if (!loading() && categories().length > 0) {
        <div class="grid-container">
          @for (category of paginatedCategories(); track category.id) {
            <div class="category-card">
              <div class="card-header">
                <div class="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div class="card-actions">
                  <a [routerLink]="['/categories', category.id]" class="action-btn edit" title="Modifier">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </a>
                  <button class="action-btn delete" (click)="confirmDelete(category)" title="Supprimer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="card-body">
                <h3>{{ category.name }}</h3>
                @if (category.description) {
                  <p>{{ category.description }}</p>
                } @else {
                  <p class="no-description">Aucune description</p>
                }
              </div>
              <div class="card-footer">
                <span class="category-id">#{{ category.id }}</span>
              </div>
            </div>
          }
        </div>

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
            <span>{{ startIndex() + 1 }} - {{ endIndex() }} sur {{ categories().length }}</span>
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
      }

      @if (showDeleteModal) {
        <div class="modal-overlay" (click)="cancelDelete()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Confirmer la suppression</h3>
            <p>Etes-vous sur de vouloir supprimer la categorie <strong>{{ categoryToDelete?.name }}</strong> ?</p>
            <p class="warning">Attention: Les produits associes a cette categorie pourraient etre affectes.</p>
            <div class="modal-actions">
              <button class="btn-secondary" (click)="cancelDelete()">Annuler</button>
              <button class="btn-danger" (click)="deleteCategory()" [disabled]="deleting">
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
      background: #fef3c7;
      color: #d97706;
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
      border: none;
      cursor: pointer;
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

    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .category-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      overflow: hidden;
      transition: all 0.2s;
    }

    .category-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    }

    .card-icon {
      width: 40px;
      height: 40px;
      background: white;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d97706;
    }

    .card-icon svg {
      width: 20px;
      height: 20px;
    }

    .card-actions {
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
      background: rgba(255,255,255,0.8);
      color: #6b7280;
      text-decoration: none;
    }

    .action-btn:hover {
      background: white;
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
    }

    .action-btn.edit:hover {
      color: #4f46e5;
    }

    .action-btn.delete:hover {
      color: #dc2626;
    }

    .card-body {
      padding: 20px;
    }

    .card-body h3 {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .card-body p {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    }

    .card-body .no-description {
      font-style: italic;
      color: #9ca3af;
    }

    .card-footer {
      padding: 12px 20px;
      border-top: 1px solid #f3f4f6;
      background: #f9fafb;
    }

    .category-id {
      font-size: 12px;
      color: #9ca3af;
      font-family: monospace;
    }

    /* Pagination Styles */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
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
      margin: 0 0 16px;
      color: #666;
    }

    .modal .warning {
      background: #fef3c7;
      color: #92400e;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
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

      .grid-container {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CategoryListComponent implements OnInit {
  private categoryFacade = inject(CategoryFacade);

  readonly categories = this.categoryFacade.categories;
  readonly loading = this.categoryFacade.loading;
  readonly error = this.categoryFacade.error;

  // Pagination
  pageSizeOptions = [6, 12, 24, 48];
  pageSize = 12;
  private _currentPage = signal(1);
  currentPage = this._currentPage.asReadonly();

  totalPages = computed(() => Math.ceil(this.categories().length / this.pageSize) || 1);

  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize);

  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize, this.categories().length));

  paginatedCategories = computed(() => {
    const start = this.startIndex();
    const end = start + this.pageSize;
    return this.categories().slice(start, end);
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
  categoryToDelete: CategoryDTO | null = null;
  deleting = false;

  ngOnInit() {
    this.categoryFacade.loadCategories();
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

  // Delete methods
  confirmDelete(category: CategoryDTO) {
    this.categoryToDelete = category;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.categoryToDelete = null;
  }

  deleteCategory() {
    if (!this.categoryToDelete?.id) return;

    this.deleting = true;
    this.categoryFacade.deleteCategory(this.categoryToDelete.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.categoryToDelete = null;
        this.deleting = false;
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
