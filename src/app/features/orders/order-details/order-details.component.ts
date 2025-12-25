import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { OrderFacade } from '../../../api-facade/orders/orderFacade';
import { OrderDTO } from '../../../api/order';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="order-details">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Chargement de la commande...</span>
        </div>
      } @else if (order()) {
        <header class="header">
          <div class="header-left">
            <a routerLink="/orders" class="back-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Retour aux commandes
            </a>
            <div class="order-title">
              <h1>Commande {{ order()?.orderNumber }}</h1>
              <span class="status-badge" [class]="getStatusClass(order()?.status)">
                {{ getStatusLabel(order()?.status) }}
              </span>
              <span class="payment-badge" [class]="getPaymentClass(order()?.paymentStatus)">
                {{ getPaymentLabel(order()?.paymentStatus) }}
              </span>
            </div>
          </div>
          <div class="header-actions">
            <a [routerLink]="['/orders', order()?.id, 'edit']" class="btn-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Modifier
            </a>
            @if (canCancel()) {
              <button class="btn-warning" (click)="showCancelModal.set(true)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                Annuler
              </button>
            }
          </div>
        </header>

        <div class="content-grid">
          <!-- Timeline -->
          <div class="timeline-section">
            <h2>Suivi de la commande</h2>
            <div class="timeline">
              @for (step of timelineSteps; track step.status) {
                <div class="timeline-step"
                     [class.completed]="isStepCompleted(step.status)"
                     [class.current]="order()?.status === step.status"
                     [class.cancelled]="order()?.status === 'CANCELLED' && step.status === 'CANCELLED'">
                  <div class="step-marker">
                    @if (isStepCompleted(step.status)) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    } @else if (order()?.status === step.status) {
                      <div class="pulse"></div>
                    }
                  </div>
                  <div class="step-content">
                    <span class="step-label">{{ step.label }}</span>
                    @if (order()?.status === step.status && order()?.updatedAt) {
                      <span class="step-date">{{ order()?.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Status Actions -->
            @if (order()?.status !== 'CANCELLED' && order()?.status !== 'REFUNDED') {
              <div class="status-actions">
                <h3>Changer le statut</h3>
                <div class="action-buttons">
                  @for (action of getAvailableStatusActions(); track action.status) {
                    <button
                      class="status-btn"
                      [class]="action.class"
                      (click)="changeStatus(action.status)">
                      {{ action.label }}
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Payment Status Actions -->
            @if (order()?.paymentStatus !== 'REFUNDED') {
              <div class="status-actions">
                <h3>Statut de paiement</h3>
                <div class="action-buttons">
                  @for (action of getAvailablePaymentActions(); track action.status) {
                    <button
                      class="payment-btn"
                      [class]="action.class"
                      (click)="changePaymentStatus(action.status)">
                      {{ action.label }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Order Info -->
          <div class="info-section">
            <!-- Customer Info -->
            <div class="info-card">
              <div class="card-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <h3>Client</h3>
              </div>
              <div class="card-body">
                <p class="customer-name">{{ order()?.customerName }}</p>
                <p><a [href]="'mailto:' + order()?.customerEmail">{{ order()?.customerEmail }}</a></p>
                @if (order()?.customerPhone) {
                  <p>{{ order()?.customerPhone }}</p>
                }
              </div>
            </div>

            <!-- Shipping Address -->
            <div class="info-card">
              <div class="card-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <h3>Adresse de livraison</h3>
              </div>
              <div class="card-body">
                <p>{{ order()?.shippingAddress }}</p>
              </div>
            </div>

            <!-- Billing Address -->
            @if (order()?.billingAddress && order()?.billingAddress !== order()?.shippingAddress) {
              <div class="info-card">
                <div class="card-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  <h3>Adresse de facturation</h3>
                </div>
                <div class="card-body">
                  <p>{{ order()?.billingAddress }}</p>
                </div>
              </div>
            }

            <!-- Notes -->
            @if (order()?.notes) {
              <div class="info-card">
                <div class="card-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <h3>Notes</h3>
                </div>
                <div class="card-body">
                  <p>{{ order()?.notes }}</p>
                </div>
              </div>
            }

            <!-- Order Meta -->
            <div class="info-card meta">
              <div class="meta-item">
                <span class="meta-label">Creee le</span>
                <span class="meta-value">{{ order()?.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Mise a jour</span>
                <span class="meta-value">{{ order()?.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Items -->
        <div class="items-section">
          <h2>Articles commandes ({{ order()?.totalItems }})</h2>
          <div class="items-table">
            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Prix unitaire</th>
                  <th>Remise</th>
                  <th>Quantite</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                @for (item of order()?.items; track item.id) {
                  <tr>
                    <td>
                      <span class="product-name">{{ item.productName }}</span>
                      <span class="product-code">{{ item.productCode }}</span>
                    </td>
                    <td>{{ item.unitPrice | number:'1.2-2' }} DH</td>
                    <td>{{ item.discountPercent || 0 }}%</td>
                    <td>{{ item.quantity }}</td>
                    <td class="item-total">{{ item.totalPrice | number:'1.2-2' }} DH</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div class="totals">
            <div class="total-row">
              <span>Sous-total</span>
              <span>{{ order()?.subtotal | number:'1.2-2' }} DH</span>
            </div>
            <div class="total-row">
              <span>Frais de livraison</span>
              <span>{{ order()?.shippingCost | number:'1.2-2' }} DH</span>
            </div>
            @if (order()?.discountAmount && order()!.discountAmount! > 0) {
              <div class="total-row discount">
                <span>Remise</span>
                <span>-{{ order()?.discountAmount | number:'1.2-2' }} DH</span>
              </div>
            }
            <div class="total-row">
              <span>TVA (20%)</span>
              <span>{{ order()?.taxAmount | number:'1.2-2' }} DH</span>
            </div>
            <div class="total-row grand-total">
              <span>Total TTC</span>
              <span>{{ order()?.totalAmount | number:'1.2-2' }} DH</span>
            </div>
          </div>
        </div>
      }

      <!-- Cancel Modal -->
      @if (showCancelModal()) {
        <div class="modal-overlay" (click)="showCancelModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Annuler la commande</h3>
            </div>
            <div class="modal-body">
              <p>Etes-vous sur de vouloir annuler la commande <strong>{{ order()?.orderNumber }}</strong> ?</p>
              <p class="warning-text">Cette action est irreversible.</p>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showCancelModal.set(false)">Non, garder</button>
              <button class="btn-danger" (click)="cancelOrder()">Oui, annuler</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .order-details {
      padding: 32px;
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
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
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

    .order-title {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .order-title h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .status-badge, .payment-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
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

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn-secondary, .btn-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
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

    .btn-warning {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .btn-warning:hover {
      background: #fde68a;
    }

    .btn-secondary svg, .btn-warning svg {
      width: 16px;
      height: 16px;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }

    /* Timeline */
    .timeline-section {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .timeline-section h2 {
      margin: 0 0 24px;
      font-size: 18px;
      color: #1a1a2e;
    }

    .timeline {
      position: relative;
      padding-left: 32px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 11px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e5e7eb;
    }

    .timeline-step {
      position: relative;
      padding-bottom: 24px;
    }

    .timeline-step:last-child {
      padding-bottom: 0;
    }

    .step-marker {
      position: absolute;
      left: -32px;
      width: 24px;
      height: 24px;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .timeline-step.completed .step-marker {
      background: #059669;
      border-color: #059669;
      color: white;
    }

    .timeline-step.current .step-marker {
      background: #4f46e5;
      border-color: #4f46e5;
    }

    .timeline-step.cancelled .step-marker {
      background: #dc2626;
      border-color: #dc2626;
    }

    .step-marker svg {
      width: 14px;
      height: 14px;
    }

    .pulse {
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .step-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .step-label {
      font-weight: 500;
      color: #374151;
    }

    .timeline-step.completed .step-label {
      color: #059669;
    }

    .timeline-step.current .step-label {
      color: #4f46e5;
      font-weight: 600;
    }

    .step-date {
      font-size: 12px;
      color: #6b7280;
    }

    /* Status Actions */
    .status-actions {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }

    .status-actions h3 {
      margin: 0 0 12px;
      font-size: 14px;
      color: #6b7280;
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .status-btn, .payment-btn {
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }

    .status-btn:hover, .payment-btn:hover {
      background: #f9fafb;
    }

    .status-btn.confirm { border-color: #3b82f6; color: #3b82f6; }
    .status-btn.process { border-color: #f97316; color: #f97316; }
    .status-btn.ship { border-color: #8b5cf6; color: #8b5cf6; }
    .status-btn.deliver { border-color: #10b981; color: #10b981; }
    .status-btn.refund { border-color: #6b7280; color: #6b7280; }

    .payment-btn.paid { border-color: #10b981; color: #10b981; }
    .payment-btn.failed { border-color: #ef4444; color: #ef4444; }
    .payment-btn.refund { border-color: #6b7280; color: #6b7280; }

    /* Info Section */
    .info-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .card-header svg {
      width: 20px;
      height: 20px;
      color: #6b7280;
    }

    .card-header h3 {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .card-body p {
      margin: 0 0 4px;
      color: #374151;
    }

    .customer-name {
      font-weight: 600;
      font-size: 16px;
      color: #1a1a2e !important;
    }

    .card-body a {
      color: #4f46e5;
      text-decoration: none;
    }

    .card-body a:hover {
      text-decoration: underline;
    }

    .info-card.meta {
      display: flex;
      gap: 32px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .meta-value {
      font-weight: 500;
      color: #374151;
    }

    /* Items Section */
    .items-section {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .items-section h2 {
      margin: 0 0 20px;
      font-size: 18px;
      color: #1a1a2e;
    }

    .items-table {
      overflow-x: auto;
    }

    .items-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .items-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .items-table td {
      padding: 16px;
      border-bottom: 1px solid #f3f4f6;
    }

    .product-name {
      display: block;
      font-weight: 500;
      color: #1a1a2e;
    }

    .product-code {
      font-size: 12px;
      color: #6b7280;
      font-family: monospace;
    }

    .item-total {
      font-weight: 600;
      color: #059669;
    }

    /* Totals */
    .totals {
      max-width: 350px;
      margin-left: auto;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 2px solid #e5e7eb;
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
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 18px;
      color: #1a1a2e;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-body p {
      margin: 0 0 8px;
    }

    .warning-text {
      color: #dc2626;
      font-size: 14px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
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

    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .header {
        flex-direction: column;
        gap: 16px;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions .btn-secondary,
      .header-actions .btn-warning {
        flex: 1;
        justify-content: center;
      }
    }
  `]
})
export class OrderDetailsComponent implements OnInit {
  private facade = inject(OrderFacade);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  order = signal<OrderDTO | null>(null);
  loading = signal(true);
  showCancelModal = signal(false);

  timelineSteps = [
    { status: 'PENDING', label: 'En attente' },
    { status: 'CONFIRMED', label: 'Confirmee' },
    { status: 'PROCESSING', label: 'En traitement' },
    { status: 'SHIPPED', label: 'Expediee' },
    { status: 'DELIVERED', label: 'Livree' },
    { status: 'CANCELLED', label: 'Annulee' }
  ];

  private statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

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
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/orders']);
      }
    });
  }

  isStepCompleted(status: string): boolean {
    const currentIndex = this.statusOrder.indexOf(this.order()?.status || '');
    const stepIndex = this.statusOrder.indexOf(status);
    return stepIndex >= 0 && stepIndex < currentIndex;
  }

  canCancel(): boolean {
    const status = this.order()?.status;
    return status === 'PENDING' || status === 'CONFIRMED' || status === 'PROCESSING';
  }

  getAvailableStatusActions(): { status: OrderDTO.StatusEnum; label: string; class: string }[] {
    const current = this.order()?.status;
    const actions: { status: OrderDTO.StatusEnum; label: string; class: string }[] = [];

    switch (current) {
      case 'PENDING':
        actions.push({ status: 'CONFIRMED', label: 'Confirmer', class: 'confirm' });
        break;
      case 'CONFIRMED':
        actions.push({ status: 'PROCESSING', label: 'En traitement', class: 'process' });
        break;
      case 'PROCESSING':
        actions.push({ status: 'SHIPPED', label: 'Expedier', class: 'ship' });
        break;
      case 'SHIPPED':
        actions.push({ status: 'DELIVERED', label: 'Livree', class: 'deliver' });
        break;
      case 'DELIVERED':
        actions.push({ status: 'REFUNDED', label: 'Rembourser', class: 'refund' });
        break;
    }

    return actions;
  }

  getAvailablePaymentActions(): { status: OrderDTO.PaymentStatusEnum; label: string; class: string }[] {
    const current = this.order()?.paymentStatus;
    const actions: { status: OrderDTO.PaymentStatusEnum; label: string; class: string }[] = [];

    if (current === 'PENDING') {
      actions.push({ status: 'PAID', label: 'Marquer comme paye', class: 'paid' });
      actions.push({ status: 'FAILED', label: 'Paiement echoue', class: 'failed' });
    }

    if (current === 'PAID' && this.order()?.status === 'DELIVERED') {
      actions.push({ status: 'REFUNDED', label: 'Rembourser', class: 'refund' });
    }

    return actions;
  }

  changeStatus(status: OrderDTO.StatusEnum) {
    const orderId = this.order()?.id;
    if (orderId) {
      this.facade.updateOrderStatus(orderId, status).subscribe({
        next: (updated) => {
          this.order.set(updated);
        }
      });
    }
  }

  changePaymentStatus(status: OrderDTO.PaymentStatusEnum) {
    const orderId = this.order()?.id;
    if (orderId) {
      this.facade.updatePaymentStatus(orderId, status).subscribe({
        next: (updated) => {
          this.order.set(updated);
        }
      });
    }
  }

  cancelOrder() {
    const orderId = this.order()?.id;
    if (orderId) {
      this.facade.cancelOrder(orderId).subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.showCancelModal.set(false);
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
