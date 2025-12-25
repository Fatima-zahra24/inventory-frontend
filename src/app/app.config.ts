import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr);
import { routes } from './app.routes';
import { apiConfigFactory } from './core/api.config';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { Configuration as ProductConfiguration } from './api/product';
import { Configuration as OrderConfiguration } from './api/order';
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
    provideCharts(withDefaultRegisterables()),
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
    // Inventory API Configuration
    {
      provide: OrderConfiguration,
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
