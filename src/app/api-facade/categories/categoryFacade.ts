import { Injectable, signal } from '@angular/core';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import {
  CategoryControllerService,
  CategoryDTO,
  CategoryCreateDTO,
  CategoryUpdateDTO
} from '../../api/product';

@Injectable({ providedIn: 'root' })
export class CategoryFacade {

  private readonly _categories = signal<CategoryDTO[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly categories = this._categories.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor(private api: CategoryControllerService) {}

  loadCategories() {
    this._loading.set(true);
    this._error.set(null);

    this.api.getAllCategories().subscribe({
      next: (res: any) => {
        this._categories.set(res?.data ?? []);
        this._loading.set(false);
      },
      error: err => {
        console.error('Failed to load categories', err);
        this._error.set(err.message || 'Erreur lors du chargement des categories');
        this._loading.set(false);
        this._categories.set([]);
      }
    });
  }

  getCategory(id: number): Observable<CategoryDTO | null> {
    return this.api.getCategoryById(id).pipe(
      map((res: any) => res?.data ?? null),
      catchError(err => {
        console.error('Failed to load category', err);
        return throwError(() => new Error(err.message || 'Erreur lors du chargement de la categorie'));
      })
    );
  }

  createCategory(data: CategoryCreateDTO): Observable<CategoryDTO> {
    return this.api.createCategory(data).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadCategories()),
      catchError(err => {
        console.error('Failed to create category', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la creation de la categorie'));
      })
    );
  }

  updateCategory(id: number, data: CategoryUpdateDTO): Observable<CategoryDTO> {
    return this.api.updateCategory(id, data).pipe(
      map((res: any) => res?.data),
      tap(() => this.loadCategories()),
      catchError(err => {
        console.error('Failed to update category', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la modification de la categorie'));
      })
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.api.deleteCategory(id).pipe(
      map(() => undefined),
      tap(() => this.loadCategories()),
      catchError(err => {
        console.error('Failed to delete category', err);
        return throwError(() => new Error(err.error?.message || 'Erreur lors de la suppression de la categorie'));
      })
    );
  }
}
