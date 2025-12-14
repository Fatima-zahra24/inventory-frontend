import { InjectionToken } from '@angular/core';
import { Configuration } from '../api/product';
import { environment } from '../environments/environment';

export const API_CONFIGURATION = new InjectionToken<Configuration>('API_CONFIGURATION');

export function apiConfigFactory(): Configuration {
  return new Configuration({
    basePath: environment.apiGateway,
    credentials: {
      bearer: () => {
        // Récupérer le token depuis localStorage ou un service
        return localStorage.getItem('access_token') || '';
      }
    }
  });
}
