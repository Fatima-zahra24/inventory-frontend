import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupplierFacade } from '../../../api-facade/suppliers/supplierFacade';
import { SupplierDTO } from '../../../api/supplier';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="supplier-list">
      <header class="header">
        <div>
          <h1>Fournisseurs</h1>
          <p class="subtitle">Gerez vos fournisseurs et partenaires</p>
        </div>
        <a routerLink="/suppliers/new" class="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nouveau fournisseur
        </a>
      </header>

      @if (facade.loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <span>Chargement des fournisseurs...</span>
        </div>
      } @else if (facade.error()) {
        <div class="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <p>{{ facade.error() }}</p>
          <button (click)="facade.loadSuppliers()" class="btn-secondary">Reessayer</button>
        </div>
      } @else if (suppliers().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3>Aucun fournisseur</h3>
          <p>Commencez par ajouter votre premier fournisseur</p>
          <a routerLink="/suppliers/new" class="btn-primary">Ajouter un fournisseur</a>
        </div>
      } @else {
        <div class="stats-bar">
          <div class="stat">
            <span class="stat-value">{{ suppliers().length }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat">
            <span class="stat-value active">{{ activeCount() }}</span>
            <span class="stat-label">Actifs</span>
          </div>
          <div class="stat">
            <span class="stat-value inactive">{{ inactiveCount() }}</span>
            <span class="stat-label">Inactifs</span>
          </div>
          <div class="stat">
            <span class="stat-value suspended">{{ suspendedCount() }}</span>
            <span class="stat-label">Suspendus</span>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Telephone</th>
                <th>Ville</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (supplier of paginatedSuppliers(); track supplier.id) {
                <tr>
                  <td class="code">{{ supplier.code }}</td>
                  <td class="name">{{ supplier.name }}</td>
                  <td>{{ supplier.email || '-' }}</td>
                  <td>{{ supplier.phone || '-' }}</td>
                  <td>{{ supplier.city || '-' }}</td>
                  <td>
                    <span class="status-badge" [class]="getStatusClass(supplier.status)">
                      {{ getStatusLabel(supplier.status) }}
                    </span>
                  </td>
                  <td class="actions">
                    <a [routerLink]="['/suppliers', supplier.id]" class="btn-icon" title="Modifier">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </a>
                    @if (supplier.status === 'ACTIVE') {
                      <button class="btn-icon warning" (click)="onSuspend(supplier)" title="Suspendre">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M10 15l-3-3m0 0l3-3m-3 3h8"/>
                        </svg>
                      </button>
                      <button class="btn-icon" (click)="onDeactivate(supplier)" title="Desactiver">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M18.36 6.64A9 9 0 1 1 5.64 5.64m12.72 1l-12.72 12.72"/>
                        </svg>
                      </button>
                    } @else if (supplier.status === 'INACTIVE' || supplier.status === 'SUSPENDED') {
                      <button class="btn-icon success" (click)="onActivate(supplier)" title="Activer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      </button>
                    }
                    <button class="btn-icon danger" (click)="onDelete(supplier)" title="Supprimer">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
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
            Affichage de {{ startIndex() + 1 }} a {{ endIndex() }} sur {{ suppliers().length }} fournisseurs
          </div>
          <div class="pagination-controls">
            <select [value]="pageSize" (change)="onPageSizeChange($event)" class="page-size-select">
              @for (size of pageSizeOptions; track size) {
                <option [value]="size">{{ size }} par page</option>
              }
            </select>
            <div class="page-buttons">
              <button
                class="page-btn"
                [disabled]="currentPage() === 1"
                (click)="goToPage(1)"
                title="Premiere page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="11 17 6 12 11 7"/>
                  <polyline points="18 17 13 12 18 7"/>
                </svg>
              </button>
              <button
                class="page-btn"
                [disabled]="currentPage() === 1"
                (click)="goToPage(currentPage() - 1)"
                title="Page precedente"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              @for (page of visiblePages(); track page) {
                <button
                  class="page-btn"
                  [class.active]="page === currentPage()"
                  (click)="goToPage(page)"
                >
                  {{ page }}
                </button>
              }
              <button
                class="page-btn"
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(currentPage() + 1)"
                title="Page suivante"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
              <button
                class="page-btn"
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(totalPages())"
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
    </div>
  `,
  styles: [`
    .supplier-list {
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

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-primary:hover {
      background: #4338ca;
    }

    .btn-primary svg {
      width: 18px;
      height: 18px;
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

    .stat-value.active { color: #059669; }
    .stat-value.inactive { color: #6b7280; }
    .stat-value.suspended { color: #d97706; }

    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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

    .code {
      font-family: monospace;
      font-weight: 600;
      color: #4f46e5;
    }

    .name {
      font-weight: 500;
      color: #1a1a2e;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
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

    .status-badge.suspended {
      background: #fef3c7;
      color: #d97706;
    }

    .status-badge.blacklisted {
      background: #fee2e2;
      color: #dc2626;
    }

    .status-badge.pending {
      background: #dbeafe;
      color: #2563eb;
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
      text-decoration: none;
      color: #374151;
    }

    .btn-icon:hover {
      background: #e5e7eb;
    }

    .btn-icon.success:hover {
      background: #d1fae5;
      color: #059669;
    }

    .btn-icon.warning:hover {
      background: #fef3c7;
      color: #d97706;
    }

    .btn-icon.danger:hover {
      background: #fee2e2;
      color: #dc2626;
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
      color: #374151;
      background: white;
      cursor: pointer;
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
  `]
})
export class SupplierListComponent implements OnInit {
  facade = inject(SupplierFacade);

  // Pagination
  pageSizeOptions = [10, 20, 50, 100];
  pageSize = 10;
  private _currentPage = signal(1);

  suppliers = computed(() => this.facade.suppliers());
  currentPage = this._currentPage.asReadonly();

  totalPages = computed(() => Math.ceil(this.suppliers().length / this.pageSize) || 1);

  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize);

  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize, this.suppliers().length));

  paginatedSuppliers = computed(() => {
    const start = this.startIndex();
    const end = start + this.pageSize;
    return this.suppliers().slice(start, end);
  });

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

  // Stats
  activeCount = computed(() => this.suppliers().filter(s => s.status === 'ACTIVE').length);
  inactiveCount = computed(() => this.suppliers().filter(s => s.status === 'INACTIVE').length);
  suspendedCount = computed(() => this.suppliers().filter(s => s.status === 'SUSPENDED').length);

  ngOnInit() {
    this.facade.loadSuppliers();
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'ACTIVE': return 'active';
      case 'INACTIVE': return 'inactive';
      case 'SUSPENDED': return 'suspended';
      case 'BLACKLISTED': return 'blacklisted';
      case 'PENDING': return 'pending';
      default: return 'inactive';
    }
  }

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'INACTIVE': return 'Inactif';
      case 'SUSPENDED': return 'Suspendu';
      case 'BLACKLISTED': return 'Blackliste';
      case 'PENDING': return 'En attente';
      default: return 'Inconnu';
    }
  }

  onActivate(supplier: SupplierDTO) {
    if (supplier.id && confirm(`Activer le fournisseur "${supplier.name}" ?`)) {
      this.facade.activateSupplier(supplier.id).subscribe();
    }
  }

  onDeactivate(supplier: SupplierDTO) {
    if (supplier.id && confirm(`Desactiver le fournisseur "${supplier.name}" ?`)) {
      this.facade.deactivateSupplier(supplier.id).subscribe();
    }
  }

  onSuspend(supplier: SupplierDTO) {
    if (supplier.id && confirm(`Suspendre le fournisseur "${supplier.name}" ?`)) {
      this.facade.suspendSupplier(supplier.id).subscribe();
    }
  }

  onDelete(supplier: SupplierDTO) {
    if (supplier.id && confirm(`Supprimer definitivement le fournisseur "${supplier.name}" ?`)) {
      this.facade.deleteSupplier(supplier.id).subscribe();
    }
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
}
