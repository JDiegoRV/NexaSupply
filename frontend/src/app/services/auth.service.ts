import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { Observable, tap } from 'rxjs';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  store_id: string;
  store_name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private api: ApiService, private router: Router) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', { email, password }).pipe(
      tap((res) => {
        localStorage.setItem('nexa_token', res.access_token);
        localStorage.setItem('nexa_store', JSON.stringify({ id: res.store_id, name: res.store_name }));
      })
    );
  }

  register(data: any): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/register', data).pipe(
      tap((res) => {
        localStorage.setItem('nexa_token', res.access_token);
        localStorage.setItem('nexa_store', JSON.stringify({ id: res.store_id, name: res.store_name }));
      })
    );
  }

  registerWithPayment(data: any): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/subscriptions/checkout', data).pipe(
      tap((res) => {
        localStorage.setItem('nexa_token', res.access_token);
        localStorage.setItem('nexa_store', JSON.stringify({ id: res.store_id, name: res.store_name }));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('nexa_token');
    localStorage.removeItem('nexa_store');
    this.router.navigate(['/']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('nexa_token');
  }

  getStoreName(): string {
    const store = localStorage.getItem('nexa_store');
    return store ? JSON.parse(store).name : '';
  }
}
