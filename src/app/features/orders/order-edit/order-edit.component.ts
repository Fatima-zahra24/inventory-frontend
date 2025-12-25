import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderFacade } from '../../../api-facade/orders/orderFacade';
import { OrderDTO, OrderUpdateDTO } from '../../../api/order';

@Component({
  selector: 'app-order-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="order-edit">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Chargement de la commande...</span>
        </div>
      } @else if (order()) {
        <header class="header">
          <div class="header-content">
            <a [routerLink]="['/orders', order()?.id]" class="back-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Retour aux details
            </a>
            <h1>Modifier la commande {{ order()?.orderNumber }}</h1>
          </div>
        </header>

        <div class="form-container">
          <form (ngSubmit)="onSubmit()">
            <!-- Customer Information -->
            <div class="form-section">
              <h2>Informations client</h2>
              <div class="form-grid">
                <div class="form-group">
                  <label>Nom complet *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.customerName"
                    name="customerName"
                    placeholder="Nom du client"
                    [class.error]="submitted && !formData.customerName">
                  @if (submitted && !formData.customerName) {
                    <span class="error-text">Le nom est requis</span>
                  }
                </div>
                <div class="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    [(ngModel)]="formData.customerEmail"
                    name="customerEmail"
                    placeholder="Email du client"
                    [class.error]="submitted && !isValidEmail(formData.customerEmail)">
                  @if (submitted && !isValidEmail(formData.customerEmail)) {
                    <span class="error-text">Email invalide</span>
                  }
                </div>
                <div class="form-group">
                  <label>Telephone</label>
                  <input
                    type="tel"
                    [(ngModel)]="formData.customerPhone"
                    name="customerPhone"
                    placeholder="Numero de telephone">
                </div>
              </div>
            </div>

            <!-- Addresses -->
            <div class="form-section">
              <h2>Adresses</h2>
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Adresse de livraison *</label>
                  <textarea
                    [(ngModel)]="formData.shippingAddress"
                    name="shippingAddress"
                    rows="3"
                    placeholder="Adresse complete de livraison"
                    [class.error]="submitted && !formData.shippingAddress"></textarea>
                  @if (submitted && !formData.shippingAddress) {
                    <span class="error-text">L'adresse de livraison est requise</span>
                  }
                </div>
                <div class="form-group full-width">
                  <label>Adresse de facturation</label>
                  <textarea
                    [(ngModel)]="formData.billingAddress"
                    name="billingAddress"
                    rows="3"
                    placeholder="Adresse de facturation (optionnel)"></textarea>
                </div>
              </div>
            </div>

            <!-- Pricing -->
            <div class="form-section">
              <h2>Tarification</h2>
              <div class="form-grid three-cols">
                <div class="form-group">
                  <label>Frais de livraison (DH)</label>
                  <input
                    type="number"
                    [(ngModel)]="formData.shippingCost"
                    name="shippingCost"
                    min="0"
                    step="0.01"
                    placeholder="0.00">
                </div>
                <div class="form-group">
                  <label>Remise (DH)</label>
                  <input
                    type="number"
                    [(ngModel)]="formData.discountAmount"
                    name="discountAmount"
                    min="0"
                    step="0.01"
                    placeholder="0.00">
                </div>
                <div class="form-group readonly">
                  <label>Total actuel</label>
                  <div class="total-display">
                    {{ order()?.totalAmount | number:'1.2-2' }} DH
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="form-section">
              <h2>Notes</h2>
              <div class="form-group full-width">
                <textarea
                  [(ngModel)]="formData.notes"
                  name="notes"
                  rows="4"
                  placeholder="Notes supplementaires concernant la commande..."></textarea>
              </div>
            </div>

            <!-- Order Summary (readonly) -->
            <div class="form-section summary">
              <h2>Resume de la commande</h2>
              <div class="summary-info">
                <div class="info-row">
                  <span class="label">Statut</span>
                  <span class="status-badge" [class]="getStatusClass(order()?.status)">
                    {{ getStatusLabel(order()?.status) }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Paiement</span>
                  <span class="payment-badge" [class]="getPaymentClass(order()?.paymentStatus)">
                    {{ getPaymentLabel(order()?.paymentStatus) }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Articles</span>
                  <span class="value">{{ order()?.totalItems }} produit(s)</span>
                </div>
                <div class="info-row">
                  <span class="label">Sous-total</span>
                  <span class="value">{{ order()?.subtotal | number:'1.2-2' }} DH</span>
                </div>
              </div>
              <p class="info-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Pour modifier les articles, veuillez creer une nouvelle commande.
              </p>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <a [routerLink]="['/orders', order()?.id]" class="btn-secondary">Annuler</a>
              <button type="submit" class="btn-primary" [disabled]="saving()">
                @if (saving()) {
                  <span class="spinner"></span>
                  Enregistrement...
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Enregistrer les modifications
                }
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .order-edit {
      padding: 32px;
      max-width: 900px;
      margin: 0 auto;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 100px;
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

    /* Header */
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

    /* Form Container */
    .form-container {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .form-section {
      margin-bottom: 32px;
      padding-bottom: 32px;
      border-bottom: 1px solid #e5e7eb;
    }

    .form-section:last-of-type {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .form-section h2 {
      margin: 0 0 20px;
      font-size: 18px;
      color: #1a1a2e;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .form-grid.three-cols {
      grid-template-columns: repeat(3, 1fr);
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
    .form-group textarea {
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
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

    .form-group.readonly .total-display {
      padding: 12px 16px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      font-size: 18px;
      font-weight: 600;
      color: #059669;
    }

    /* Summary Section */
    .form-section.summary {
      background: #f9fafb;
      margin: 0 -32px -32px;
      padding: 24px 32px;
      border-radius: 0 0 16px 16px;
      border-bottom: none;
    }

    .summary-info {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 16px;
    }

    .info-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .info-row .label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .info-row .value {
      font-weight: 500;
      color: #374151;
    }

    .status-badge, .payment-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      width: fit-content;
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

    .info-note {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 12px 16px;
      background: #e0e7ff;
      border-radius: 8px;
      font-size: 13px;
      color: #4338ca;
    }

    .info-note svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }

    .btn-secondary, .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
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
      border: none;
    }

    .btn-primary:hover {
      background: #4338ca;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-primary svg {
      width: 18px;
      height: 18px;
    }

    .btn-primary .spinner {
      width: 16px;
      height: 16px;
      border-width: 2px;
      border-color: rgba(255,255,255,0.3);
      border-top-color: white;
    }

    @media (max-width: 768px) {
      .form-grid,
      .form-grid.three-cols {
        grid-template-columns: 1fr;
      }

      .form-group.full-width {
        grid-column: span 1;
      }

      .summary-info {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class OrderEditComponent implements OnInit {
  private facade = inject(OrderFacade);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  order = signal<OrderDTO | null>(null);
  loading = signal(true);
  saving = signal(false);
  submitted = false;

  formData: OrderUpdateDTO = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    billingAddress: '',
    shippingCost: 0,
    discountAmount: 0,
    notes: ''
  };

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadOrder(id);
    }
  }

  loadOrder(id: number) {
    this.loading.set(true);
    this.facade.getOrder(id).subscribe({
      next: (order) => {
        this.order.set(order);
        if (order) {
          this.formData = {
            customerName: order.customerName || '',
            customerEmail: order.customerEmail || '',
            customerPhone: order.customerPhone || '',
            shippingAddress: order.shippingAddress || '',
            billingAddress: order.billingAddress || '',
            shippingCost: order.shippingCost || 0,
            discountAmount: order.discountAmount || 0,
            notes: order.notes || ''
          };
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/orders']);
      }
    });
  }

  isValidEmail(email?: string): boolean {
    return email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : false;
  }

  onSubmit() {
    this.submitted = true;

    if (!this.formData.customerName || !this.isValidEmail(this.formData.customerEmail) || !this.formData.shippingAddress) {
      return;
    }

    this.saving.set(true);
    const orderId = this.order()?.id;

    if (orderId) {
      this.facade.updateOrder(orderId, this.formData).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/orders', orderId]);
        },
        error: (err) => {
          console.error('Error updating order:', err);
          this.saving.set(false);
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
