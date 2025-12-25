import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderFacade } from '../../../api-facade/orders/orderFacade';
import { OrderSummaryDTO, OrderDTO } from '../../../api/order';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="order-list">
      <header class="header">
        <div>
          <h1>Commandes</h1>
          <p class="subtitle">Gestion des commandes clients</p>
        </div>
        <a routerLink="/orders/new" class="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvelle commande
        </a>
      </header>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.totalOrders ?? 0 }}</span>
            <span class="stat-label">Total commandes</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pending">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.pendingOrders ?? 0 }}</span>
            <span class="stat-label">En attente</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon revenue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.totalRevenue ?? 0 | number:'1.2-2' }} DH</span>
            <span class="stat-label">Chiffre d'affaires</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon average">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.averageOrderValue ?? 0 | number:'1.2-2' }} DH</span>
            <span class="stat-label">Panier moyen</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher par numero, client..."
            [(ngModel)]="searchTerm"
            (input)="onSearch()">
        </div>
        <div class="filter-group">
          <select [(ngModel)]="statusFilter" (change)="onFilterChange()">
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmee</option>
            <option value="PROCESSING">En traitement</option>
            <option value="SHIPPED">Expediee</option>
            <option value="DELIVERED">Livree</option>
            <option value="CANCELLED">Annulee</option>
            <option value="REFUNDED">Remboursee</option>
          </select>
          <select [(ngModel)]="paymentFilter" (change)="onFilterChange()">
            <option value="">Tous les paiements</option>
            <option value="PENDING">En attente</option>
            <option value="PAID">Paye</option>
            <option value="FAILED">Echoue</option>
            <option value="REFUNDED">Rembourse</option>
          </select>
          <input
            type="date"
            [(ngModel)]="startDate"
            (change)="onDateChange()"
            placeholder="Date debut">
          <input
            type="date"
            [(ngModel)]="endDate"
            (change)="onDateChange()"
            placeholder="Date fin">
        </div>
      </div>

      <!-- Table -->
      <div class="table-container">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <span>Chargement des commandes...</span>
          </div>
        } @else if (filteredOrders().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <h3>Aucune commande</h3>
            <p>Commencez par creer une nouvelle commande</p>
            <a routerLink="/orders/new" class="btn-primary">Creer une commande</a>
          </div>
        } @else {
          <table>
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Client</th>
                <th>Email</th>
                <th>Statut</th>
                <th>Paiement</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (order of paginatedOrders(); track order.id) {
                <tr>
                  <td class="order-number">{{ order.orderNumber }}</td>
                  <td class="customer-name">{{ order.customerName }}</td>
                  <td class="email">{{ order.customerEmail }}</td>
                  <td>
                    <span class="status-badge" [class]="getStatusClass(order.status)">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </td>
                  <td>
                    <span class="payment-badge" [class]="getPaymentClass(order.paymentStatus)">
                      {{ getPaymentLabel(order.paymentStatus) }}
                    </span>
                  </td>
                  <td class="items-count">{{ order.totalItems }}</td>
                  <td class="total">{{ order.totalAmount | number:'1.2-2' }} DH</td>
                  <td class="date">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="actions">
                    <a [routerLink]="['/orders', order.id]" class="btn-icon" title="Voir details">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </a>
                    <a [routerLink]="['/orders', order.id, 'edit']" class="btn-icon" title="Modifier">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </a>
                    @if (order.status === 'PENDING' || order.status === 'CONFIRMED') {
                      <button class="btn-icon warning" (click)="onCancel(order)" title="Annuler">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="pagination">
            <div class="page-info">
              Affichage {{ startIndex() + 1 }} - {{ endIndex() }} sur {{ filteredOrders().length }} commandes
            </div>
            <div class="page-controls">
              <select [(ngModel)]="pageSize" (change)="onPageSizeChange()">
                <option [value]="10">10 par page</option>
                <option [value]="20">20 par page</option>
                <option [value]="50">50 par page</option>
              </select>
              <button
                class="page-btn"
                [disabled]="currentPage() === 1"
                (click)="goToPage(currentPage() - 1)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              @for (page of visiblePages(); track page) {
                <button
                  class="page-btn"
                  [class.active]="page === currentPage()"
                  (click)="goToPage(page)">
                  {{ page }}
                </button>
              }
              <button
                class="page-btn"
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(currentPage() + 1)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Cancel Confirmation Modal -->
      @if (showCancelModal()) {
        <div class="modal-overlay" (click)="closeCancelModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Annuler la commande</h3>
              <button class="close-btn" (click)="closeCancelModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p>Etes-vous sur de vouloir annuler la commande <strong>{{ orderToCancel()?.orderNumber }}</strong> ?</p>
              <p class="warning-text">Cette action est irreversible.</p>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeCancelModal()">Non, garder</button>
              <button class="btn-danger" (click)="confirmCancel()">Oui, annuler</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .order-list {
      padding: 32px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .header h1 {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .subtitle {
      margin: 0;
      color: #666;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
    }

    .btn-primary svg {
      width: 18px;
      height: 18px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon svg {
      width: 24px;
      height: 24px;
    }

    .stat-icon.total {
      background: #e0e7ff;
      color: #4f46e5;
    }

    .stat-icon.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .stat-icon.revenue {
      background: #d1fae5;
      color: #059669;
    }

    .stat-icon.average {
      background: #fce7f3;
      color: #db2777;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .stat-label {
      font-size: 13px;
      color: #666;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 250px;
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
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .search-box input:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .filter-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .filter-group select,
    .filter-group input[type="date"] {
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      background: white;
      cursor: pointer;
    }

    .filter-group select:focus,
    .filter-group input[type="date"]:focus {
      outline: none;
      border-color: #4f46e5;
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

    tr:hover {
      background: #f9fafb;
    }

    .order-number {
      font-family: monospace;
      font-weight: 600;
      color: #4f46e5;
    }

    .customer-name {
      font-weight: 500;
    }

    .email {
      color: #6b7280;
    }

    .items-count {
      text-align: center;
    }

    .total {
      font-weight: 600;
      color: #059669;
    }

    .date {
      color: #6b7280;
      font-size: 13px;
    }

    /* Status Badges */
    .status-badge, .payment-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.confirmed { background: #dbeafe; color: #1e40af; }
    .status-badge.processing { background: #ffedd5; color: #c2410c; }
    .status-badge.shipped { background: #ede9fe; color: #6d28d9; }
    .status-badge.delivered { background: #d1fae5; color: #065f46; }
    .status-badge.cancelled { background: #fee2e2; color: #991b1b; }
    .status-badge.refunded { background: #f3f4f6; color: #374151; }

    .payment-badge.pending { background: #fef3c7; color: #92400e; }
    .payment-badge.paid { background: #d1fae5; color: #065f46; }
    .payment-badge.failed { background: #fee2e2; color: #991b1b; }
    .payment-badge.refunded { background: #f3f4f6; color: #374151; }

    /* Actions */
    .actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      padding: 8px;
      background: #f3f4f6;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: #374151;
    }

    .btn-icon:hover {
      background: #e5e7eb;
    }

    .btn-icon.warning:hover {
      background: #fef3c7;
      color: #d97706;
    }

    .btn-icon svg {
      width: 16px;
      height: 16px;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
    }

    .page-info {
      font-size: 14px;
      color: #666;
    }

    .page-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .page-controls select {
      padding: 8px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 13px;
      margin-right: 12px;
    }

    .page-btn {
      min-width: 36px;
      height: 36px;
      padding: 0 12px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .page-btn:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .page-btn.active {
      background: #4f46e5;
      border-color: #4f46e5;
      color: white;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-btn svg {
      width: 16px;
      height: 16px;
    }

    /* Loading & Empty States */
    .loading-state {
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

    .empty-state {
      text-align: center;
      padding: 60px 20px;
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

    /* Modal */
    .modal-overlay {
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
    }

    .modal {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 18px;
      color: #1a1a2e;
    }

    .close-btn {
      padding: 8px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #6b7280;
    }

    .close-btn:hover {
      color: #1a1a2e;
    }

    .close-btn svg {
      width: 20px;
      height: 20px;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-body p {
      margin: 0 0 8px;
      color: #374151;
    }

    .warning-text {
      color: #dc2626 !important;
      font-size: 14px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
    }

    .btn-secondary {
      padding: 10px 20px;
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    .btn-danger {
      padding: 10px 20px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }
  `]
})
export class OrderListComponent implements OnInit {
  private facade = inject(OrderFacade);

  readonly orders = this.facade.orders;
  readonly stats = this.facade.stats;
  readonly loading = this.facade.loading;

  searchTerm = '';
  statusFilter = '';
  paymentFilter = '';
  startDate = '';
  endDate = '';
  pageSize = 10;

  private _currentPage = signal(1);
  readonly currentPage = this._currentPage.asReadonly();

  showCancelModal = signal(false);
  orderToCancel = signal<OrderSummaryDTO | null>(null);

  filteredOrders = computed(() => {
    let result = this.orders();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(o =>
        o.orderNumber?.toLowerCase().includes(term) ||
        o.customerName?.toLowerCase().includes(term) ||
        o.customerEmail?.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter) {
      result = result.filter(o => o.status === this.statusFilter);
    }

    if (this.paymentFilter) {
      result = result.filter(o => o.paymentStatus === this.paymentFilter);
    }

    return result;
  });

  totalPages = computed(() => Math.ceil(this.filteredOrders().length / this.pageSize) || 1);

  paginatedOrders = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredOrders().slice(start, start + this.pageSize);
  });

  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize);
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize, this.filteredOrders().length));

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  });

  ngOnInit() {
    this.facade.loadOrders();
    this.facade.loadStats();
  }

  onSearch() {
    this._currentPage.set(1);
  }

  onFilterChange() {
    this._currentPage.set(1);
    if (this.statusFilter && !this.searchTerm) {
      this.facade.loadOrdersByStatus(this.statusFilter as OrderDTO.StatusEnum);
    } else if (!this.statusFilter && !this.searchTerm) {
      this.facade.loadOrders();
    }
  }

  onDateChange() {
    if (this.startDate && this.endDate) {
      this.facade.loadOrdersByDateRange(this.startDate, this.endDate);
    }
  }

  onPageSizeChange() {
    this._currentPage.set(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this._currentPage.set(page);
    }
  }

  onCancel(order: OrderSummaryDTO) {
    this.orderToCancel.set(order);
    this.showCancelModal.set(true);
  }

  closeCancelModal() {
    this.showCancelModal.set(false);
    this.orderToCancel.set(null);
  }

  confirmCancel() {
    const order = this.orderToCancel();
    if (order?.id) {
      this.facade.cancelOrder(order.id).subscribe({
        next: () => {
          this.closeCancelModal();
        },
        error: (err) => {
          console.error('Error cancelling order:', err);
        }
      });
    }
  }

  getStatusClass(status?: string): string {
    return status?.toLowerCase() || 'pending';
  }

  getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmee',
      'PROCESSING': 'En traitement',
      'SHIPPED': 'Expediee',
      'DELIVERED': 'Livree',
      'CANCELLED': 'Annulee',
      'REFUNDED': 'Remboursee'
    };
    return labels[status || ''] || status || '';
  }

  getPaymentClass(status?: string): string {
    return status?.toLowerCase() || 'pending';
  }

  getPaymentLabel(status?: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'En attente',
      'PAID': 'Paye',
      'FAILED': 'Echoue',
      'REFUNDED': 'Rembourse'
    };
    return labels[status || ''] || status || '';
  }
}
