export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  username: string;
  roles: string[];
}

export interface User {
  username: string;
  roles: string[];
  token: string;
}

export const AUTH_STORAGE_KEY = 'auth_user';
export const TOKEN_STORAGE_KEY = 'access_token';
