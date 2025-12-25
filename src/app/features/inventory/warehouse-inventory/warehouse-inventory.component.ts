import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryFacade } from '../../../api-facade/inventory/inventoryFacade';
import { WarehouseFacade } from '../../../api-facade/inventory/warehouseFacade';
import { InventoryDTO, WarehouseDTO } from '../../../api/inventory';

@Component({
  selector: 'app-warehouse-inventory',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="warehouse-inventory">
      <header class="header">
        <div class="header-left">
          <a routerLink="/inventory/warehouses" class="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </a>
          <div>
            <h1>{{ warehouse()?.name || 'Inventaire' }}</h1>
            <p class="subtitle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {{ warehouse()?.location || 'Chargement...' }}
            </p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <span class="stat-value">{{ inventories().length }}</span>
            <span class="stat-label">Produits</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ totalQuantity() | number }}</span>
            <span class="stat-label">Unite totales</span>
          </div>
        </div>
      </header>

      <!-- Search & Filter -->
      <div class="filters-bar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            [(ngModel)]="searchTerm"
            placeholder="Rechercher un produit..."
          >
        </div>
        <div class="filter-group">
          <select [(ngModel)]="stockFilter">
            <option value="all">Tous les stocks</option>
            <option value="low">Stock faible (&lt; 10)</option>
            <option value="out">Rupture de stock</option>
            <option value="available">En stock</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <span>Chargement de l'inventaire...</span>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <p>{{ error() }}</p>
          <button (click)="loadData()" class="btn-secondary">Reessayer</button>
        </div>
      } @else if (filteredInventories().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          @if (searchTerm || stockFilter !== 'all') {
            <h3>Aucun resultat</h3>
            <p>Aucun produit ne correspond a vos criteres de recherche</p>
            <button class="btn-secondary" (click)="clearFilters()">Effacer les filtres</button>
          } @else {
            <h3>Entrepot vide</h3>
            <p>Aucun produit n'est stocke dans cet entrepot</p>
            <a routerLink="/inventory" class="btn-primary">Gerer l'inventaire</a>
          }
        </div>
      } @else {
        <div class="inventory-table-container">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Code</th>
                <th class="text-right">Quantite</th>
                <th>Statut</th>
                <th>Derniere MAJ</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filteredInventories(); track item.id) {
                <tr>
                  <td>
                    <div class="product-cell">
                      <div class="product-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                      </div>
                      <span class="product-name">{{ item.productName }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="product-code">{{ item.productCode }}</span>
                  </td>
                  <td class="text-right">
                    <span class="quantity" [class.low]="item.quantity < 10" [class.out]="item.quantity === 0">
                      {{ item.quantity | number }}
                    </span>
                  </td>
                  <td>
                    @if (item.quantity === 0) {
                      <span class="status-badge out-of-stock">Rupture</span>
                    } @else if (item.quantity < 10) {
                      <span class="status-badge low-stock">Stock faible</span>
                    } @else {
                      <span class="status-badge in-stock">En stock</span>
                    }
                  </td>
                  <td>
                    <span class="date">{{ item.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Summary Cards -->
        <div class="summary-section">
          <h3>Resume du stock</h3>
          <div class="summary-cards">
            <div class="summary-card green">
              <div class="summary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div class="summary-info">
                <span class="summary-value">{{ inStockCount() }}</span>
                <span class="summary-label">En stock</span>
              </div>
            </div>
            <div class="summary-card orange">
              <div class="summary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div class="summary-info">
                <span class="summary-value">{{ lowStockCount() }}</span>
                <span class="summary-label">Stock faible</span>
              </div>
            </div>
            <div class="summary-card red">
              <div class="summary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div class="summary-info">
                <span class="summary-value">{{ outOfStockCount() }}</span>
                <span class="summary-label">Rupture</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .warehouse-inventory {
      padding: 32px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
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
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .subtitle {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .subtitle svg {
      width: 16px;
      height: 16px;
    }

    .header-stats {
      display: flex;
      gap: 16px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 16px 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 100px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #4f46e5;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    /* Filters */
    .filters-bar {
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
      left: 14px;
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
      border-radius: 10px;
      font-size: 14px;
      background: white;
    }

    .search-box input:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .filter-group select {
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      background: white;
      cursor: pointer;
    }

    .filter-group select:focus {
      outline: none;
      border-color: #4f46e5;
    }

    /* Loading & States */
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
      margin: 0 0 20px;
      color: #666;
    }

    /* Table */
    .inventory-table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      overflow: hidden;
      margin-bottom: 32px;
    }

    .inventory-table {
      width: 100%;
      border-collapse: collapse;
    }

    .inventory-table th {
      padding: 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .inventory-table th.text-right {
      text-align: right;
    }

    .inventory-table td {
      padding: 16px;
      border-bottom: 1px solid #f3f4f6;
    }

    .inventory-table tr:last-child td {
      border-bottom: none;
    }

    .inventory-table tr:hover {
      background: #f9fafb;
    }

    .product-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .product-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .product-icon svg {
      width: 20px;
      height: 20px;
      color: #4f46e5;
    }

    .product-name {
      font-weight: 500;
      color: #1a1a2e;
    }

    .product-code {
      font-family: monospace;
      font-size: 13px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .text-right {
      text-align: right;
    }

    .quantity {
      font-weight: 600;
      font-size: 16px;
      color: #059669;
    }

    .quantity.low {
      color: #d97706;
    }

    .quantity.out {
      color: #dc2626;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.in-stock {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.low-stock {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.out-of-stock {
      background: #fee2e2;
      color: #991b1b;
    }

    .date {
      font-size: 13px;
      color: #9ca3af;
    }

    /* Summary Section */
    .summary-section {
      margin-top: 32px;
    }

    .summary-section h3 {
      margin: 0 0 16px;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .summary-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .summary-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .summary-icon svg {
      width: 24px;
      height: 24px;
    }

    .summary-card.green .summary-icon {
      background: #d1fae5;
      color: #059669;
    }

    .summary-card.orange .summary-icon {
      background: #fef3c7;
      color: #d97706;
    }

    .summary-card.red .summary-icon {
      background: #fee2e2;
      color: #dc2626;
    }

    .summary-info {
      display: flex;
      flex-direction: column;
    }

    .summary-value {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .summary-label {
      font-size: 14px;
      color: #6b7280;
    }

    /* Buttons */
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
      text-decoration: none;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
    }

    .btn-primary:hover { background: #4338ca; }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .btn-secondary:hover { background: #f9fafb; }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: 20px;
      }

      .header-stats {
        width: 100%;
        justify-content: space-around;
      }

      .filters-bar {
        flex-direction: column;
      }

      .search-box {
        max-width: none;
      }

      .summary-cards {
        grid-template-columns: 1fr;
      }

      .inventory-table-container {
        overflow-x: auto;
      }

      .inventory-table {
        min-width: 600px;
      }
    }
  `]
})
export class WarehouseInventoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private inventoryFacade = inject(InventoryFacade);
  private warehouseFacade = inject(WarehouseFacade);

  warehouseId = signal<number | null>(null);
  warehouse = signal<WarehouseDTO | null>(null);
  inventories = signal<InventoryDTO[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  searchTerm = '';
  stockFilter = 'all';

  filteredInventories = computed(() => {
    let items = this.inventories();

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      items = items.filter(i =>
        i.productName?.toLowerCase().includes(term) ||
        i.productCode?.toLowerCase().includes(term)
      );
    }

    // Stock filter
    switch (this.stockFilter) {
      case 'low':
        items = items.filter(i => i.quantity > 0 && i.quantity < 10);
        break;
      case 'out':
        items = items.filter(i => i.quantity === 0);
        break;
      case 'available':
        items = items.filter(i => i.quantity >= 10);
        break;
    }

    return items;
  });

  totalQuantity = computed(() =>
    this.inventories().reduce((sum, i) => sum + i.quantity, 0)
  );

  inStockCount = computed(() =>
    this.inventories().filter(i => i.quantity >= 10).length
  );

  lowStockCount = computed(() =>
    this.inventories().filter(i => i.quantity > 0 && i.quantity < 10).length
  );

  outOfStockCount = computed(() =>
    this.inventories().filter(i => i.quantity === 0).length
  );

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.warehouseId.set(id);
        this.loadData();
      }
    });
  }

  loadData() {
    const id = this.warehouseId();
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);

    // Load warehouse info
    const warehouses = this.warehouseFacade.warehouses();
    const found = warehouses.find(w => w.id === id);
    if (found) {
      this.warehouse.set(found);
    } else {
      this.warehouseFacade.loadWarehouses();
    }

    // Load inventories for this warehouse
    this.inventoryFacade.getInventoriesByWarehouse(id).subscribe({
      next: (data) => {
        this.inventories.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Erreur lors du chargement de l\'inventaire');
        this.loading.set(false);
      }
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.stockFilter = 'all';
  }
}