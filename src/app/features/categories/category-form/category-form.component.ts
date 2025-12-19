import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoryFacade } from '../../../api-facade/categories/categoryFacade';
import { CategoryCreateDTO, CategoryUpdateDTO } from '../../../api/product';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-container">
      <header class="header">
        <button class="back-btn" routerLink="/categories">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1>{{ isEditMode ? 'Modifier la categorie' : 'Nouvelle categorie' }}</h1>
          <p class="subtitle">{{ isEditMode ? 'Modifiez les informations de la categorie' : 'Remplissez les informations de la categorie' }}</p>
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
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>

        <div class="form-fields">
          <div class="form-group">
            <label for="name">Nom de la categorie *</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="Ex: Electronique, Vetements, Alimentation..."
            >
            @if (form.get('name')?.touched && form.get('name')?.errors?.['required']) {
              <span class="error">Le nom est requis</span>
            }
            @if (form.get('name')?.touched && form.get('name')?.errors?.['minlength']) {
              <span class="error">Le nom doit contenir au moins 2 caracteres</span>
            }
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              formControlName="description"
              placeholder="Decrivez cette categorie de produits..."
              rows="4"
            ></textarea>
            <span class="hint">Optionnel - Ajoutez une description pour mieux identifier cette categorie</span>
          </div>
        </div>

        @if (error) {
          <div class="error-message">{{ error }}</div>
        }

        <div class="form-actions">
          <button type="button" class="btn-secondary" routerLink="/categories">
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
      max-width: 600px;
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
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 32px;
      color: #d97706;
    }

    .form-icon svg {
      width: 40px;
      height: 40px;
    }

    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
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

    .form-group textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-group .error {
      font-size: 12px;
      color: #dc2626;
    }

    .form-group .hint {
      font-size: 12px;
      color: #9ca3af;
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
  `]
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private categoryFacade = inject(CategoryFacade);

  form!: FormGroup;
  isEditMode = false;
  categoryId: number | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;

  ngOnInit() {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.categoryId = +id;
      this.loadCategory(this.categoryId);
    }
  }

  private initForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });
  }

  private loadCategory(id: number) {
    this.loading = true;
    this.categoryFacade.getCategory(id).subscribe({
      next: (category) => {
        if (category) {
          this.form.patchValue({
            name: category.name,
            description: category.description
          });
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de la categorie';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.submitting = true;
    this.error = null;

    if (this.isEditMode && this.categoryId) {
      const updateData: CategoryUpdateDTO = {
        name: this.form.value.name,
        description: this.form.value.description
      };

      this.categoryFacade.updateCategory(this.categoryId, updateData).subscribe({
        next: () => {
          this.router.navigate(['/categories']);
        },
        error: (err) => {
          this.error = err.message || 'Erreur lors de la modification';
          this.submitting = false;
        }
      });
    } else {
      const createData: CategoryCreateDTO = {
        name: this.form.value.name,
        description: this.form.value.description
      };

      this.categoryFacade.createCategory(createData).subscribe({
        next: () => {
          this.router.navigate(['/categories']);
        },
        error: (err) => {
          this.error = err.message || 'Erreur lors de la creation';
          this.submitting = false;
        }
      });
    }
  }
}
