import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductFacade } from '../../api-facade/products/productFacade';
import { IsAdminDirective } from '../../shared/directives/has-role.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IsAdminDirective],
  template: `
    <div class="dashboard">
      <header class="header">
        <h1>Dashboard</h1>
        <p class="subtitle">Vue d'ensemble de votre inventaire</p>
      </header>

      <div class="stats-grid" *appIsAdmin>
        <div class="stat-card">
          <div class="stat-icon products">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalProducts() }}</span>
            <span class="stat-label">Produits</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ activeProducts() }}</span>
            <span class="stat-label">Actifs</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon inactive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ inactiveProducts() }}</span>
            <span class="stat-label">Inactifs</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon out-of-stock">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ outOfStockProducts() }}</span>
            <span class="stat-label">Rupture</span>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <h2>Actions rapides</h2>
          </div>
          <div class="card-body">
            <div class="quick-actions">
              <a routerLink="/products/new" class="action-btn primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nouveau produit
              </a>
              <a routerLink="/products" class="action-btn secondary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Voir les produits
              </a>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2>Derniers produits</h2>
            <a routerLink="/products" class="view-all">Voir tout</a>
          </div>
          <div class="card-body">
            @if (loading()) {
              <div class="loading">Chargement...</div>
            } @else if (recentProducts().length === 0) {
              <div class="empty">Aucun produit</div>
            } @else {
              <div class="recent-list">
                @for (product of recentProducts(); track product.id) {
                  <div class="recent-item">
                    <div class="item-info">
                      <span class="item-name">{{ product.name }}</span>
                      <span class="item-code">{{ product.code }}</span>
                    </div>
                    <span class="item-status" [class]="product.status.toLowerCase()">
                      {{ product.status }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 32px;
    }

    .header {
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
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

    .stat-icon.products {
      background: #e0e7ff;
      color: #4f46e5;
    }

    .stat-icon.active {
      background: #d1fae5;
      color: #059669;
    }

    .stat-icon.inactive {
      background: #fef3c7;
      color: #d97706;
    }

    .stat-icon.out-of-stock {
      background: #fee2e2;
      color: #dc2626;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .card-header {
      padding: 20px 24px;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .view-all {
      color: #4f46e5;
      text-decoration: none;
      font-size: 14px;
    }

    .view-all:hover {
      text-decoration: underline;
    }

    .card-body {
      padding: 24px;
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s;
    }

    .action-btn svg {
      width: 20px;
      height: 20px;
    }

    .action-btn.primary {
      background: #4f46e5;
      color: white;
    }

    .action-btn.primary:hover {
      background: #4338ca;
    }

    .action-btn.secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .action-btn.secondary:hover {
      background: #e5e7eb;
    }

    .loading, .empty {
      text-align: center;
      padding: 20px;
      color: #666;
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .recent-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-name {
      font-weight: 500;
      color: #1a1a2e;
    }

    .item-code {
      font-size: 12px;
      color: #666;
      font-family: monospace;
    }

    .item-status {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
    }

    .item-status.active {
      background: #d1fae5;
      color: #059669;
    }

    .item-status.inactive {
      background: #fef3c7;
      color: #d97706;
    }

    .item-status.discontinued {
      background: #fee2e2;
      color: #dc2626;
    }

    .item-status.out_of_stock {
      background: #fce7f3;
      color: #be185d;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private productFacade = inject(ProductFacade);

  readonly products = this.productFacade.products;
  readonly loading = this.productFacade.loading;

  totalProducts = () => this.products().length;
  activeProducts = () => this.products().filter(p => p.status === 'ACTIVE').length;
  inactiveProducts = () => this.products().filter(p => p.status === 'INACTIVE').length;
  outOfStockProducts = () => this.products().filter(p => p.status === 'OUT_OF_STOCK').length;
  recentProducts = () => this.products().slice(0, 5);

  ngOnInit() {
    this.productFacade.loadProducts();
  }
}
