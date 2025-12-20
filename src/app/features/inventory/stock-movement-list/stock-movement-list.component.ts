import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StockMovementFacade } from '../../../api-facade/inventory/stockMovementFacade';
import { WarehouseFacade } from '../../../api-facade/inventory/warehouseFacade';
import { StockMovementDTO, StockMovementCreateDTO } from '../../../api/inventory';
import {ProductFacade} from '../../../api-facade/products/productFacade';

@Component({
  selector: 'app-stock-movement-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="movement-list">
      <header class="header">
        <div class="header-left">
          <a routerLink="/inventory" class="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </a>
          <div>
            <h1>Mouvements de stock</h1>
            <p class="subtitle">Historique des entrees et sorties de stock</p>
          </div>
        </div>
        <button class="btn-primary" (click)="showModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nouveau mouvement
        </button>
      </header>

      <!-- Filters -->
      <div class="filters">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Rechercher..." [(ngModel)]="searchTerm">
        </div>
        <select [(ngModel)]="selectedType" (change)="onTypeChange()" class="filter-select">
          <option value="">Tous les types</option>
          <option value="IN">Entree</option>
          <option value="OUT">Sortie</option>
          <option value="PURCHASE">Achat</option>
          <option value="SALE">Vente</option>
          <option value="RETURN">Retour</option>
          <option value="DAMAGE">Dommage</option>
          <option value="TRANSFER_IN">Transfert entrant</option>
          <option value="TRANSFER_OUT">Transfert sortant</option>
          <option value="ADJUSTMENT">Ajustement</option>
        </select>
        <select [(ngModel)]="selectedWarehouse" (change)="onWarehouseChange()" class="filter-select">
          <option value="">Tous les entrepots</option>
          @for (warehouse of warehouseFacade.warehouses(); track warehouse.id) {
            <option [value]="warehouse.id">{{ warehouse.name }}</option>
          }
        </select>
      </div>

      @if (facade.loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <span>Chargement des mouvements...</span>
        </div>
      } @else if (facade.error()) {
        <div class="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <p>{{ facade.error() }}</p>
          <button (click)="facade.loadMovements()" class="btn-secondary">Reessayer</button>
        </div>
      } @else if (filteredMovements().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
          <h3>Aucun mouvement</h3>
          <p>Les mouvements de stock apparaitront ici</p>
        </div>
      } @else {
        <div class="stats-bar">
          <div class="stat">
            <span class="stat-value">{{ filteredMovements().length }}</span>
            <span class="stat-label">Mouvements</span>
          </div>
          <div class="stat">
            <span class="stat-value in">{{ inCount() }}</span>
            <span class="stat-label">Entrees</span>
          </div>
          <div class="stat">
            <span class="stat-value out">{{ outCount() }}</span>
            <span class="stat-label">Sorties</span>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Produit</th>
                <th>Entrepot</th>
                <th>Quantite</th>
                <th>Reference</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              @for (mov of paginatedMovements(); track mov.id) {
                <tr>
                  <td class="date">{{ mov.movementDate | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    <span class="type-badge" [class]="getTypeClass(mov.type)">
                      {{ getTypeLabel(mov.type) }}
                    </span>
                  </td>
                  <td class="product-cell">
                    <span class="product-code">{{ mov.productCode }}</span>
                    <span class="product-name">{{ mov.productName }}</span>
                  </td>
                  <td>{{ mov.warehouseName }}</td>
                  <td>
                    <span class="quantity" [class]="isInMovement(mov.type) ? 'in' : 'out'">
                      {{ isInMovement(mov.type) ? '+' : '-' }}{{ mov.quantity }}
                    </span>
                  </td>
                  <td class="reference">{{ mov.reference || '-' }}</td>
                  <td class="source">{{ mov.source || '-' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <div class="pagination-info">
            Affichage de {{ startIndex() + 1 }} a {{ endIndex() }} sur {{ filteredMovements().length }} mouvements
          </div>
          <div class="pagination-controls">
            <select [value]="pageSize" (change)="onPageSizeChange($event)" class="page-size-select">
              @for (size of pageSizeOptions; track size) {
                <option [value]="size">{{ size }} par page</option>
              }
            </select>
            <div class="page-buttons">
              <button class="page-btn" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              @for (page of visiblePages(); track page) {
                <button class="page-btn" [class.active]="page === currentPage()" (click)="goToPage(page)">
                  {{ page }}
                </button>
              }
              <button class="page-btn" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- New Movement Modal -->
      @if (showModal) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>Nouveau mouvement de stock</h2>

            <div class="form-group">
              <label>Type de mouvement *</label>
              <select [(ngModel)]="newMovement.type" class="form-control">
                <option value="">Selectionnez...</option>
                <option value="IN">Entree</option>
                <option value="OUT">Sortie</option>
                <option value="PURCHASE">Achat</option>
                <option value="SALE">Vente</option>
                <option value="RETURN">Retour</option>
                <option value="DAMAGE">Dommage</option>
                <option value="ADJUSTMENT">Ajustement</option>
              </select>
            </div>

            <div class="form-group">
              <label>Produit ID *</label>
              <select [(ngModel)]="newMovement.productId" class="form-control">
                <option [value]="0">Selectionnez...</option>
                @for (product of productFacade.products(); track product.id) {
                  <option [value]="product.id">{{ product.code }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Entrepot *</label>
              <select [(ngModel)]="newMovement.warehouseId" class="form-control">
                <option [value]="0">Selectionnez...</option>
                @for (warehouse of warehouseFacade.warehouses(); track warehouse.id) {
                  <option [value]="warehouse.id">{{ warehouse.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Quantite *</label>
              <input type="number" [(ngModel)]="newMovement.quantity" class="form-control" min="1" placeholder="Quantite">
            </div>

            <div class="form-group">
              <label>Reference</label>
              <input type="text" [(ngModel)]="newMovement.reference" class="form-control" placeholder="Ex: BON-001">
            </div>

            <div class="form-group">
              <label>Source</label>
              <input type="text" [(ngModel)]="newMovement.source" class="form-control" placeholder="Ex: Fournisseur XYZ">
            </div>

            @if (modalError) {
              <div class="error-message">{{ modalError }}</div>
            }

            <div class="modal-actions">
              <button class="btn-secondary" (click)="closeModal()">Annuler</button>
              <button class="btn-primary" (click)="createMovement()" [disabled]="!isFormValid() || submitting">
                @if (submitting) {
                  <span class="spinner-small"></span>
                }
                Creer
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .movement-list {
      padding: 32px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .back-btn {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px;
      cursor: pointer;
      display: flex;
      text-decoration: none;
      color: #374151;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .back-btn svg {
      width: 20px;
      height: 20px;
    }

    .header h1 {
      margin: 0 0 4px;
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .btn-primary, .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
    }

    .btn-primary:hover:not(:disabled) { background: #4338ca; }
    .btn-primary:disabled { background: #a5b4fc; cursor: not-allowed; }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .btn-secondary:hover { background: #f9fafb; }

    .btn-primary svg, .btn-secondary svg {
      width: 18px;
      height: 18px;
    }

    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }

    .search-box {
      flex: 1;
      max-width: 300px;
      position: relative;
    }

    .search-box svg {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      color: #9ca3af;
    }

    .search-box input {
      width: 100%;
      padding: 12px 12px 12px 44px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
    }

    .filter-select {
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      min-width: 180px;
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

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-right: 8px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .error-state, .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
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
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .empty-icon svg {
      width: 40px;
      height: 40px;
      color: #4f46e5;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      font-size: 18px;
      color: #1a1a2e;
    }

    .empty-state p {
      margin: 0;
      color: #666;
    }

    .stats-bar {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .stat-value.in { color: #059669; }
    .stat-value.out { color: #dc2626; }

    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }

    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      padding: 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    td {
      padding: 16px;
      font-size: 14px;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
    }

    tr:hover { background: #f9fafb; }

    .date {
      font-size: 13px;
      color: #666;
    }

    .type-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .type-badge.in { background: #d1fae5; color: #059669; }
    .type-badge.out { background: #fee2e2; color: #dc2626; }
    .type-badge.purchase { background: #dbeafe; color: #2563eb; }
    .type-badge.sale { background: #fef3c7; color: #d97706; }
    .type-badge.return { background: #e0e7ff; color: #4f46e5; }
    .type-badge.damage { background: #fce7f3; color: #db2777; }
    .type-badge.transfer { background: #f3f4f6; color: #374151; }
    .type-badge.adjustment { background: #f5f3ff; color: #7c3aed; }

    .product-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .product-code {
      font-family: monospace;
      font-weight: 600;
      color: #4f46e5;
    }

    .product-name {
      font-size: 13px;
      color: #666;
    }

    .quantity {
      font-weight: 600;
    }

    .quantity.in { color: #059669; }
    .quantity.out { color: #dc2626; }

    .reference, .source {
      font-size: 13px;
      color: #666;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding: 16px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .pagination-info {
      font-size: 14px;
      color: #666;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .page-size-select {
      padding: 8px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
      background: white;
    }

    .page-buttons {
      display: flex;
      gap: 4px;
    }

    .page-btn {
      min-width: 36px;
      height: 36px;
      padding: 0 8px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .page-btn:hover:not(:disabled) { background: #f9fafb; }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-btn.active { background: #4f46e5; border-color: #4f46e5; color: white; }
    .page-btn svg { width: 16px; height: 16px; }

    /* Modal */
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
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 12px;
      padding: 32px;
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal h2 {
      margin: 0 0 24px;
      font-size: 20px;
      color: #1a1a2e;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
    }

    .form-control:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .error-message {
      background: #fee2e2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 20px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
  `]
})
export class StockMovementListComponent implements OnInit {
  facade = inject(StockMovementFacade);
  warehouseFacade = inject(WarehouseFacade);

  productFacade = inject(ProductFacade);

  searchTerm = '';
  selectedType = '';
  selectedWarehouse = '';

  // Pagination
  pageSizeOptions = [20, 50, 100];
  pageSize = 20;
  private _currentPage = signal(1);
  currentPage = this._currentPage.asReadonly();

  // Modal
  showModal = false;
  submitting = false;
  modalError = '';
  newMovement: Partial<StockMovementCreateDTO> = {
    type: '' as any,
    productId: 0,
    warehouseId: 0,
    quantity: 1,
    reference: '',
    source: ''
  };

  filteredMovements = computed(() => {
    let result = this.facade.movements();
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(m =>
        m.productCode?.toLowerCase().includes(term) ||
        m.productName?.toLowerCase().includes(term) ||
        m.reference?.toLowerCase().includes(term)
      );
    }
    return result;
  });

  totalPages = computed(() => Math.ceil(this.filteredMovements().length / this.pageSize) || 1);
  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize);
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize, this.filteredMovements().length));

  paginatedMovements = computed(() => {
    const start = this.startIndex();
    return this.filteredMovements().slice(start, start + this.pageSize);
  });

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  inCount = computed(() => this.filteredMovements().filter(m => this.isInMovement(m.type)).length);
  outCount = computed(() => this.filteredMovements().filter(m => !this.isInMovement(m.type)).length);

  ngOnInit() {
    this.facade.loadMovements();
    this.warehouseFacade.loadWarehouses();
    this.productFacade.loadProducts();
  }

  onTypeChange() {
    if (this.selectedType) {
      this.facade.loadMovementsByType(this.selectedType as StockMovementDTO.TypeEnum);
    } else {
      this.facade.loadMovements();
    }
  }

  onWarehouseChange() {
    if (this.selectedWarehouse) {
      this.facade.loadMovementsByWarehouse(+this.selectedWarehouse);
    } else {
      this.facade.loadMovements();
    }
  }

  isInMovement(type: string): boolean {
    return ['IN', 'PURCHASE', 'RETURN', 'TRANSFER_IN'].includes(type);
  }

  getTypeClass(type: string): string {
    const map: Record<string, string> = {
      'IN': 'in', 'OUT': 'out', 'PURCHASE': 'purchase', 'SALE': 'sale',
      'RETURN': 'return', 'DAMAGE': 'damage', 'TRANSFER_IN': 'transfer',
      'TRANSFER_OUT': 'transfer', 'ADJUSTMENT': 'adjustment'
    };
    return map[type] || '';
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'IN': 'Entree', 'OUT': 'Sortie', 'PURCHASE': 'Achat', 'SALE': 'Vente',
      'RETURN': 'Retour', 'DAMAGE': 'Dommage', 'TRANSFER_IN': 'Transfert +',
      'TRANSFER_OUT': 'Transfert -', 'ADJUSTMENT': 'Ajustement'
    };
    return map[type] || type;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this._currentPage.set(page);
    }
  }

  onPageSizeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.pageSize = parseInt(select.value, 10);
    this._currentPage.set(1);
  }

  isFormValid(): boolean {
    return !!(this.newMovement.type && this.newMovement.productId && this.newMovement.warehouseId && this.newMovement.quantity && this.newMovement.quantity > 0);
  }

  closeModal() {
    this.showModal = false;
    this.modalError = '';
    this.newMovement = { type: '' as any, productId: 0, warehouseId: 0, quantity: 1, reference: '', source: '' };
  }

  createMovement() {
    if (!this.isFormValid()) return;

    this.submitting = true;
    this.modalError = '';

    this.facade.createMovement(this.newMovement as StockMovementCreateDTO).subscribe({
      next: () => {
        this.submitting = false;
        this.closeModal();
      },
      error: (err) => {
        this.submitting = false;
        this.modalError = err.message;
      }
    });
  }
}
