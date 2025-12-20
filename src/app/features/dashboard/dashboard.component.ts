import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductFacade } from '../../api-facade/products/productFacade';
import { InventoryFacade } from '../../api-facade/inventory/inventoryFacade';
import { StockMovementFacade } from '../../api-facade/inventory/stockMovementFacade';
import { SupplierFacade } from '../../api-facade/suppliers/supplierFacade';
import { WarehouseFacade } from '../../api-facade/inventory/warehouseFacade';
import { IsAdminDirective } from '../../shared/directives/has-role.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IsAdminDirective],
  template: `
    <div class="dashboard">
      <header class="header">
        <div>
          <h1>Dashboard</h1>
          <p class="subtitle">Vue d'ensemble de votre inventaire</p>
        </div>
        <div class="header-date">
          {{ today | date:'EEEE d MMMM yyyy':'':'fr' }}
        </div>
      </header>

      <!-- Statistiques principales -->
      <div class="stats-grid" *appIsAdmin>
        <div class="stat-card">
          <div class="stat-icon products">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.totalProducts ?? totalProducts() }}</span>
            <span class="stat-label">Produits</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon warehouses">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4z"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.totalWarehouses ?? totalWarehouses() }}</span>
            <span class="stat-label">Entrepots</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon quantity">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.totalQuantity ?? 0 | number }}</span>
            <span class="stat-label">Unite en stock</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon suppliers">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ activeSuppliers() }}</span>
            <span class="stat-label">Fournisseurs actifs</span>
          </div>
        </div>
      </div>

      <!-- Alertes de stock -->
      @if (alerts().length > 0) {
        <div class="alerts-section" *appIsAdmin>
          <div class="section-header">
            <div class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <h2>Alertes de stock</h2>
              <span class="alert-count">{{ alerts().length }}</span>
            </div>
            <a routerLink="/inventory" class="view-all">Voir tout</a>
          </div>
          <div class="alerts-grid">
            @for (alert of alertsLimited(); track alert.productId) {
              <div class="alert-card" [class]="getAlertSeverityClass(alert.severity)">
                <div class="alert-icon">
                  @if (alert.alertType === 'LOW_STOCK') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 9v4M12 17h.01"/>
                      <path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z"/>
                    </svg>
                  } @else if (alert.alertType === 'OUT_OF_STOCK') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    </svg>
                  }
                </div>
                <div class="alert-content">
                  <span class="alert-product">{{ alert.productName }}</span>
                  <span class="alert-code">{{ alert.productCode }}</span>
                  <span class="alert-message">{{ alert.message }}</span>
                </div>
                <div class="alert-quantity">
                  <span class="qty-current">{{ alert.currentQuantity }}</span>
                  <span class="qty-label">/ {{ alert.minThreshold }} min</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Indicateurs de stock -->
      <div class="stock-indicators" *appIsAdmin>
        <div class="indicator-card low-stock">
          <div class="indicator-value">{{ stats()?.lowStockProducts ?? lowStockCount() }}</div>
          <div class="indicator-label">Stock faible</div>
          <div class="indicator-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v4M12 17h.01"/>
              <path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z"/>
            </svg>
          </div>
        </div>
        <div class="indicator-card out-of-stock">
          <div class="indicator-value">{{ stats()?.outOfStockProducts ?? outOfStockProducts() }}</div>
          <div class="indicator-label">Rupture de stock</div>
          <div class="indicator-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
        </div>
        <div class="indicator-card overstock">
          <div class="indicator-value">{{ stats()?.overstockProducts ?? 0 }}</div>
          <div class="indicator-label">Surstock</div>
          <div class="indicator-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </div>
        </div>
        <div class="indicator-card movements">
          <div class="indicator-value">{{ stats()?.totalMovements ?? totalMovements() }}</div>
          <div class="indicator-label">Mouvements</div>
          <div class="indicator-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 1l4 4-4 4"/>
              <path d="M3 11V9a4 4 0 014-4h14"/>
              <path d="M7 23l-4-4 4-4"/>
              <path d="M21 13v2a4 4 0 01-4 4H3"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Actions rapides -->
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
              <a routerLink="/suppliers/new" class="action-btn secondary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Nouveau fournisseur
              </a>
              <a routerLink="/inventory/movements" class="action-btn secondary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 1l4 4-4 4"/>
                  <path d="M3 11V9a4 4 0 014-4h14"/>
                  <path d="M7 23l-4-4 4-4"/>
                  <path d="M21 13v2a4 4 0 01-4 4H3"/>
                </svg>
                Mouvements de stock
              </a>
              <a routerLink="/inventory" class="action-btn secondary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                </svg>
                Gerer les stocks
              </a>
            </div>
          </div>
        </div>

        <!-- Derniers produits -->
        <div class="card">
          <div class="card-header">
            <h2>Derniers produits</h2>
            <a routerLink="/products" class="view-all">Voir tout</a>
          </div>
          <div class="card-body">
            @if (productLoading()) {
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
                      {{ getStatusLabel(product.status) }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Derniers mouvements -->
        <div class="card movements-card">
          <div class="card-header">
            <h2>Derniers mouvements</h2>
            <a routerLink="/inventory/movements" class="view-all">Voir tout</a>
          </div>
          <div class="card-body">
            @if (movementLoading()) {
              <div class="loading">Chargement...</div>
            } @else if (recentMovements().length === 0) {
              <div class="empty">Aucun mouvement</div>
            } @else {
              <div class="movements-list">
                @for (movement of recentMovements(); track movement.id) {
                  <div class="movement-item">
                    <div class="movement-type" [class]="getMovementTypeClass(movement.type)">
                      @if (isIncomingMovement(movement.type)) {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                      } @else {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 5v14M5 12l7 7 7-7"/>
                        </svg>
                      }
                    </div>
                    <div class="movement-info">
                      <span class="movement-product">{{ movement.productName }}</span>
                      <span class="movement-details">
                        {{ getMovementTypeLabel(movement.type) }} - {{ movement.warehouseName }}
                      </span>
                    </div>
                    <div class="movement-quantity" [class]="isIncomingMovement(movement.type) ? 'incoming' : 'outgoing'">
                      {{ isIncomingMovement(movement.type) ? '+' : '-' }}{{ movement.quantity }}
                    </div>
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

    .header-date {
      font-size: 14px;
      color: #666;
      background: white;
      padding: 10px 16px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon svg {
      width: 28px;
      height: 28px;
    }

    .stat-icon.products {
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      color: #4f46e5;
    }

    .stat-icon.warehouses {
      background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
      color: #db2777;
    }

    .stat-icon.quantity {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      color: #059669;
    }

    .stat-icon.suppliers {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #d97706;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
    }

    /* Alertes */
    .alerts-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-title svg {
      width: 24px;
      height: 24px;
      color: #dc2626;
    }

    .section-title h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .alert-count {
      background: #dc2626;
      color: white;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
    }

    .alerts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .alert-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 10px;
      border-left: 4px solid;
    }

    .alert-card.critical {
      background: #fef2f2;
      border-color: #dc2626;
    }

    .alert-card.high {
      background: #fff7ed;
      border-color: #ea580c;
    }

    .alert-card.medium {
      background: #fefce8;
      border-color: #ca8a04;
    }

    .alert-card.low {
      background: #f0fdf4;
      border-color: #16a34a;
    }

    .alert-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .alert-card.critical .alert-icon {
      background: #fee2e2;
      color: #dc2626;
    }

    .alert-card.high .alert-icon {
      background: #ffedd5;
      color: #ea580c;
    }

    .alert-card.medium .alert-icon {
      background: #fef9c3;
      color: #ca8a04;
    }

    .alert-card.low .alert-icon {
      background: #dcfce7;
      color: #16a34a;
    }

    .alert-icon svg {
      width: 20px;
      height: 20px;
    }

    .alert-content {
      flex: 1;
      min-width: 0;
    }

    .alert-product {
      display: block;
      font-weight: 600;
      color: #1a1a2e;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .alert-code {
      display: block;
      font-size: 12px;
      font-family: monospace;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .alert-message {
      display: block;
      font-size: 12px;
      color: #6b7280;
    }

    .alert-quantity {
      text-align: right;
      flex-shrink: 0;
    }

    .qty-current {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: #dc2626;
    }

    .qty-label {
      font-size: 11px;
      color: #6b7280;
    }

    /* Indicateurs de stock */
    .stock-indicators {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .indicator-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .indicator-value {
      font-size: 36px;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1;
    }

    .indicator-label {
      font-size: 13px;
      color: #6b7280;
      margin-top: 4px;
    }

    .indicator-icon {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.2;
    }

    .indicator-icon svg {
      width: 24px;
      height: 24px;
    }

    .indicator-card.low-stock {
      border-left: 4px solid #f59e0b;
    }

    .indicator-card.low-stock .indicator-value {
      color: #f59e0b;
    }

    .indicator-card.low-stock .indicator-icon {
      background: #f59e0b;
      color: #f59e0b;
    }

    .indicator-card.out-of-stock {
      border-left: 4px solid #dc2626;
    }

    .indicator-card.out-of-stock .indicator-value {
      color: #dc2626;
    }

    .indicator-card.out-of-stock .indicator-icon {
      background: #dc2626;
      color: #dc2626;
    }

    .indicator-card.overstock {
      border-left: 4px solid #8b5cf6;
    }

    .indicator-card.overstock .indicator-value {
      color: #8b5cf6;
    }

    .indicator-card.overstock .indicator-icon {
      background: #8b5cf6;
      color: #8b5cf6;
    }

    .indicator-card.movements {
      border-left: 4px solid #0ea5e9;
    }

    .indicator-card.movements .indicator-value {
      color: #0ea5e9;
    }

    .indicator-card.movements .indicator-icon {
      background: #0ea5e9;
      color: #0ea5e9;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
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
      font-weight: 500;
    }

    .view-all:hover {
      text-decoration: underline;
    }

    .card-body {
      padding: 20px 24px;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 500;
      font-size: 13px;
      transition: all 0.2s;
    }

    .action-btn svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .action-btn.primary {
      grid-column: span 2;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: white;
      justify-content: center;
    }

    .action-btn.primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
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
      padding: 24px;
      color: #666;
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .recent-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: #f9fafb;
      border-radius: 8px;
      transition: background 0.2s;
    }

    .recent-item:hover {
      background: #f3f4f6;
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-name {
      font-weight: 500;
      color: #1a1a2e;
      font-size: 14px;
    }

    .item-code {
      font-size: 12px;
      color: #666;
      font-family: monospace;
    }

    .item-status {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 500;
    }

    .item-status.active {
      background: #d1fae5;
      color: #059669;
    }

    .item-status.inactive {
      background: #f3f4f6;
      color: #6b7280;
    }

    .item-status.discontinued {
      background: #fee2e2;
      color: #dc2626;
    }

    .item-status.out_of_stock {
      background: #fef3c7;
      color: #d97706;
    }

    /* Mouvements */
    .movements-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .movement-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .movement-type {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .movement-type svg {
      width: 18px;
      height: 18px;
    }

    .movement-type.incoming {
      background: #d1fae5;
      color: #059669;
    }

    .movement-type.outgoing {
      background: #fee2e2;
      color: #dc2626;
    }

    .movement-info {
      flex: 1;
      min-width: 0;
    }

    .movement-product {
      display: block;
      font-weight: 500;
      color: #1a1a2e;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .movement-details {
      font-size: 12px;
      color: #6b7280;
    }

    .movement-quantity {
      font-size: 16px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .movement-quantity.incoming {
      color: #059669;
    }

    .movement-quantity.outgoing {
      color: #dc2626;
    }

    @media (max-width: 768px) {
      .dashboard {
        padding: 20px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
      }

      .quick-actions {
        grid-template-columns: 1fr;
      }

      .action-btn.primary {
        grid-column: span 1;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private productFacade = inject(ProductFacade);
  private inventoryFacade = inject(InventoryFacade);
  private movementFacade = inject(StockMovementFacade);
  private supplierFacade = inject(SupplierFacade);
  private warehouseFacade = inject(WarehouseFacade);

  today = new Date();

  // Products
  readonly products = this.productFacade.products;
  readonly productLoading = this.productFacade.loading;

  // Inventory
  readonly stats = this.inventoryFacade.stats;
  readonly alerts = this.inventoryFacade.alerts;
  readonly inventories = this.inventoryFacade.inventories;

  // Movements
  readonly movements = this.movementFacade.movements;
  readonly movementLoading = this.movementFacade.loading;

  // Suppliers
  readonly suppliers = this.supplierFacade.suppliers;

  // Warehouses
  readonly warehouses = this.warehouseFacade.warehouses;

  // Computed values
  totalProducts = () => this.products().length;
  activeProducts = () => this.products().filter(p => p.status === 'ACTIVE').length;
  inactiveProducts = () => this.products().filter(p => p.status === 'INACTIVE').length;
  outOfStockProducts = () => this.products().filter(p => p.status === 'OUT_OF_STOCK').length;
  recentProducts = () => this.products().slice(0, 5);

  totalWarehouses = () => this.warehouses().length;
  activeSuppliers = () => this.suppliers().filter(s => s.status === 'ACTIVE').length;

  totalMovements = () => this.movements().length;
  recentMovements = () => this.movements().slice(0, 6);

  alertsLimited = () => this.alerts().slice(0, 6);
  lowStockCount = () => this.alerts().filter(a => a.alertType === 'LOW_STOCK').length;

  ngOnInit() {
    this.productFacade.loadProducts();
    this.inventoryFacade.loadAlerts();
    this.inventoryFacade.loadStats();
    this.movementFacade.loadMovements();
    this.supplierFacade.loadSuppliers();
    this.warehouseFacade.loadWarehouses();
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'INACTIVE': return 'Inactif';
      case 'DISCONTINUED': return 'Arrete';
      case 'OUT_OF_STOCK': return 'Rupture';
      default: return status;
    }
  }

  getAlertSeverityClass(severity?: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'critical';
      case 'HIGH': return 'high';
      case 'MEDIUM': return 'medium';
      case 'LOW': return 'low';
      default: return 'medium';
    }
  }

  getMovementTypeClass(type: string): string {
    return this.isIncomingMovement(type) ? 'incoming' : 'outgoing';
  }

  isIncomingMovement(type: string): boolean {
    return ['IN', 'PURCHASE', 'RETURN', 'TRANSFER_IN'].includes(type);
  }

  getMovementTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'IN': 'Entree',
      'OUT': 'Sortie',
      'PURCHASE': 'Achat',
      'SALE': 'Vente',
      'RETURN': 'Retour',
      'DAMAGE': 'Dommage',
      'TRANSFER_IN': 'Transfert entrant',
      'TRANSFER_OUT': 'Transfert sortant',
      'ADJUSTMENT': 'Ajustement'
    };
    return labels[type] || type;
  }
}
