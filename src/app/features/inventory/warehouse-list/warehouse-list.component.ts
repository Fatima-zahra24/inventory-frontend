import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WarehouseFacade } from '../../../api-facade/inventory/warehouseFacade';
import { InventoryFacade } from '../../../api-facade/inventory/inventoryFacade';
import { ProductFacade } from '../../../api-facade/products/productFacade';
import { WarehouseDTO, WarehouseCreateDTO, WarehouseUpdateDTO, InventoryDTO, InventoryCreateDTO } from '../../../api/inventory';
import { ProductDTO } from '../../../api/product';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="warehouse-list">
      <header class="header">
        <div class="header-left">
          <a routerLink="/inventory" class="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </a>
          <div>
            <h1>Entrepots</h1>
            <p class="subtitle">Gerez vos lieux de stockage</p>
          </div>
        </div>
        <button class="btn-primary" (click)="openCreateModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nouvel entrepot
        </button>
      </header>

      @if (facade.loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <span>Chargement des entrepots...</span>
        </div>
      } @else if (facade.error()) {
        <div class="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <p>{{ facade.error() }}</p>
          <button (click)="facade.loadWarehouses()" class="btn-secondary">Reessayer</button>
        </div>
      } @else if (facade.warehouses().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18"/>
            </svg>
          </div>
          <h3>Aucun entrepot</h3>
          <p>Commencez par creer votre premier entrepot</p>
          <button class="btn-primary" (click)="openCreateModal()">Creer un entrepot</button>
        </div>
      } @else {
        <div class="warehouses-grid">
          @for (warehouse of facade.warehouses(); track warehouse.id) {
            <div class="warehouse-card">
              <div class="warehouse-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18"/>
                </svg>
              </div>
              <div class="warehouse-info">
                <h3>{{ warehouse.name }}</h3>
                <p class="location">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {{ warehouse.location }}
                </p>
                <p class="date">Cree le {{ warehouse.createdAt | date:'dd/MM/yyyy' }}</p>
              </div>
              <div class="warehouse-actions">
                <button class="btn-icon primary" (click)="openInventoryModal(warehouse)" title="Voir l'inventaire">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </button>
                <button class="btn-icon" (click)="openEditModal(warehouse)" title="Modifier">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="btn-icon danger" (click)="onDelete(warehouse)" title="Supprimer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal Create/Edit Warehouse -->
      @if (showModal) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>{{ editingWarehouse ? 'Modifier l\\'entrepot' : 'Nouvel entrepot' }}</h2>

            <div class="form-group">
              <label>Nom de l'entrepot *</label>
              <input
                type="text"
                [(ngModel)]="formData.name"
                class="form-control"
                placeholder="Ex: Entrepot Principal"
              >
            </div>

            <div class="form-group">
              <label>Localisation *</label>
              <input
                type="text"
                [(ngModel)]="formData.location"
                class="form-control"
                placeholder="Ex: Zone Industrielle, Casablanca"
              >
            </div>

            @if (modalError) {
              <div class="error-message">{{ modalError }}</div>
            }

            <div class="modal-actions">
              <button class="btn-secondary" (click)="closeModal()">Annuler</button>
              <button
                class="btn-primary"
                (click)="saveWarehouse()"
                [disabled]="!isFormValid() || submitting"
              >
                @if (submitting) {
                  <span class="spinner-small"></span>
                }
                {{ editingWarehouse ? 'Modifier' : 'Creer' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Inventory -->
      @if (showInventoryModal()) {
        <div class="modal-overlay" (click)="closeInventoryModal()">
          <div class="modal-large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title">
                <h2>{{ selectedWarehouse()?.name }}</h2>
                <p class="modal-subtitle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {{ selectedWarehouse()?.location }}
                </p>
              </div>
              <button class="close-btn" (click)="closeInventoryModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Add Product Form -->
            <div class="add-product-form">
              <h4>Ajouter un produit</h4>
              <div class="form-row">
                <div class="form-group flex-2">
                  <label>Produit</label>
                  <select [(ngModel)]="addProductForm.productId" class="form-control">
                    <option [ngValue]="null">-- Selectionner un produit --</option>
                    @for (product of availableProducts(); track product.id) {
                      <option [ngValue]="product.id">{{ product.name }} ({{ product.code }})</option>
                    }
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label>Quantite</label>
                  <input
                    type="number"
                    [(ngModel)]="addProductForm.quantity"
                    class="form-control"
                    placeholder="0"
                    min="1"
                  >
                </div>
                <div class="form-group form-action">
                  <button
                    class="btn-primary"
                    (click)="addProductToWarehouse()"
                    [disabled]="!isAddProductFormValid() || addingProduct()"
                  >
                    @if (addingProduct()) {
                      <span class="spinner-small"></span>
                    }
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Ajouter
                  </button>
                </div>
              </div>
              @if (addProductError()) {
                <div class="error-message-small">{{ addProductError() }}</div>
              }
              @if (addProductSuccess()) {
                <div class="success-message">{{ addProductSuccess() }}</div>
              }
            </div>

            <!-- Inventory Stats -->
            <div class="inventory-stats">
              <div class="stat-item">
                <span class="stat-value">{{ warehouseInventories().length }}</span>
                <span class="stat-label">Produits</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ totalQuantity() | number }}</span>
                <span class="stat-label">Unites totales</span>
              </div>
              <div class="stat-item green">
                <span class="stat-value">{{ inStockCount() }}</span>
                <span class="stat-label">En stock</span>
              </div>
              <div class="stat-item orange">
                <span class="stat-value">{{ lowStockCount() }}</span>
                <span class="stat-label">Stock faible</span>
              </div>
              <div class="stat-item red">
                <span class="stat-value">{{ outOfStockCount() }}</span>
                <span class="stat-label">Rupture</span>
              </div>
            </div>

            <!-- Inventory Table -->
            <div class="inventory-content">
              @if (loadingInventory()) {
                <div class="loading-small">
                  <div class="spinner"></div>
                  <span>Chargement...</span>
                </div>
              } @else if (warehouseInventories().length === 0) {
                <div class="empty-inventory">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  <p>Aucun produit dans cet entrepot</p>
                  <span>Utilisez le formulaire ci-dessus pour ajouter des produits</span>
                </div>
              } @else {
                <div class="inventory-table-wrapper">
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
                      @for (item of warehouseInventories(); track item.id) {
                        <tr>
                          <td>
                            <div class="product-cell">
                              <div class="product-icon-small">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                </svg>
                              </div>
                              <span>{{ item.productName }}</span>
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
                            <span class="date-small">{{ item.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .warehouse-list {
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
      margin: 0 0 20px;
      color: #666;
    }

    /* Grid */
    .warehouses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 24px;
    }

    .warehouse-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      display: flex;
      gap: 16px;
      transition: all 0.2s;
    }

    .warehouse-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }

    .warehouse-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .warehouse-icon svg {
      width: 28px;
      height: 28px;
      color: #4f46e5;
    }

    .warehouse-info {
      flex: 1;
      min-width: 0;
    }

    .warehouse-info h3 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .location {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 4px;
      font-size: 14px;
      color: #666;
    }

    .location svg {
      width: 14px;
      height: 14px;
    }

    .date {
      margin: 0;
      font-size: 12px;
      color: #9ca3af;
    }

    .warehouse-actions {
      display: flex;
      flex-direction: column;
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
    .btn-icon.primary { background: #e0e7ff; color: #4f46e5; }
    .btn-icon.primary:hover { background: #c7d2fe; }
    .btn-icon.danger:hover { background: #fee2e2; color: #dc2626; }

    .btn-icon svg {
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
      padding: 20px;
    }

    .modal {
      background: white;
      border-radius: 12px;
      padding: 32px;
      width: 100%;
      max-width: 440px;
    }

    .modal-large {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 900px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal h2 {
      margin: 0 0 24px;
      font-size: 20px;
      color: #1a1a2e;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 24px 0;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 16px;
    }

    .modal-title h2 {
      margin: 0 0 4px;
      font-size: 22px;
      color: #1a1a2e;
    }

    .modal-subtitle {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .modal-subtitle svg {
      width: 14px;
      height: 14px;
    }

    .close-btn {
      background: #f3f4f6;
      border: none;
      border-radius: 8px;
      padding: 8px;
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

    /* Add Product Form */
    .add-product-form {
      padding: 10px 24px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .add-product-form h4 {
      margin: 0 0 16px;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-end;
    }

    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }

    .form-action {
      flex: 0 0 auto;
    }

    .form-group {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }

    .form-control {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      background: white;
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

    .error-message-small {
      background: #fee2e2;
      color: #dc2626;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      margin-top: 12px;
    }

    .success-message {
      background: #d1fae5;
      color: #065f46;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      margin-top: 12px;
    }

    /* Inventory Stats */
    .inventory-stats {
      display: flex;
      gap: 16px;
      padding: 10px 24px;
      min-height: fit-content;
      border-bottom: 1px solid #e5e7eb;
      overflow-x: auto;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 20px;
      background: #f3f4f6;
      border-radius: 10px;
      min-width: 90px;
    }

    .stat-item.green { background: #d1fae5; }
    .stat-item.orange { background: #fef3c7; }
    .stat-item.red { background: #fee2e2; }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .stat-item.green .stat-value { color: #059669; }
    .stat-item.orange .stat-value { color: #d97706; }
    .stat-item.red .stat-value { color: #dc2626; }

    .stat-label {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
    }

    /* Inventory Content */
    .inventory-content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .loading-small {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px;
      color: #666;
    }

    .empty-inventory {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .empty-inventory svg {
      width: 48px;
      height: 48px;
      color: #9ca3af;
      margin-bottom: 12px;
    }

    .empty-inventory p {
      margin: 0 0 4px;
      font-size: 15px;
      color: #374151;
    }

    .empty-inventory span {
      font-size: 13px;
      color: #9ca3af;
    }

    /* Inventory Table */
    .inventory-table-wrapper {
      overflow-x: auto;
    }

    .inventory-table {
      width: 100%;
      border-collapse: collapse;
    }

    .inventory-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
    }

    .inventory-table th.text-right {
      text-align: right;
    }

    .inventory-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 14px;
    }

    .inventory-table tr:hover {
      background: #f9fafb;
    }

    .product-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .product-icon-small {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .product-icon-small svg {
      width: 16px;
      height: 16px;
      color: #4f46e5;
    }

    .product-code {
      font-family: monospace;
      font-size: 12px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 3px 6px;
      border-radius: 4px;
    }

    .text-right {
      text-align: right;
    }

    .quantity {
      font-weight: 600;
      color: #059669;
    }

    .quantity.low { color: #d97706; }
    .quantity.out { color: #dc2626; }

    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
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

    .date-small {
      font-size: 12px;
      color: #9ca3af;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }

      .flex-1, .flex-2 {
        flex: none;
        width: 100%;
      }

      .form-group {
        margin-bottom: 12px;
      }

      .inventory-stats {
        gap: 8px;
      }

      .stat-item {
        padding: 10px 14px;
        min-width: 70px;
      }
    }
  `]
})
export class WarehouseListComponent implements OnInit {
  facade = inject(WarehouseFacade);
  inventoryFacade = inject(InventoryFacade);
  productFacade = inject(ProductFacade);

  showModal = false;
  submitting = false;
  modalError = '';
  editingWarehouse: WarehouseDTO | null = null;
  formData = { name: '', location: '' };

  // Inventory Modal
  showInventoryModal = signal(false);
  selectedWarehouse = signal<WarehouseDTO | null>(null);
  warehouseInventories = signal<InventoryDTO[]>([]);
  loadingInventory = signal(false);
  addingProduct = signal(false);
  addProductError = signal<string | null>(null);
  addProductSuccess = signal<string | null>(null);

  addProductForm = {
    productId: null as number | null,
    quantity: 1
  };

  // Computed values for inventory stats
  totalQuantity = computed(() =>
    this.warehouseInventories().reduce((sum, i) => sum + i.quantity, 0)
  );

  inStockCount = computed(() =>
    this.warehouseInventories().filter(i => i.quantity >= 10).length
  );

  lowStockCount = computed(() =>
    this.warehouseInventories().filter(i => i.quantity > 0 && i.quantity < 10).length
  );

  outOfStockCount = computed(() =>
    this.warehouseInventories().filter(i => i.quantity === 0).length
  );

  // Available products (not already in the warehouse)
  availableProducts = computed(() => {
    const existingProductIds = this.warehouseInventories().map(i => i.productId);
    return this.productFacade.products().filter(p => !existingProductIds.includes(p.id!));
  });

  ngOnInit() {
    this.facade.loadWarehouses();
    this.productFacade.loadProducts();
  }

  openCreateModal() {
    this.editingWarehouse = null;
    this.formData = { name: '', location: '' };
    this.modalError = '';
    this.showModal = true;
  }

  openEditModal(warehouse: WarehouseDTO) {
    this.editingWarehouse = warehouse;
    this.formData = { name: warehouse.name, location: warehouse.location };
    this.modalError = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingWarehouse = null;
    this.formData = { name: '', location: '' };
    this.modalError = '';
  }

  isFormValid(): boolean {
    return !!(this.formData.name.trim() && this.formData.location.trim());
  }

  saveWarehouse() {
    if (!this.isFormValid()) return;

    this.submitting = true;
    this.modalError = '';

    if (this.editingWarehouse) {
      const data: WarehouseUpdateDTO = {
        name: this.formData.name.trim(),
        location: this.formData.location.trim()
      };
      this.facade.updateWarehouse(this.editingWarehouse.id!, data).subscribe({
        next: () => {
          this.submitting = false;
          this.closeModal();
        },
        error: (err) => {
          this.submitting = false;
          this.modalError = err.message;
        }
      });
    } else {
      const data: WarehouseCreateDTO = {
        name: this.formData.name.trim(),
        location: this.formData.location.trim()
      };
      this.facade.createWarehouse(data).subscribe({
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

  onDelete(warehouse: WarehouseDTO) {
    if (warehouse.id && confirm(`Supprimer l'entrepot "${warehouse.name}" ?`)) {
      this.facade.deleteWarehouse(warehouse.id).subscribe({
        error: (err) => alert(err.message)
      });
    }
  }

  // Inventory Modal Methods
  openInventoryModal(warehouse: WarehouseDTO) {
    this.selectedWarehouse.set(warehouse);
    this.showInventoryModal.set(true);
    this.loadWarehouseInventory(warehouse.id!);
    this.resetAddProductForm();
  }

  closeInventoryModal() {
    this.showInventoryModal.set(false);
    this.selectedWarehouse.set(null);
    this.warehouseInventories.set([]);
    this.resetAddProductForm();
  }

  loadWarehouseInventory(warehouseId: number) {
    this.loadingInventory.set(true);
    this.inventoryFacade.getInventoriesByWarehouse(warehouseId).subscribe({
      next: (inventories) => {
        this.warehouseInventories.set(inventories);
        this.loadingInventory.set(false);
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.loadingInventory.set(false);
      }
    });
  }

  resetAddProductForm() {
    this.addProductForm = { productId: null, quantity: 1 };
    this.addProductError.set(null);
    this.addProductSuccess.set(null);
  }

  isAddProductFormValid(): boolean {
    return !!(this.addProductForm.productId && this.addProductForm.quantity > 0);
  }

  addProductToWarehouse() {
    if (!this.isAddProductFormValid() || !this.selectedWarehouse()) return;

    this.addingProduct.set(true);
    this.addProductError.set(null);
    this.addProductSuccess.set(null);

    const data: InventoryCreateDTO = {
      productId: this.addProductForm.productId!,
      warehouseId: this.selectedWarehouse()!.id!,
      quantity: this.addProductForm.quantity
    };

    this.inventoryFacade.createInventory(data).subscribe({
      next: () => {
        this.addingProduct.set(false);
        this.addProductSuccess.set('Produit ajoute avec succes!');
        this.loadWarehouseInventory(this.selectedWarehouse()!.id!);
        this.addProductForm = { productId: null, quantity: 1 };

        // Clear success message after 3 seconds
        setTimeout(() => this.addProductSuccess.set(null), 3000);
      },
      error: (err) => {
        this.addingProduct.set(false);
        this.addProductError.set(err.message || 'Erreur lors de l\'ajout du produit');
      }
    });
  }
}
