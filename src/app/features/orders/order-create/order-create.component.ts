import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderFacade } from '../../../api-facade/orders/orderFacade';
import { ProductFacade } from '../../../api-facade/products/productFacade';
import { OrderCreateDTO, OrderItemCreateDTO } from '../../../api/order';
import { ProductDTO } from '../../../api/product';

interface CartItem {
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="order-create">
      <header class="header">
        <div class="header-content">
          <a routerLink="/orders" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Retour aux commandes
          </a>
          <h1>Nouvelle commande</h1>
        </div>
      </header>

      <!-- Stepper -->
      <div class="stepper">
        @for (step of steps; track step.id; let i = $index) {
          <div class="step" [class.active]="currentStep() === step.id" [class.completed]="currentStep() > step.id">
            <div class="step-number">
              @if (currentStep() > step.id) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              } @else {
                {{ step.id }}
              }
            </div>
            <div class="step-info">
              <span class="step-title">{{ step.title }}</span>
              <span class="step-subtitle">{{ step.subtitle }}</span>
            </div>
          </div>
          @if (i < steps.length - 1) {
            <div class="step-connector" [class.active]="currentStep() > step.id"></div>
          }
        }
      </div>

      <div class="form-container">
        <!-- Step 1: Customer Info -->
        @if (currentStep() === 1) {
          <div class="step-content">
            <h2>Informations client</h2>
            <div class="form-grid">
              <div class="form-group">
                <label>Nom complet *</label>
                <input
                  type="text"
                  [(ngModel)]="customerName"
                  placeholder="Ex: Jean Dupont"
                  [class.error]="submitted && !customerName">
                @if (submitted && !customerName) {
                  <span class="error-text">Le nom est requis</span>
                }
              </div>
              <div class="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  [(ngModel)]="customerEmail"
                  placeholder="Ex: jean@email.com"
                  [class.error]="submitted && !isValidEmail(customerEmail)">
                @if (submitted && !isValidEmail(customerEmail)) {
                  <span class="error-text">Email invalide</span>
                }
              </div>
              <div class="form-group">
                <label>Telephone</label>
                <input
                  type="tel"
                  [(ngModel)]="customerPhone"
                  placeholder="Ex: 06 12 34 56 78">
              </div>
            </div>
          </div>
        }

        <!-- Step 2: Addresses -->
        @if (currentStep() === 2) {
          <div class="step-content">
            <h2>Adresses</h2>
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Adresse de livraison *</label>
                <textarea
                  [(ngModel)]="shippingAddress"
                  rows="3"
                  placeholder="Adresse complete de livraison"
                  [class.error]="submitted && !shippingAddress"></textarea>
                @if (submitted && !shippingAddress) {
                  <span class="error-text">L'adresse de livraison est requise</span>
                }
              </div>
              <div class="form-group full-width">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="sameAddress">
                  Meme adresse pour la facturation
                </label>
              </div>
              @if (!sameAddress) {
                <div class="form-group full-width">
                  <label>Adresse de facturation</label>
                  <textarea
                    [(ngModel)]="billingAddress"
                    rows="3"
                    placeholder="Adresse de facturation"></textarea>
                </div>
              }
            </div>
          </div>
        }

        <!-- Step 3: Products -->
        @if (currentStep() === 3) {
          <div class="step-content">
            <h2>Selection des produits</h2>

            <!-- Product Search -->
            <div class="product-search">
              <div class="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  [(ngModel)]="productSearch"
                  placeholder="Rechercher un produit...">
              </div>
            </div>

            <!-- Available Products -->
            <div class="products-grid">
              @for (product of filteredProducts(); track product.id) {
                <div class="product-card" [class.disabled]="product.status !== 'ACTIVE'">
                  <div class="product-info">
                    <span class="product-code">{{ product.code }}</span>
                    <span class="product-name">{{ product.name }}</span>
                    <span class="product-price">{{ product.basePrice | number:'1.2-2' }} DH</span>
                  </div>
                  <div class="product-actions">
                    <input
                      type="number"
                      min="1"
                      [(ngModel)]="productQuantities[product.id!]"
                      placeholder="Qty"
                      class="qty-input">
                    <button
                      class="add-btn"
                      (click)="addToCart(product)"
                      [disabled]="product.status !== 'ACTIVE'">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Cart -->
            @if (cart().length > 0) {
              <div class="cart-section">
                <h3>Panier ({{ cart().length }} article{{ cart().length > 1 ? 's' : '' }})</h3>
                <div class="cart-items">
                  @for (item of cart(); track item.productId) {
                    <div class="cart-item">
                      <div class="item-info">
                        <span class="item-name">{{ item.productName }}</span>
                        <span class="item-code">{{ item.productCode }}</span>
                      </div>
                      <div class="item-qty">
                        <button (click)="updateQuantity(item, -1)">-</button>
                        <span>{{ item.quantity }}</span>
                        <button (click)="updateQuantity(item, 1)">+</button>
                      </div>
                      <div class="item-price">
                        {{ item.unitPrice | number:'1.2-2' }} DH x {{ item.quantity }}
                      </div>
                      <div class="item-total">
                        {{ item.totalPrice | number:'1.2-2' }} DH
                      </div>
                      <button class="remove-btn" (click)="removeFromCart(item)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Step 4: Summary -->
        @if (currentStep() === 4) {
          <div class="step-content">
            <h2>Recapitulatif</h2>

            <div class="summary-grid">
              <!-- Customer Info -->
              <div class="summary-card">
                <h3>Client</h3>
                <p><strong>{{ customerName }}</strong></p>
                <p>{{ customerEmail }}</p>
                @if (customerPhone) {
                  <p>{{ customerPhone }}</p>
                }
              </div>

              <!-- Shipping Address -->
              <div class="summary-card">
                <h3>Livraison</h3>
                <p>{{ shippingAddress }}</p>
              </div>

              <!-- Billing Address -->
              <div class="summary-card">
                <h3>Facturation</h3>
                <p>{{ sameAddress ? shippingAddress : billingAddress }}</p>
              </div>

              <!-- Additional Info -->
              <div class="summary-card full-width">
                <div class="form-row">
                  <div class="form-group">
                    <label>Frais de livraison (DH)</label>
                    <input type="number" [(ngModel)]="shippingCost" min="0" step="0.01">
                  </div>
                  <div class="form-group">
                    <label>Remise (DH)</label>
                    <input type="number" [(ngModel)]="discountAmount" min="0" step="0.01">
                  </div>
                </div>
                <div class="form-group">
                  <label>Notes</label>
                  <textarea [(ngModel)]="notes" rows="2" placeholder="Notes supplementaires..."></textarea>
                </div>
              </div>
            </div>

            <!-- Order Items -->
            <div class="order-items">
              <h3>Articles commandes</h3>
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Prix unitaire</th>
                    <th>Quantite</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of cart(); track item.productId) {
                    <tr>
                      <td>
                        <span class="item-name">{{ item.productName }}</span>
                        <span class="item-code">{{ item.productCode }}</span>
                      </td>
                      <td>{{ item.unitPrice | number:'1.2-2' }} DH</td>
                      <td>{{ item.quantity }}</td>
                      <td class="total">{{ item.totalPrice | number:'1.2-2' }} DH</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Totals -->
            <div class="totals-section">
              <div class="total-row">
                <span>Sous-total</span>
                <span>{{ subtotal() | number:'1.2-2' }} DH</span>
              </div>
              <div class="total-row">
                <span>Frais de livraison</span>
                <span>{{ shippingCost | number:'1.2-2' }} DH</span>
              </div>
              @if (discountAmount > 0) {
                <div class="total-row discount">
                  <span>Remise</span>
                  <span>-{{ discountAmount | number:'1.2-2' }} DH</span>
                </div>
              }
              <div class="total-row">
                <span>TVA (20%)</span>
                <span>{{ taxAmount() | number:'1.2-2' }} DH</span>
              </div>
              <div class="total-row grand-total">
                <span>Total TTC</span>
                <span>{{ grandTotal() | number:'1.2-2' }} DH</span>
              </div>
            </div>
          </div>
        }

        <!-- Error Message -->
        @if (errorMessage()) {
          <div class="error-alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div class="error-content">
              <span class="error-title">Erreur</span>
              <span class="error-message">{{ errorMessage() }}</span>
            </div>
            <button class="close-btn" (click)="errorMessage.set(null)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        }

        <!-- Navigation Buttons -->
        <div class="form-actions">
          @if (currentStep() > 1) {
            <button class="btn-secondary" (click)="previousStep()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Precedent
            </button>
          }
          <div class="spacer"></div>
          @if (currentStep() < 4) {
            <button class="btn-primary" (click)="nextStep()">
              Suivant
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          } @else {
            <button class="btn-success" (click)="submitOrder()" [disabled]="submitting()">
              @if (submitting()) {
                <span class="spinner"></span>
                Creation en cours...
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Creer la commande
              }
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .order-create {
      padding: 32px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 32px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #6b7280;
      text-decoration: none;
      font-size: 14px;
      margin-bottom: 12px;
    }

    .back-link:hover {
      color: #4f46e5;
    }

    .back-link svg {
      width: 16px;
      height: 16px;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
    }

    /* Stepper */
    .stepper {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 40px;
      padding: 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .step {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .step-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e5e7eb;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s;
    }

    .step-number svg {
      width: 20px;
      height: 20px;
    }

    .step.active .step-number {
      background: #4f46e5;
      color: white;
    }

    .step.completed .step-number {
      background: #059669;
      color: white;
    }

    .step-info {
      display: flex;
      flex-direction: column;
    }

    .step-title {
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }

    .step.active .step-title {
      color: #4f46e5;
    }

    .step-subtitle {
      font-size: 12px;
      color: #9ca3af;
    }

    .step-connector {
      width: 60px;
      height: 2px;
      background: #e5e7eb;
      margin: 0 16px;
      transition: background 0.3s;
    }

    .step-connector.active {
      background: #059669;
    }

    /* Form Container */
    .form-container {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .step-content h2 {
      margin: 0 0 24px;
      font-size: 20px;
      color: #1a1a2e;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group.full-width {
      grid-column: span 2;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .form-group input.error,
    .form-group textarea.error {
      border-color: #dc2626;
    }

    .error-text {
      font-size: 12px;
      color: #dc2626;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .checkbox-label input {
      width: 18px;
      height: 18px;
    }

    /* Product Search & Grid */
    .product-search {
      margin-bottom: 20px;
    }

    .search-box {
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
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      max-height: 300px;
      overflow-y: auto;
      margin-bottom: 24px;
    }

    .product-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f9fafb;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
    }

    .product-card.disabled {
      opacity: 0.5;
    }

    .product-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .product-code {
      font-family: monospace;
      font-size: 12px;
      color: #6b7280;
    }

    .product-name {
      font-weight: 500;
      color: #1a1a2e;
    }

    .product-price {
      font-weight: 600;
      color: #059669;
    }

    .product-actions {
      display: flex;
      gap: 8px;
    }

    .qty-input {
      width: 60px;
      padding: 8px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      text-align: center;
    }

    .add-btn {
      padding: 8px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .add-btn:hover {
      background: #4338ca;
    }

    .add-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .add-btn svg {
      width: 16px;
      height: 16px;
    }

    /* Cart */
    .cart-section {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 20px;
    }

    .cart-section h3 {
      margin: 0 0 16px;
      font-size: 16px;
      color: #065f46;
    }

    .cart-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cart-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      background: white;
      border-radius: 8px;
    }

    .cart-item .item-info {
      flex: 1;
    }

    .cart-item .item-name {
      display: block;
      font-weight: 500;
    }

    .cart-item .item-code {
      font-size: 12px;
      color: #6b7280;
    }

    .item-qty {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .item-qty button {
      width: 28px;
      height: 28px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
    }

    .item-qty button:hover {
      background: #f3f4f6;
    }

    .item-price {
      color: #6b7280;
      font-size: 13px;
    }

    .item-total {
      font-weight: 600;
      color: #059669;
      min-width: 80px;
      text-align: right;
    }

    .remove-btn {
      padding: 6px;
      background: transparent;
      border: none;
      color: #dc2626;
      cursor: pointer;
    }

    .remove-btn svg {
      width: 16px;
      height: 16px;
    }

    /* Summary */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .summary-card {
      background: #f9fafb;
      border-radius: 10px;
      padding: 16px;
    }

    .summary-card.full-width {
      grid-column: span 3;
    }

    .summary-card h3 {
      margin: 0 0 12px;
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .summary-card p {
      margin: 0 0 4px;
      font-size: 14px;
      color: #374151;
    }

    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
    }

    .form-row .form-group {
      flex: 1;
    }

    /* Order Items Table */
    .order-items {
      margin-bottom: 24px;
    }

    .order-items h3 {
      margin: 0 0 16px;
      font-size: 16px;
    }

    .order-items table {
      width: 100%;
      border-collapse: collapse;
    }

    .order-items th {
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .order-items td {
      padding: 12px;
      border-bottom: 1px solid #f3f4f6;
    }

    .order-items .item-name {
      display: block;
      font-weight: 500;
    }

    .order-items .item-code {
      font-size: 12px;
      color: #6b7280;
    }

    .order-items .total {
      font-weight: 600;
      color: #059669;
    }

    /* Totals */
    .totals-section {
      border-top: 2px solid #e5e7eb;
      padding-top: 20px;
      max-width: 400px;
      margin-left: auto;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }

    .total-row.discount {
      color: #dc2626;
    }

    .total-row.grand-total {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a2e;
      border-top: 1px solid #e5e7eb;
      margin-top: 8px;
      padding-top: 16px;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }

    .spacer {
      flex: 1;
    }

    .btn-secondary,
    .btn-primary,
    .btn-success {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
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

    .btn-primary {
      background: #4f46e5;
      color: white;
    }

    .btn-primary:hover {
      background: #4338ca;
    }

    .btn-success {
      background: #059669;
      color: white;
    }

    .btn-success:hover {
      background: #047857;
    }

    .btn-success:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary svg,
    .btn-primary svg,
    .btn-success svg {
      width: 18px;
      height: 18px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Error Alert */
    .error-alert {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      margin-top: 20px;
    }

    .error-alert > svg {
      width: 24px;
      height: 24px;
      color: #dc2626;
      flex-shrink: 0;
    }

    .error-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .error-title {
      font-weight: 600;
      color: #991b1b;
      font-size: 14px;
    }

    .error-message {
      color: #dc2626;
      font-size: 14px;
    }

    .close-btn {
      padding: 4px;
      background: transparent;
      border: none;
      color: #dc2626;
      cursor: pointer;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: #fee2e2;
    }

    .close-btn svg {
      width: 16px;
      height: 16px;
    }

    @media (max-width: 768px) {
      .stepper {
        flex-direction: column;
        gap: 16px;
      }

      .step-connector {
        width: 2px;
        height: 20px;
        margin: 0;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-group.full-width {
        grid-column: span 1;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .summary-card.full-width {
        grid-column: span 1;
      }
    }
  `]
})
export class OrderCreateComponent implements OnInit {
  private facade = inject(OrderFacade);
  private productFacade = inject(ProductFacade);
  private router = inject(Router);

  steps = [
    { id: 1, title: 'Client', subtitle: 'Informations' },
    { id: 2, title: 'Adresses', subtitle: 'Livraison & facturation' },
    { id: 3, title: 'Produits', subtitle: 'Selection' },
    { id: 4, title: 'Recapitulatif', subtitle: 'Validation' }
  ];

  currentStep = signal(1);
  submitted = false;
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Step 1
  customerName = '';
  customerEmail = '';
  customerPhone = '';

  // Step 2
  shippingAddress = '';
  billingAddress = '';
  sameAddress = true;

  // Step 3
  productSearch = '';
  productQuantities: Record<number, number> = {};
  cart = signal<CartItem[]>([]);

  // Step 4
  shippingCost = 0;
  discountAmount = 0;
  notes = '';

  readonly products = this.productFacade.products;

  filteredProducts = computed(() => {
    const search = this.productSearch.toLowerCase();
    return this.products()
      .filter(p => p.status === 'ACTIVE')
      .filter(p =>
        !search ||
        p.name.toLowerCase().includes(search) ||
        p.code.toLowerCase().includes(search)
      );
  });

  subtotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.totalPrice, 0)
  );

  taxAmount = computed(() =>
    (this.subtotal() + this.shippingCost - this.discountAmount) * 0.20
  );

  grandTotal = computed(() =>
    this.subtotal() + this.shippingCost - this.discountAmount + this.taxAmount()
  );

  ngOnInit() {
    this.productFacade.loadProducts();
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  nextStep() {
    this.submitted = true;

    if (this.currentStep() === 1) {
      if (!this.customerName || !this.isValidEmail(this.customerEmail)) {
        return;
      }
    }

    if (this.currentStep() === 2) {
      if (!this.shippingAddress) {
        return;
      }
    }

    if (this.currentStep() === 3) {
      if (this.cart().length === 0) {
        return;
      }
    }

    this.submitted = false;
    this.currentStep.update(s => Math.min(s + 1, 4));
  }

  previousStep() {
    this.currentStep.update(s => Math.max(s - 1, 1));
  }

  addToCart(product: ProductDTO) {
    const quantity = this.productQuantities[product.id!] || 1;
    const existingIndex = this.cart().findIndex(item => item.productId === product.id);

    if (existingIndex >= 0) {
      const updated = [...this.cart()];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      this.cart.set(updated);
    } else {
      this.cart.update(items => [...items, {
        productId: product.id!,
        productCode: product.code,
        productName: product.name,
        quantity,
        unitPrice: product.basePrice,
        totalPrice: quantity * product.basePrice
      }]);
    }

    this.productQuantities[product.id!] = 1;
  }

  updateQuantity(item: CartItem, delta: number) {
    const updated = this.cart().map(i => {
      if (i.productId === item.productId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty, totalPrice: newQty * i.unitPrice };
      }
      return i;
    });
    this.cart.set(updated);
  }

  removeFromCart(item: CartItem) {
    this.cart.update(items => items.filter(i => i.productId !== item.productId));
  }

  submitOrder() {
    this.submitting.set(true);
    this.errorMessage.set(null);

    const items: OrderItemCreateDTO[] = this.cart().map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));

    const orderData: OrderCreateDTO = {
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      customerPhone: this.customerPhone || undefined,
      shippingAddress: this.shippingAddress,
      billingAddress: this.sameAddress ? this.shippingAddress : this.billingAddress,
      shippingCost: this.shippingCost,
      discountAmount: this.discountAmount,
      notes: this.notes || undefined,
      items
    };

    this.facade.createOrder(orderData).subscribe({
      next: (order) => {
        this.submitting.set(false);
        this.router.navigate(['/orders', order.id]);
      },
      error: (err) => {
        console.error('Error creating order:', err);
        this.submitting.set(false);
        this.errorMessage.set(err.message || 'Une erreur est survenue lors de la creation de la commande');
      }
    });
  }
}
