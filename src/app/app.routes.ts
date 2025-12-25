import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public route - Login
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent),
    canActivate: [noAuthGuard]
  },
  // Protected routes
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      // Products
      {
        path: 'products',
        loadComponent: () => import('./features/products/product-list/product-list.component')
          .then(m => m.ProductListComponent)
      },
      {
        path: 'products/new',
        loadComponent: () => import('./features/products/product-form/product-form.component')
          .then(m => m.ProductFormComponent)
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./features/products/product-form/product-form.component')
          .then(m => m.ProductFormComponent)
      },
      // Categories
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/category-list/category-list.component')
          .then(m => m.CategoryListComponent)
      },
      {
        path: 'categories/new',
        loadComponent: () => import('./features/categories/category-form/category-form.component')
          .then(m => m.CategoryFormComponent)
      },
      {
        path: 'categories/:id',
        loadComponent: () => import('./features/categories/category-form/category-form.component')
          .then(m => m.CategoryFormComponent)
      },
      // Suppliers
      {
        path: 'suppliers',
        loadComponent: () => import('./features/suppliers/supplier-list/supplier-list.component')
          .then(m => m.SupplierListComponent)
      },
      {
        path: 'suppliers/new',
        loadComponent: () => import('./features/suppliers/supplier-form/supplier-form.component')
          .then(m => m.SupplierFormComponent)
      },
      {
        path: 'suppliers/:id',
        loadComponent: () => import('./features/suppliers/supplier-form/supplier-form.component')
          .then(m => m.SupplierFormComponent)
      },
      // Inventory
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory-list/inventory-list.component')
          .then(m => m.InventoryListComponent)
      },
      {
        path: 'inventory/movements',
        loadComponent: () => import('./features/inventory/stock-movement-list/stock-movement-list.component')
          .then(m => m.StockMovementListComponent)
      },
      {
        path: 'inventory/warehouses',
        loadComponent: () => import('./features/inventory/warehouse-list/warehouse-list.component')
          .then(m => m.WarehouseListComponent)
      },
      {
        path: 'inventory/warehouses/:id/inventory',
        loadComponent: () => import('./features/inventory/warehouse-inventory/warehouse-inventory.component')
          .then(m => m.WarehouseInventoryComponent)
      },
      // Orders
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/order-list/order-list.component')
          .then(m => m.OrderListComponent)
      },
      {
        path: 'orders/new',
        loadComponent: () => import('./features/orders/order-create/order-create.component')
          .then(m => m.OrderCreateComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/orders/order-details/order-details.component')
          .then(m => m.OrderDetailsComponent)
      },
      {
        path: 'orders/:id/edit',
        loadComponent: () => import('./features/orders/order-edit/order-edit.component')
          .then(m => m.OrderEditComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
