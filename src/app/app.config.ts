import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { apiConfigFactory } from './core/api.config';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { Configuration as ProductConfiguration } from './api/product';
import { Configuration as InventoryConfiguration, BASE_PATH as INVENTORY_BASE_PATH } from './api/inventory';
import { Configuration as SupplierConfiguration, BASE_PATH as SUPPLIER_BASE_PATH } from './api/supplier';
import { environment } from './environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    // Product API Configuration
    {
      provide: ProductConfiguration,
      useFactory: apiConfigFactory
    },
    // Inventory API Configuration
    {
      provide: InventoryConfiguration,
      useFactory: apiConfigFactory
    },
    {
      provide: INVENTORY_BASE_PATH,
      useValue: environment.apiGateway
    },
    // Supplier API Configuration
    {
      provide: SupplierConfiguration,
      useFactory: apiConfigFactory
    },
    {
      provide: SUPPLIER_BASE_PATH,
      useValue: environment.apiGateway
    }
  ]
};
