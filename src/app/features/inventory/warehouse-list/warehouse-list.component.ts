import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WarehouseFacade } from '../../../api-facade/inventory/warehouseFacade';
import { WarehouseDTO, WarehouseCreateDTO, WarehouseUpdateDTO } from '../../../api/inventory';

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

      <!-- Modal -->
      @if (showModal) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>{{ editingWarehouse ? 'Modifier l\'entrepot' : 'Nouvel entrepot' }}</h2>

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
    }

    .modal {
      background: white;
      border-radius: 12px;
      padding: 32px;
      width: 100%;
      max-width: 440px;
    }

    .modal h2 {
      margin: 0 0 24px;
      font-size: 20px;
      color: #1a1a2e;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
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
export class WarehouseListComponent implements OnInit {
  facade = inject(WarehouseFacade);

  showModal = false;
  submitting = false;
  modalError = '';
  editingWarehouse: WarehouseDTO | null = null;
  formData = { name: '', location: '' };

  ngOnInit() {
    this.facade.loadWarehouses();
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
}
