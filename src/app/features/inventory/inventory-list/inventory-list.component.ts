import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryFacade } from '../../../api-facade/inventory/inventoryFacade';
import { WarehouseFacade } from '../../../api-facade/inventory/warehouseFacade';
import { InventoryDTO, StockAlertDTO } from '../../../api/inventory';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="inventory-list">
      <header class="header">
        <div>
          <h1>Inventaire</h1>
          <p class="subtitle">Gerez vos stocks et suivez les niveaux d'inventaire</p>
        </div>
        <div class="header-actions">
          <a routerLink="/inventory/movements" class="btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Mouvements
          </a>
          <a routerLink="/inventory/warehouses" class="btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18"/>
            </svg>
            Entrepots
          </a>
          <button class="btn-primary" (click)="showMovementModal = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Nouveau mouvement
          </button>
        </div>
      </header>

      <!-- Alerts Section -->
      @if (inventoryFacade.alerts().length > 0) {
        <div class="alerts-section">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Alertes de stock ({{ inventoryFacade.alerts().length }})
          </h3>
          <div class="alerts-grid">
            @for (alert of inventoryFacade.alerts().slice(0, 5); track alert.productId) {
              <div class="alert-card" [class]="getAlertSeverityClass(alert.severity)">
                <div class="alert-info">
                  <span class="alert-product">{{ alert.productCode }} - {{ alert.productName }}</span>
                  <span class="alert-message">{{ alert.message }}</span>
                </div>
                <div class="alert-qty">
                  <span class="current">{{ alert.currentQuantity }}</span>
                  <span class="threshold">min: {{ alert.minThreshold }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="filters">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher un produit..."
            [(ngModel)]="searchTerm"
          >
        </div>
        <select [(ngModel)]="selectedWarehouse" class="filter-select">
          <option value="">Tous les entrepots</option>
          @for (warehouse of warehouseFacade.warehouses(); track warehouse.id) {
            <option [value]="warehouse.id">{{ warehouse.name }}</option>
          }
        </select>
        <select [(ngModel)]="stockFilter" class="filter-select">
          <option value="all">Tous les stocks</option>
          <option value="low">Stock bas</option>
          <option value="out">Rupture de stock</option>
          <option value="normal">Stock normal</option>
        </select>
      </div>

      @if (inventoryFacade.loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <span>Chargement des stocks...</span>
        </div>
      } @else if (inventoryFacade.error()) {
        <div class="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <p>{{ inventoryFacade.error() }}</p>
          <button (click)="inventoryFacade.loadInventories()" class="btn-secondary">Reessayer</button>
        </div>
      } @else if (filteredInventories().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <h3>Aucun stock trouve</h3>
          <p>Ajoutez des produits a votre inventaire pour commencer</p>
        </div>
      } @else {
        <div class="stats-bar">
          <div class="stat">
            <span class="stat-value">{{ filteredInventories().length }}</span>
            <span class="stat-label">Lignes</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ totalQuantity() }}</span>
            <span class="stat-label">Quantite totale</span>
          </div>
          <div class="stat">
            <span class="stat-value warning">{{ lowStockCount() }}</span>
            <span class="stat-label">Stock bas</span>
          </div>
          <div class="stat">
            <span class="stat-value danger">{{ outOfStockCount() }}</span>
            <span class="stat-label">Ruptures</span>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Entrepot</th>
                <th>Quantite</th>
                <th>Derniere MAJ</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (inv of paginatedInventories(); track inv.id) {
                <tr [class.low-stock]="inv.quantity > 0 && inv.quantity <= 10" [class.out-of-stock]="inv.quantity === 0">
                  <td class="product-cell">
                    <span class="product-code">{{ inv.productCode }}</span>
                    <span class="product-name">{{ inv.productName }}</span>
                  </td>
                  <td>
                    <span class="warehouse-name">{{ inv.warehouseName }}</span>
                    <span class="warehouse-location">{{ inv.warehouseLocation }}</span>
                  </td>
                  <td>
                    <span class="quantity" [class.low]="inv.quantity > 0 && inv.quantity <= 10" [class.out]="inv.quantity === 0">
                      {{ inv.quantity }}
                    </span>
                  </td>
                  <td class="date">{{ inv.updatedAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="actions">
                    <button class="btn-icon success" (click)="adjustStock(inv, 1)" title="Entree (+1)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    </button>
                    <button class="btn-icon warning" (click)="adjustStock(inv, -1)" title="Sortie (-1)" [disabled]="inv.quantity === 0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14"/>
                      </svg>
                    </button>
                    <button class="btn-icon" (click)="openAdjustModal(inv)" title="Ajuster">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <div class="pagination-info">
            Affichage de {{ startIndex() + 1 }} a {{ endIndex() }} sur {{ filteredInventories().length }} lignes
          </div>
          <div class="pagination-controls">
            <select [value]="pageSize" (change)="onPageSizeChange($event)" class="page-size-select">
              @for (size of pageSizeOptions; track size) {
                <option [value]="size">{{ size }} par page</option>
              }
            </select>
            <div class="page-buttons">
              <button class="page-btn" [disabled]="currentPage() === 1" (click)="goToPage(1)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
                </svg>
              </button>
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
              <button class="page-btn" [disabled]="currentPage() === totalPages()" (click)="goToPage(totalPages())">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Adjust Modal -->
      @if (showAdjustModal && selectedInventory) {
        <div class="modal-overlay" (click)="closeAdjustModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>Ajuster le stock</h2>
            <p class="modal-product">{{ selectedInventory.productCode }} - {{ selectedInventory.productName }}</p>
            <p class="modal-warehouse">Entrepot: {{ selectedInventory.warehouseName }}</p>
            <p class="modal-current">Stock actuel: <strong>{{ selectedInventory.quantity }}</strong></p>

            <div class="adjust-form">
              <label>Ajustement</label>
              <div class="adjust-input">
                <button class="adjust-btn" (click)="adjustmentValue = adjustmentValue - 1">-</button>
                <input type="number" [(ngModel)]="adjustmentValue">
                <button class="adjust-btn" (click)="adjustmentValue = adjustmentValue + 1">+</button>
              </div>
              <p class="new-quantity">Nouveau stock: <strong>{{ selectedInventory.quantity + adjustmentValue }}</strong></p>
            </div>

            <div class="modal-actions">
              <button class="btn-secondary" (click)="closeAdjustModal()">Annuler</button>
              <button class="btn-primary" (click)="confirmAdjust()" [disabled]="adjustmentValue === 0 || (selectedInventory.quantity + adjustmentValue) < 0">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .inventory-list {
      padding: 32px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
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

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn-primary, .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
      border: none;
    }

    .btn-primary:hover { background: #4338ca; }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .btn-secondary:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .btn-primary svg, .btn-secondary svg {
      width: 18px;
      height: 18px;
    }

    /* Alerts */
    .alerts-section {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .alerts-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px;
      font-size: 16px;
      color: #92400e;
    }

    .alerts-section h3 svg {
      width: 20px;
      height: 20px;
    }

    .alerts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }

    .alert-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: white;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }

    .alert-card.critical {
      border-left-color: #dc2626;
      background: #fef2f2;
    }

    .alert-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .alert-product {
      font-weight: 600;
      color: #1a1a2e;
      font-size: 14px;
    }

    .alert-message {
      font-size: 12px;
      color: #666;
    }

    .alert-qty {
      text-align: right;
    }

    .alert-qty .current {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: #dc2626;
    }

    .alert-qty .threshold {
      font-size: 11px;
      color: #666;
    }

    /* Filters */
    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }

    .search-box {
      flex: 1;
      max-width: 400px;
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

    .search-box input:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .filter-select {
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      cursor: pointer;
      min-width: 180px;
    }

    /* Loading, Error, Empty states */
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

    /* Stats */
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

    .stat-value.warning { color: #d97706; }
    .stat-value.danger { color: #dc2626; }

    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Table */
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
      letter-spacing: 0.5px;
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
    tr.low-stock { background: #fef3c7; }
    tr.out-of-stock { background: #fee2e2; }

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

    .warehouse-name {
      display: block;
      font-weight: 500;
    }

    .warehouse-location {
      display: block;
      font-size: 12px;
      color: #666;
    }

    .quantity {
      display: inline-block;
      padding: 4px 12px;
      background: #d1fae5;
      color: #059669;
      border-radius: 20px;
      font-weight: 600;
    }

    .quantity.low {
      background: #fef3c7;
      color: #d97706;
    }

    .quantity.out {
      background: #fee2e2;
      color: #dc2626;
    }

    .date {
      font-size: 13px;
      color: #666;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      padding: 8px;
      background: #f3f4f6;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon:hover { background: #e5e7eb; }
    .btn-icon.success:hover { background: #d1fae5; color: #059669; }
    .btn-icon.warning:hover { background: #fef3c7; color: #d97706; }
    .btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-icon svg {
      width: 16px;
      height: 16px;
    }

    /* Pagination */
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
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-btn.active {
      background: #4f46e5;
      border-color: #4f46e5;
      color: white;
    }

    .page-btn svg {
      width: 16px;
      height: 16px;
    }

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
      max-width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }

    .modal h2 {
      margin: 0 0 16px;
      font-size: 20px;
      color: #1a1a2e;
    }

    .modal-product {
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 8px;
    }

    .modal-warehouse, .modal-current {
      font-size: 14px;
      color: #666;
      margin: 0 0 8px;
    }

    .adjust-form {
      margin: 24px 0;
    }

    .adjust-form label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }

    .adjust-input {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .adjust-input input {
      flex: 1;
      text-align: center;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
    }

    .adjust-btn {
      width: 44px;
      height: 44px;
      background: #f3f4f6;
      border: none;
      border-radius: 8px;
      font-size: 24px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .adjust-btn:hover { background: #e5e7eb; }

    .new-quantity {
      margin: 16px 0 0;
      text-align: center;
      font-size: 16px;
      color: #374151;
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
export class InventoryListComponent implements OnInit {
  inventoryFacade = inject(InventoryFacade);
  warehouseFacade = inject(WarehouseFacade);

  // Filters as signals for reactivity
  private _searchTerm = signal('');
  private _selectedWarehouse = signal('');
  private _stockFilter = signal('all');

  // Getters/setters for ngModel binding
  get searchTerm() { return this._searchTerm(); }
  set searchTerm(value: string) { this._searchTerm.set(value); }

  get selectedWarehouse() { return this._selectedWarehouse(); }
  set selectedWarehouse(value: string) { this._selectedWarehouse.set(value); }

  get stockFilter() { return this._stockFilter(); }
  set stockFilter(value: string) { this._stockFilter.set(value); }

  // Pagination
  pageSizeOptions = [10, 20, 50, 100];
  private _pageSize = signal(20);
  get pageSize() { return this._pageSize(); }
  set pageSize(value: number) { this._pageSize.set(value); }

  private _currentPage = signal(1);
  currentPage = this._currentPage.asReadonly();

  // Modal
  showMovementModal = false;
  showAdjustModal = false;
  selectedInventory: InventoryDTO | null = null;
  adjustmentValue = 0;

  filteredInventories = computed(() => {
    let result = this.inventoryFacade.inventories();
    const searchTerm = this._searchTerm();
    const selectedWarehouse = this._selectedWarehouse();
    const stockFilter = this._stockFilter();

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(inv =>
        inv.productCode?.toLowerCase().includes(term) ||
        inv.productName?.toLowerCase().includes(term)
      );
    }

    if (selectedWarehouse) {
      result = result.filter(inv => inv.warehouseId === +selectedWarehouse);
    }

    if (stockFilter === 'low') {
      result = result.filter(inv => inv.quantity > 0 && inv.quantity <= 10);
    } else if (stockFilter === 'out') {
      result = result.filter(inv => inv.quantity === 0);
    } else if (stockFilter === 'normal') {
      result = result.filter(inv => inv.quantity > 10);
    }

    return result;
  });

  totalPages = computed(() => Math.ceil(this.filteredInventories().length / this._pageSize()) || 1);
  startIndex = computed(() => (this.currentPage() - 1) * this._pageSize());
  endIndex = computed(() => Math.min(this.startIndex() + this._pageSize(), this.filteredInventories().length));

  paginatedInventories = computed(() => {
    const start = this.startIndex();
    return this.filteredInventories().slice(start, start + this._pageSize());
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

  // Stats
  totalQuantity = computed(() => this.filteredInventories().reduce((sum, inv) => sum + inv.quantity, 0));
  lowStockCount = computed(() => this.filteredInventories().filter(inv => inv.quantity > 0 && inv.quantity <= 10).length);
  outOfStockCount = computed(() => this.filteredInventories().filter(inv => inv.quantity === 0).length);

  ngOnInit() {
    this.inventoryFacade.loadInventories();
    this.inventoryFacade.loadAlerts();
    this.warehouseFacade.loadWarehouses();
  }

  getAlertSeverityClass(severity: string | undefined): string {
    return severity === 'CRITICAL' ? 'critical' : '';
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

  adjustStock(inv: InventoryDTO, adjustment: number) {
    if (inv.id) {
      this.inventoryFacade.adjustQuantity(inv.id, adjustment).subscribe();
    }
  }

  openAdjustModal(inv: InventoryDTO) {
    this.selectedInventory = inv;
    this.adjustmentValue = 0;
    this.showAdjustModal = true;
  }

  closeAdjustModal() {
    this.showAdjustModal = false;
    this.selectedInventory = null;
    this.adjustmentValue = 0;
  }

  confirmAdjust() {
    if (this.selectedInventory?.id && this.adjustmentValue !== 0) {
      this.inventoryFacade.adjustQuantity(this.selectedInventory.id, this.adjustmentValue).subscribe({
        next: () => this.closeAdjustModal(),
        error: (err) => alert(err.message)
      });
    }
  }
}
