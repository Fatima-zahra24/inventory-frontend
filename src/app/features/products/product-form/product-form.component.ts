import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductFacade } from '../../../api-facade/products/productFacade';
import { CategoryControllerService, CategoryDTO } from '../../../api/product';
import { ProductCreateDTO, ProductUpdateDTO } from '../../../api/product';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-container">
      <header class="header">
        <button class="back-btn" routerLink="/products">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1>{{ isEditMode ? 'Modifier le produit' : 'Nouveau produit' }}</h1>
          <p class="subtitle">{{ isEditMode ? 'Modifiez les informations du produit' : 'Remplissez les informations du produit' }}</p>
        </div>
      </header>

      @if (loading) {
        <div class="loading-overlay">
          <div class="spinner"></div>
          <span>Chargement...</span>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
        <div class="form-grid">
          <div class="form-group">
            <label for="code">Code *</label>
            <input
              id="code"
              type="text"
              formControlName="code"
              placeholder="Ex: PRD-001"
              [readonly]="isEditMode"
            >
            @if (form.get('code')?.touched && form.get('code')?.errors?.['required']) {
              <span class="error">Le code est requis</span>
            }
          </div>

          <div class="form-group">
            <label for="name">Nom *</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="Nom du produit"
            >
            @if (form.get('name')?.touched && form.get('name')?.errors?.['required']) {
              <span class="error">Le nom est requis</span>
            }
          </div>

          <div class="form-group full-width">
            <label for="description">Description</label>
            <textarea
              id="description"
              formControlName="description"
              placeholder="Description du produit"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="basePrice">Prix de base *</label>
            <input
              id="basePrice"
              type="number"
              step="0.01"
              formControlName="basePrice"
              placeholder="0.00"
            >
            @if (form.get('basePrice')?.touched && form.get('basePrice')?.errors?.['required']) {
              <span class="error">Le prix est requis</span>
            }
            @if (form.get('basePrice')?.touched && form.get('basePrice')?.errors?.['min']) {
              <span class="error">Le prix doit etre positif</span>
            }
          </div>

          <div class="form-group">
            <label for="categoryId">Categorie *</label>
            <select id="categoryId" formControlName="categoryId">
              <option value="">Selectionnez une categorie</option>
              @for (cat of categories; track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
            @if (form.get('categoryId')?.touched && form.get('categoryId')?.errors?.['required']) {
              <span class="error">La categorie est requise</span>
            }
          </div>

          <div class="form-group">
            <label for="status">Statut</label>
            <select id="status" formControlName="status">
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
              <option value="DISCONTINUED">Arrete</option>
              <option value="OUT_OF_STOCK">Rupture de stock</option>
            </select>
          </div>

          <div class="form-group">
            <label for="imageUrl">URL de l'image</label>
            <input
              id="imageUrl"
              type="url"
              formControlName="imageUrl"
              placeholder="https://..."
            >
          </div>

          @if (!isEditMode) {
            <div class="form-group">
              <label for="defaultMinThreshold">Seuil minimum</label>
              <input
                id="defaultMinThreshold"
                type="number"
                formControlName="defaultMinThreshold"
                placeholder="10"
              >
            </div>

            <div class="form-group">
              <label for="defaultMaxThreshold">Seuil maximum</label>
              <input
                id="defaultMaxThreshold"
                type="number"
                formControlName="defaultMaxThreshold"
                placeholder="100"
              >
            </div>
          }
        </div>

        @if (error) {
          <div class="error-message">{{ error }}</div>
        }

        <div class="form-actions">
          <button type="button" class="btn-secondary" routerLink="/products">
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

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
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
    .form-group select,
    .form-group textarea {
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .form-group input[readonly] {
      background: #f9fafb;
      color: #6b7280;
    }

    .form-group textarea {
      resize: vertical;
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

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-group.full-width {
        grid-column: span 1;
      }
    }
  `]
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productFacade = inject(ProductFacade);
  private categoryService = inject(CategoryControllerService);

  form!: FormGroup;
  isEditMode = false;
  productId: number | null = null;
  categories: CategoryDTO[] = [];
  loading = false;
  submitting = false;
  error: string | null = null;

  ngOnInit() {
    this.initForm();
    this.loadCategories();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.productId = +id;
      this.loadProduct(this.productId);
    }
  }

  private initForm() {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      basePrice: [null, [Validators.required, Validators.min(0)]],
      categoryId: ['', Validators.required],
      status: ['ACTIVE'],
      imageUrl: [''],
      defaultMinThreshold: [null],
      defaultMaxThreshold: [null]
    });
  }

  private loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (res: any) => {
        this.categories = res?.data ?? [];
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      }
    });
  }

  private loadProduct(id: number) {
    this.loading = true;
    this.productFacade.getProduct(id).subscribe({
      next: (product) => {
        if (product) {
          this.form.patchValue({
            code: product.code,
            name: product.name,
            description: product.description,
            basePrice: product.basePrice,
            categoryId: product.categoryId,
            status: product.status,
            imageUrl: product.imageUrl
          });
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du produit';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.submitting = true;
    this.error = null;

    if (this.isEditMode && this.productId) {
      const updateData: ProductUpdateDTO = {
        name: this.form.value.name,
        description: this.form.value.description,
        basePrice: this.form.value.basePrice,
        categoryId: +this.form.value.categoryId,
        status: this.form.value.status,
        imageUrl: this.form.value.imageUrl
      };

      this.productFacade.updateProduct(this.productId, updateData).subscribe({
        next: () => {
          this.router.navigate(['/products']);
        },
        error: (err) => {
          this.error = err.message || 'Erreur lors de la modification';
          this.submitting = false;
        }
      });
    } else {
      const createData: ProductCreateDTO = {
        code: this.form.value.code,
        name: this.form.value.name,
        description: this.form.value.description,
        basePrice: this.form.value.basePrice,
        categoryId: +this.form.value.categoryId,
        status: this.form.value.status,
        imageUrl: this.form.value.imageUrl,
        defaultMinThreshold: this.form.value.defaultMinThreshold,
        defaultMaxThreshold: this.form.value.defaultMaxThreshold
      };

      this.productFacade.createProduct(createData).subscribe({
        next: () => {
          this.router.navigate(['/products']);
        },
        error: (err) => {
          this.error = err.message || 'Erreur lors de la creation';
          this.submitting = false;
        }
      });
    }
  }
}
