import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  quantity: number;
  min_stock?: number;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm border-b">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-3">
              <a routerLink="/dashboard" class="text-2xl font-bold text-blue-600">←</a>
              <span class="text-lg font-semibold text-gray-900">Inventario</span>
            </div>
            <a routerLink="/ventas"
              class="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
              🧾 Ir a Ventas
            </a>
          </div>
        </div>
      </nav>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p class="text-sm font-medium text-gray-500">Total Productos</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ inventory.length }}</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p class="text-sm font-medium text-gray-500">Stock Total</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ totalStock }}</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            [class.border-red-300]="lowStockCount > 0">
            <p class="text-sm font-medium text-gray-500">Stock Bajo</p>
            <p class="text-2xl font-bold mt-1"
              [class.text-red-600]="lowStockCount > 0"
              [class.text-gray-900]="lowStockCount === 0">
              {{ lowStockCount }}
            </p>
          </div>
        </div>

        @if (loading) {
          <div class="text-center py-12">
            <svg class="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <p class="text-gray-500 mt-4">Cargando inventario...</p>
          </div>
        } @else if (inventory.length === 0) {
          <div class="text-center py-16">
            <span class="text-6xl">📊</span>
            <h2 class="text-xl font-semibold text-gray-900 mt-4">Sin productos en inventario</h2>
            <p class="text-gray-500 mt-2">Aún no hay productos registrados</p>
          </div>
        } @else {
          <!-- Inventory Table -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left px-4 py-3 font-medium text-gray-500">Producto</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-500">Categoría</th>
                    <th class="text-right px-4 py-3 font-medium text-gray-500">Stock</th>
                    <th class="text-center px-4 py-3 font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  @for (item of inventory; track item.id) {
                    <tr class="hover:bg-gray-50 transition"
                      [class.bg-red-50]="item.quantity <= (item.min_stock || 5)">
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                          <span class="text-lg">📦</span>
                          <span class="font-medium text-gray-900">{{ item.product_name }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-gray-500">{{ item.product_category || '—' }}</td>
                      <td class="px-4 py-3 text-right">
                        <span class="font-semibold"
                          [class.text-red-600]="item.quantity <= (item.min_stock || 5)"
                          [class.text-gray-900]="item.quantity > (item.min_stock || 5)">
                          {{ item.quantity }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-center">
                        @if (item.quantity <= (item.min_stock || 5)) {
                          <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <span class="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            Stock bajo
                          </span>
                        } @else if (item.quantity <= (item.min_stock || 5) * 2) {
                          <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <span class="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                            Medio
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Suficiente
                          </span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class InventoryComponent implements OnInit {
  inventory: InventoryItem[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadInventory();
  }

  get totalStock(): number {
    return this.inventory.reduce((sum, i) => sum + i.quantity, 0);
  }

  get lowStockCount(): number {
    return this.inventory.filter(i => i.quantity <= (i.min_stock || 5)).length;
  }

  loadInventory(): void {
    console.log('[Inventory] loadInventory start');
    this.api.get<InventoryItem[]>('/inventory/').subscribe({
      next: (data) => {
        this.inventory = data;
        this.loading = false;
        console.log('[Inventory] loaded:', data.length);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('[Inventory] error:', err);
        this.cdr.detectChanges();
      }
    });
  }
}
