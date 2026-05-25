import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navbar -->
      <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-3">
              <span class="text-2xl font-bold text-blue-600">◆</span>
              <span class="text-lg font-semibold text-gray-900">NexaSupply</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600">{{ storeName }}</span>
              <button (click)="logout()" class="text-sm text-red-600 hover:text-red-800 font-medium">Cerrar sesión</button>
            </div>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Welcome -->
        <h1 class="text-2xl font-bold text-gray-900 mb-6">Panel de Control</h1>

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Total Productos</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">{{ totalProducts }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Pedidos Totales</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">{{ totalOrders }}</p>
              </div>
              <div class="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Ingresos Totales</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">S/ {{ totalRevenue.toFixed(2) }}</p>
              </div>
              <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <a routerLink="/productos" class="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition flex items-center gap-3">
            <span class="text-2xl">📦</span>
            <div>
              <p class="font-semibold text-gray-900">Catálogo</p>
              <p class="text-sm text-gray-500">Ver productos disponibles</p>
            </div>
          </a>
          <a routerLink="/pedidos" class="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition flex items-center gap-3">
            <span class="text-2xl">📋</span>
            <div>
              <p class="font-semibold text-gray-900">Mis Pedidos</p>
              <p class="text-sm text-gray-500">Seguimiento de órdenes</p>
            </div>
          </a>
          <a routerLink="/inventario" class="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition flex items-center gap-3">
            <span class="text-2xl">📊</span>
            <div>
              <p class="font-semibold text-gray-900">Inventario</p>
              <p class="text-sm text-gray-500">Control de stock</p>
            </div>
          </a>
        </div>

        <!-- Second row quick actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <a routerLink="/ventas" class="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:border-green-300 hover:shadow-md transition flex items-center gap-3">
            <span class="text-2xl">🧾</span>
            <div>
              <p class="font-semibold text-gray-900">Ventas</p>
              <p class="text-sm text-gray-500">Registrar ventas a clientes</p>
            </div>
          </a>
          <a routerLink="/carrito" class="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition flex items-center gap-3">
            <span class="text-2xl">🛒</span>
            <div>
              <p class="font-semibold text-gray-900">Carrito</p>
              <p class="text-sm text-gray-500">Ver mi carrito de compras</p>
            </div>
          </a>
          <a routerLink="/checkout" class="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition flex items-center gap-3">
            <span class="text-2xl">💳</span>
            <div>
              <p class="font-semibold text-gray-900">Checkout</p>
              <p class="text-sm text-gray-500">Procesar pago</p>
            </div>
          </a>
        </div>

        <!-- Recent Orders -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Pedidos Recientes</h2>
          </div>
          <div class="p-6">
            @if (recentOrders.length === 0) {
              <p class="text-gray-500 text-center py-8">No tienes pedidos aún. ¡Empieza a comprar!</p>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-gray-500 border-b">
                      <th class="pb-3 font-medium">N° Pedido</th>
                      <th class="pb-3 font-medium">Total</th>
                      <th class="pb-3 font-medium">Estado</th>
                      <th class="pb-3 font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of recentOrders; track order.id) {
                      <tr class="border-b last:border-0 hover:bg-gray-50">
                        <td class="py-3 font-medium text-blue-600">{{ order.order_number }}</td>
                        <td class="py-3">S/ {{ order.total.toFixed(2) }}</td>
                        <td class="py-3">
                          <span class="px-2 py-1 rounded-full text-xs font-medium"
                            [class.bg-blue-100]="order.tracking_status === 'confirmed'"
                            [class.text-blue-800]="order.tracking_status === 'confirmed'"
                            [class.bg-yellow-100]="order.tracking_status === 'preparing' || order.tracking_status === 'shipped'"
                            [class.text-yellow-800]="order.tracking_status === 'preparing' || order.tracking_status === 'shipped'"
                            [class.bg-green-100]="order.tracking_status === 'delivered'"
                            [class.text-green-800]="order.tracking_status === 'delivered'">
                            {{ order.tracking_status }}
                          </span>
                        </td>
                        <td class="py-3 text-gray-500">{{ order.created_at | date:'shortDate' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class DashboardComponent implements OnInit {
  storeName = '';
  totalProducts = 0;
  totalOrders = 0;
  totalRevenue = 0;
  recentOrders: any[] = [];

  constructor(
    private api: ApiService,
    private authService: AuthService
  ) {}

  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.storeName = this.authService.getStoreName();
    this.loadData();
  }

  loadData(): void {
    console.log('[Dashboard] loadData start');
    // Load products count
    this.api.get<any[]>('/products/').subscribe({
      next: (products) => {
        this.totalProducts = products.length;
        console.log('[Dashboard] totalProducts:', this.totalProducts);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('[Dashboard] products error:', err),
    });

    // Load orders
    this.api.get<any[]>('/orders/').subscribe({
      next: (orders) => {
        console.log('[Dashboard] orders loaded:', orders.length);
        this.recentOrders = orders.slice(0, 5);
        this.totalOrders = orders.length;
        this.totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        this.cdr.detectChanges();
        console.log('[Dashboard] detectChanges after orders. recentOrders:', this.recentOrders.length);
      },
      error: (err) => console.error('[Dashboard] orders error:', err),
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
