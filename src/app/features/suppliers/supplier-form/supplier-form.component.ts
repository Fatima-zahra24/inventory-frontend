import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupplierFacade } from '../../../api-facade/suppliers/supplierFacade';
import { SupplierCreateDTO, SupplierUpdateDTO } from '../../../api/supplier';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-container">
      <header class="header">
        <button class="back-btn" routerLink="/suppliers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1>{{ isEditMode ? 'Modifier le fournisseur' : 'Nouveau fournisseur' }}</h1>
          <p class="subtitle">{{ isEditMode ? 'Modifiez les informations du fournisseur' : 'Remplissez les informations du fournisseur' }}</p>
        </div>
      </header>

      @if (loading) {
        <div class="loading-overlay">
          <div class="spinner"></div>
          <span>Chargement...</span>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
        <div class="form-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>

        <!-- Section: Informations de base -->
        <div class="form-section">
          <h3 class="section-title">Informations de base</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="code">Code fournisseur *</label>
              <input
                id="code"
                type="text"
                formControlName="code"
                placeholder="Ex: FRN-001"
                [readonly]="isEditMode"
              >
              @if (form.get('code')?.touched && form.get('code')?.errors?.['required']) {
                <span class="error">Le code est requis</span>
              }
              @if (form.get('code')?.touched && form.get('code')?.errors?.['minlength']) {
                <span class="error">Le code doit contenir au moins 2 caracteres</span>
              }
            </div>

            <div class="form-group">
              <label for="name">Nom du fournisseur *</label>
              <input
                id="name"
                type="text"
                formControlName="name"
                placeholder="Ex: Acme Corporation"
              >
              @if (form.get('name')?.touched && form.get('name')?.errors?.['required']) {
                <span class="error">Le nom est requis</span>
              }
              @if (form.get('name')?.touched && form.get('name')?.errors?.['minlength']) {
                <span class="error">Le nom doit contenir au moins 2 caracteres</span>
              }
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              formControlName="description"
              placeholder="Description du fournisseur..."
              rows="3"
            ></textarea>
          </div>
        </div>

        <!-- Section: Contact -->
        <div class="form-section">
          <h3 class="section-title">Contact</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="contact@exemple.com"
              >
              @if (form.get('email')?.touched && form.get('email')?.errors?.['email']) {
                <span class="error">Adresse email invalide</span>
              }
            </div>

            <div class="form-group">
              <label for="phone">Telephone</label>
              <input
                id="phone"
                type="tel"
                formControlName="phone"
                placeholder="+33 1 23 45 67 89"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="website">Site web</label>
            <input
              id="website"
              type="url"
              formControlName="website"
              placeholder="https://www.exemple.com"
            >
          </div>
        </div>

        <!-- Section: Adresse -->
        <div class="form-section">
          <h3 class="section-title">Adresse</h3>
          <div class="form-group">
            <label for="address">Adresse</label>
            <input
              id="address"
              type="text"
              formControlName="address"
              placeholder="123 Rue de l'Exemple"
            >
          </div>

          <div class="form-row three-cols">
            <div class="form-group">
              <label for="city">Ville</label>
              <input
                id="city"
                type="text"
                formControlName="city"
                placeholder="Paris"
              >
            </div>

            <div class="form-group">
              <label for="postalCode">Code postal</label>
              <input
                id="postalCode"
                type="text"
                formControlName="postalCode"
                placeholder="75001"
              >
            </div>

            <div class="form-group">
              <label for="country">Pays</label>
              <input
                id="country"
                type="text"
                formControlName="country"
                placeholder="France"
              >
            </div>
          </div>
        </div>

        <!-- Section: Informations commerciales -->
        <div class="form-section">
          <h3 class="section-title">Informations commerciales</h3>
          <div class="form-row three-cols">
            <div class="form-group">
              <label for="taxId">Numero fiscal (SIRET)</label>
              <input
                id="taxId"
                type="text"
                formControlName="taxId"
                placeholder="123 456 789 00012"
              >
            </div>

            <div class="form-group">
              <label for="paymentTerms">Delai de paiement (jours)</label>
              <input
                id="paymentTerms"
                type="number"
                formControlName="paymentTerms"
                placeholder="30"
                min="0"
              >
            </div>

            <div class="form-group">
              <label for="creditLimit">Limite de credit</label>
              <input
                id="creditLimit"
                type="number"
                formControlName="creditLimit"
                placeholder="10000"
                min="0"
              >
            </div>
          </div>
        </div>

        @if (error) {
          <div class="error-message">{{ error }}</div>
        }

        <div class="form-actions">
          <button type="button" class="btn-secondary" routerLink="/suppliers">
            Annuler
          </button>
          <button type="submit" class="btn-primary" [disabled]="form.invalid || submitting">
            @if (submitting) {
              <span class="spinner-small"></span>
              Enregistrement...
            } @else {
              {{ isEditMode ? 'Modifier' : 'Creer' }}
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 32px;
    }

    .header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 32px;
    }

    .back-btn {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .back-btn svg {
      width: 20px;
      height: 20px;
      color: #374151;
    }

    .header h1 {
      margin: 0 0 4px;
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .loading-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px;
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

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .form {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .form-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 32px;
      color: #4f46e5;
    }

    .form-icon svg {
      width: 40px;
      height: 40px;
    }

    .form-section {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .form-section:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-row.three-cols {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .form-row .form-group {
      margin-bottom: 0;
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
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .form-group input[readonly] {
      background: #f9fafb;
      color: #6b7280;
      cursor: not-allowed;
    }

    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }

    .form-group .error {
      font-size: 12px;
      color: #dc2626;
    }

    .error-message {
      background: #fee2e2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 24px;
      font-size: 14px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }

    .btn-primary,
    .btn-secondary {
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
      border: none;
    }

    .btn-primary:hover:not(:disabled) {
      background: #4338ca;
    }

    .btn-primary:disabled {
      background: #a5b4fc;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
      text-decoration: none;
    }

    .btn-secondary:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    @media (max-width: 768px) {
      .form-row,
      .form-row.three-cols {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SupplierFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supplierFacade = inject(SupplierFacade);

  form!: FormGroup;
  isEditMode = false;
  supplierId: number | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;

  ngOnInit() {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.supplierId = +id;
      this.loadSupplier(this.supplierId);
    }
  }

  private initForm() {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phone: [''],
      website: [''],
      address: [''],
      city: [''],
      postalCode: [''],
      country: [''],
      description: [''],
      taxId: [''],
      paymentTerms: [null],
      creditLimit: [null]
    });
  }

  private loadSupplier(id: number) {
    this.loading = true;
    this.supplierFacade.getSupplier(id).subscribe({
      next: (supplier) => {
        if (supplier) {
          this.form.patchValue({
            code: supplier.code,
            name: supplier.name,
            email: supplier.email,
            phone: supplier.phone,
            website: supplier.website,
            address: supplier.address,
            city: supplier.city,
            postalCode: supplier.postalCode,
            country: supplier.country,
            description: supplier.description,
            taxId: supplier.taxId,
            paymentTerms: supplier.paymentTerms,
            creditLimit: supplier.creditLimit
          });
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du fournisseur';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.submitting = true;
    this.error = null;

    const formValue = this.form.value;

    if (this.isEditMode && this.supplierId) {
      const updateData: SupplierUpdateDTO = {
        name: formValue.name,
        email: formValue.email || undefined,
        phone: formValue.phone || undefined,
        website: formValue.website || undefined,
        address: formValue.address || undefined,
        city: formValue.city || undefined,
        postalCode: formValue.postalCode || undefined,
        country: formValue.country || undefined,
        description: formValue.description || undefined,
        taxId: formValue.taxId || undefined,
        paymentTerms: formValue.paymentTerms || undefined,
        creditLimit: formValue.creditLimit || undefined
      };

      this.supplierFacade.updateSupplier(this.supplierId, updateData).subscribe({
        next: () => {
          this.router.navigate(['/suppliers']);
        },
        error: (err) => {
          this.error = err.message || 'Erreur lors de la modification';
          this.submitting = false;
        }
      });
    } else {
      const createData: SupplierCreateDTO = {
        code: formValue.code,
        name: formValue.name,
        email: formValue.email || undefined,
        phone: formValue.phone || undefined,
        website: formValue.website || undefined,
        address: formValue.address || undefined,
        city: formValue.city || undefined,
        postalCode: formValue.postalCode || undefined,
        country: formValue.country || undefined,
        description: formValue.description || undefined,
        taxId: formValue.taxId || undefined,
        paymentTerms: formValue.paymentTerms || undefined,
        creditLimit: formValue.creditLimit || undefined
      };

      this.supplierFacade.createSupplier(createData).subscribe({
        next: () => {
          this.router.navigate(['/suppliers']);
        },
        error: (err) => {
          this.error = err.message || 'Erreur lors de la creation';
          this.submitting = false;
        }
      });
    }
  }
}
