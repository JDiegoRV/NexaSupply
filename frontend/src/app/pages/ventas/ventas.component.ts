import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface InvProduct {
  id: string; product_id: string; product_name: string;
  product_category: string; quantity: number;
}

interface SaleLineItem {
  product_id: string; product_name: string;
  quantity: number; unit_price: number; max_qty: number;
}

interface SaleDetail {
  id: string; sale_number: string;
  client_name?: string; client_document?: string; sale_type?: string;
  subtotal: number; discount: number; igv: number; total: number;
  payment_method: string; notes?: string; created_at: string;
  items: Array<{ id: string; product_id: string; product_name: string; quantity: number; unit_price: number; subtotal: number }>;
}

interface Summary {
  sales_today: number; sales_month: number;
  total_today: number; total_month: number;
  total_all_time: number; avg_ticket: number;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
<div class="min-h-screen bg-gray-50">
  <!-- NAV -->
  <nav class="bg-white shadow-sm border-b">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <div class="flex items-center gap-3">
          <a routerLink="/dashboard" class="text-blue-600 text-xl font-bold">←</a>
          <span class="text-lg font-semibold text-gray-900">Ventas</span>
        </div>
        @if (view === 'list') {
          <button (click)="openNew()"
            class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
            + Nueva Venta
          </button>
        } @else {
          <button (click)="view = 'list'"
            class="text-gray-500 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
            ← Volver
          </button>
        }
      </div>
    </div>
  </nav>

  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- ══════════ LIST VIEW ══════════ -->
    @if (view === 'list') {
      <!-- Summary cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Ventas Hoy</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ summary.sales_today }}</p>
          <p class="text-sm text-blue-600 font-medium mt-0.5">S/ {{ fmt(summary.total_today) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Ventas Mes</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ summary.sales_month }}</p>
          <p class="text-sm text-blue-600 font-medium mt-0.5">S/ {{ fmt(summary.total_month) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Histórico</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">S/ {{ fmt(summary.total_all_time) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Ticket Promedio</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">S/ {{ fmt(summary.avg_ticket) }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex gap-2 mb-4">
        @for (f of filters; track f.val) {
          <button (click)="period = f.val"
            class="px-3 py-1.5 rounded-full text-xs font-medium transition"
            [class.bg-blue-600]="period === f.val" [class.text-white]="period === f.val"
            [class.bg-white]="period !== f.val" [class.text-gray-600]="period !== f.val"
            [class.border]="period !== f.val" [class.border-gray-200]="period !== f.val">
            {{ f.label }}
          </button>
        }
      </div>

      <!-- Table -->
      @if (loading) {
        <div class="text-center py-16">
          <svg class="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      } @else if (filteredSales.length === 0) {
        <div class="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <span class="text-5xl">🧾</span>
          <h3 class="text-lg font-semibold text-gray-900 mt-4">Sin ventas registradas</h3>
          <p class="text-gray-500 mt-2 text-sm">Registra tu primera venta con el botón "+ Nueva Venta"</p>
        </div>
      } @else {
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="text-left px-4 py-3 font-medium text-gray-500">N° Venta</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-500">Cliente</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-500">Método</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-500">Fecha</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (s of filteredSales; track s.id) {
                  <tr class="hover:bg-gray-50 transition cursor-pointer" (click)="openDetail(s)">
                    <td class="px-4 py-3 font-medium text-blue-600">{{ s.sale_number }}</td>
                    <td class="px-4 py-3 text-gray-700">{{ s.client_name || '—' }}</td>
                    <td class="px-4 py-3">
                      <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {{ paymentLabel(s.payment_method) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right font-semibold text-gray-900">S/ {{ fmt(s.total) }}</td>
                    <td class="px-4 py-3 text-gray-500 text-xs">{{ fmtDate(s.created_at) }}</td>
                    <td class="px-4 py-3 text-gray-400">›</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    }

    <!-- ══════════ NEW SALE VIEW ══════════ -->
    @if (view === 'new') {
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Product picker + items list -->
        <div class="lg:col-span-2 space-y-4">
          <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Agregar productos</h2>
            @if (invLoading) {
              <p class="text-gray-400 text-sm">Cargando inventario...</p>
            } @else if (inventory.length === 0) {
              <div class="text-center py-4">
                <p class="text-gray-500 text-sm">No tienes productos en inventario.</p>
                <a routerLink="/pedidos" class="text-blue-600 text-sm hover:underline">Realiza un pedido primero →</a>
              </div>
            } @else {
              <div class="flex gap-2 flex-wrap sm:flex-nowrap">
                <select [(ngModel)]="selProductId" name="selProduct"
                  class="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">— Seleccionar producto —</option>
                  @for (p of inventory; track p.id) {
                    <option [value]="p.product_id">{{ p.product_name }} ({{ p.quantity }} disp.)</option>
                  }
                </select>
                <input type="number" [(ngModel)]="addQty" name="addQty" min="1"
                  class="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Cant." />
                <input type="number" [(ngModel)]="addPrice" name="addPrice" min="0" step="0.01"
                  class="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Precio S/" />
                <button (click)="addItem()"
                  class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap">
                  + Agregar
                </button>
              </div>
            }
          </div>

          @if (lineItems.length > 0) {
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left px-4 py-2 font-medium text-gray-500">Producto</th>
                    <th class="text-center px-4 py-2 font-medium text-gray-500">Cant.</th>
                    <th class="text-right px-4 py-2 font-medium text-gray-500">Precio unit.</th>
                    <th class="text-right px-4 py-2 font-medium text-gray-500">Subtotal</th>
                    <th class="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (li of lineItems; track $index; let i = $index) {
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-2 font-medium text-gray-900">{{ li.product_name }}</td>
                      <td class="px-4 py-2 text-center text-gray-700">{{ li.quantity }}</td>
                      <td class="px-4 py-2 text-right text-gray-700">S/ {{ fmt(li.unit_price) }}</td>
                      <td class="px-4 py-2 text-right font-semibold">S/ {{ fmt(li.quantity * li.unit_price) }}</td>
                      <td class="px-2 py-2">
                        <button (click)="removeItem(i)" class="text-red-400 hover:text-red-600 text-base leading-none transition">✕</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- Client info -->
          <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Datos del cliente (opcional)</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Nombre del cliente</label>
                <input type="text" [(ngModel)]="clientName" name="clientName"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Juan García" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">DNI / RUC</label>
                <input type="text" [(ngModel)]="clientDoc" name="clientDoc"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="12345678" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Tipo comprobante</label>
                <select [(ngModel)]="saleType" name="saleType"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="boleta">Boleta</option>
                  <option value="factura">Factura</option>
                  <option value="ticket">Ticket</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Método de pago</label>
                <select [(ngModel)]="paymentMethod" name="paymentMethod"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="cash">Efectivo</option>
                  <option value="yape">Yape</option>
                  <option value="plin">Plin</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                </select>
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-medium text-gray-600 mb-1">Notas adicionales</label>
                <textarea [(ngModel)]="notes" name="notes" rows="2"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Observaciones..."></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Totals + submit -->
        <div>
          <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm sticky top-6">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Resumen de venta</h2>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>S/ {{ fmt(newSubtotal) }}</span>
              </div>
              <div class="flex items-center justify-between text-gray-600">
                <span>Descuento</span>
                <div class="flex items-center gap-1">
                  <span class="text-gray-400">S/</span>
                  <input type="number" [(ngModel)]="discount" name="discount" min="0" step="0.01"
                    class="w-20 text-right px-2 py-0.5 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>IGV (18%)</span>
                <span>S/ {{ fmt(newIGV) }}</span>
              </div>
              <div class="flex justify-between font-bold text-gray-900 text-base border-t pt-2 mt-2">
                <span>Total</span>
                <span>S/ {{ fmt(newTotal) }}</span>
              </div>
            </div>

            @if (newError) {
              <div class="mt-4 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs">{{ newError }}</div>
            }

            <button (click)="submitSale()" [disabled]="submitting || lineItems.length === 0"
              class="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
              @if (submitting) {
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Registrando...
              } @else {
                ✅ Registrar Venta
              }
            </button>
            <p class="text-xs text-gray-400 text-center mt-2">Descuenta el stock del inventario automáticamente</p>
          </div>
        </div>
      </div>
    }

    <!-- ══════════ DETAIL VIEW ══════════ -->
    @if (view === 'detail' && currentSale) {
      <!-- Print button -->
      <div class="flex justify-end mb-4 gap-3 no-print">
        <button (click)="printSale()"
          class="bg-gray-700 hover:bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2">
          🖨️ Imprimir / Exportar PDF
        </button>
      </div>

      <!-- Boleta -->
      <div id="boleta-print" class="bg-white rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto p-8">
        <div class="text-center mb-6">
          <p class="text-2xl font-bold text-blue-600">NexaSupply</p>
          <p class="text-sm text-gray-500 mt-1">{{ storeName }}</p>
          <p class="text-xs text-gray-400">{{ storeAddress }}</p>
          <div class="mt-3 inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p class="text-sm font-bold text-blue-700 uppercase">{{ currentSale.sale_type || 'Boleta' }} DE VENTA</p>
            <p class="text-lg font-bold text-blue-900">{{ currentSale.sale_number }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm mb-6 border-t border-b py-4">
          <div>
            <p class="text-gray-500">Fecha</p>
            <p class="font-medium">{{ fmtDate(currentSale.created_at) }}</p>
          </div>
          <div>
            <p class="text-gray-500">Método de pago</p>
            <p class="font-medium">{{ paymentLabel(currentSale.payment_method) }}</p>
          </div>
          @if (currentSale.client_name) {
            <div>
              <p class="text-gray-500">Cliente</p>
              <p class="font-medium">{{ currentSale.client_name }}</p>
            </div>
          }
          @if (currentSale.client_document) {
            <div>
              <p class="text-gray-500">DNI / RUC</p>
              <p class="font-medium">{{ currentSale.client_document }}</p>
            </div>
          }
        </div>

        <table class="w-full text-sm mb-6">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-2 font-medium text-gray-500">Producto</th>
              <th class="text-center py-2 font-medium text-gray-500">Cant.</th>
              <th class="text-right py-2 font-medium text-gray-500">Precio</th>
              <th class="text-right py-2 font-medium text-gray-500">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            @for (item of currentSale.items; track item.id) {
              <tr class="border-b border-gray-100">
                <td class="py-2">{{ item.product_name }}</td>
                <td class="py-2 text-center">{{ item.quantity }}</td>
                <td class="py-2 text-right">S/ {{ fmt(item.unit_price) }}</td>
                <td class="py-2 text-right">S/ {{ fmt(item.subtotal) }}</td>
              </tr>
            }
          </tbody>
        </table>

        <div class="space-y-1 text-sm max-w-xs ml-auto">
          <div class="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>S/ {{ fmt(currentSale.subtotal) }}</span>
          </div>
          @if (currentSale.discount > 0) {
            <div class="flex justify-between text-green-600">
              <span>Descuento</span>
              <span>-S/ {{ fmt(currentSale.discount) }}</span>
            </div>
          }
          <div class="flex justify-between text-gray-600">
            <span>IGV (18%)</span>
            <span>S/ {{ fmt(currentSale.igv) }}</span>
          </div>
          <div class="flex justify-between font-bold text-base border-t pt-2 text-gray-900">
            <span>Total</span>
            <span>S/ {{ fmt(currentSale.total) }}</span>
          </div>
        </div>

        @if (currentSale.notes) {
          <div class="mt-6 bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            <span class="font-medium">Notas: </span>{{ currentSale.notes }}
          </div>
        }

        <div class="text-center mt-8 text-xs text-gray-400 border-t pt-4">
          <p>NexaSupply — Sistema de gestión para bodegas</p>
          <p class="mt-1">Gracias por su compra 🙏</p>
        </div>
      </div>
    }

  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    @media print {
      .no-print { display: none !important; }
      nav { display: none !important; }
      body { background: white !important; }
      #boleta-print { box-shadow: none !important; border: none !important; }
    }
  `]
})
export class VentasComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  view: 'list' | 'new' | 'detail' = 'list';
  loading = true;
  invLoading = false;
  submitting = false;
  newError = '';

  sales: SaleDetail[] = [];
  summary: Summary = { sales_today: 0, sales_month: 0, total_today: 0, total_month: 0, total_all_time: 0, avg_ticket: 0 };
  inventory: InvProduct[] = [];
  currentSale?: SaleDetail;

  // New sale form
  lineItems: SaleLineItem[] = [];
  selProductId = '';
  addQty = 1;
  addPrice = 0;
  clientName = '';
  clientDoc = '';
  saleType = 'boleta';
  paymentMethod = 'cash';
  discount = 0;
  notes = '';

  period = 'all';
  filters = [
    { val: 'today', label: 'Hoy' },
    { val: 'week', label: 'Semana' },
    { val: 'month', label: 'Mes' },
    { val: 'all', label: 'Todo' },
  ];

  storeName = '';
  storeAddress = '';

  ngOnInit(): void {
    const s = localStorage.getItem('nexa_store');
    if (s) { const p = JSON.parse(s); this.storeName = p.name || ''; }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get<Summary>('/sales/summary').subscribe({
      next: (d) => { this.summary = d; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.api.get<SaleDetail[]>('/sales').subscribe({
      next: (d) => { this.sales = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  openNew(): void {
    this.lineItems = [];
    this.selProductId = '';
    this.addQty = 1;
    this.addPrice = 0;
    this.clientName = '';
    this.clientDoc = '';
    this.saleType = 'boleta';
    this.paymentMethod = 'cash';
    this.discount = 0;
    this.notes = '';
    this.newError = '';
    this.view = 'new';
    this.loadInventory();
  }

  loadInventory(): void {
    this.invLoading = true;
    this.api.get<InvProduct[]>('/inventory/').subscribe({
      next: (d) => { this.inventory = d; this.invLoading = false; this.cdr.detectChanges(); },
      error: () => { this.invLoading = false; this.cdr.detectChanges(); }
    });
  }

  addItem(): void {
    if (!this.selProductId) { this.newError = 'Selecciona un producto'; return; }
    if (this.addQty < 1) { this.newError = 'La cantidad debe ser al menos 1'; return; }
    if (this.addPrice <= 0) { this.newError = 'El precio debe ser mayor a 0'; return; }

    const inv = this.inventory.find(p => p.product_id === this.selProductId);
    if (!inv) return;

    const existing = this.lineItems.findIndex(li => li.product_id === this.selProductId);
    const totalQty = existing >= 0 ? this.lineItems[existing].quantity + this.addQty : this.addQty;

    if (totalQty > inv.quantity) {
      this.newError = `Stock insuficiente: ${inv.product_name} solo tiene ${inv.quantity} unidades`;
      return;
    }

    if (existing >= 0) {
      this.lineItems[existing].quantity += this.addQty;
    } else {
      this.lineItems.push({
        product_id: inv.product_id,
        product_name: inv.product_name,
        quantity: this.addQty,
        unit_price: this.addPrice,
        max_qty: inv.quantity,
      });
    }

    this.selProductId = '';
    this.addQty = 1;
    this.addPrice = 0;
    this.newError = '';
    this.cdr.detectChanges();
  }

  removeItem(i: number): void {
    this.lineItems.splice(i, 1);
    this.cdr.detectChanges();
  }

  get newSubtotal(): number {
    return this.lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0);
  }
  get newIGV(): number {
    return Math.round((this.newSubtotal - (this.discount || 0)) * 0.18 * 100) / 100;
  }
  get newTotal(): number {
    return Math.round((this.newSubtotal - (this.discount || 0) + this.newIGV) * 100) / 100;
  }

  submitSale(): void {
    if (this.lineItems.length === 0) { this.newError = 'Agrega al menos un producto'; return; }
    this.submitting = true;
    this.newError = '';

    const body = {
      items: this.lineItems.map(li => ({
        product_id: li.product_id,
        quantity: li.quantity,
        unit_price: li.unit_price,
      })),
      client_name: this.clientName || null,
      client_document: this.clientDoc || null,
      sale_type: this.saleType,
      discount: this.discount,
      payment_method: this.paymentMethod,
      notes: this.notes || null,
    };

    this.api.post<SaleDetail>('/sales', body).subscribe({
      next: (sale) => {
        this.submitting = false;
        this.sales.unshift(sale);
        this.currentSale = sale;
        this.load();
        this.view = 'detail';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.submitting = false;
        this.newError = err.error?.detail || 'Error al registrar la venta';
        this.cdr.detectChanges();
      }
    });
  }

  openDetail(sale: SaleDetail): void {
    this.currentSale = sale;
    this.view = 'detail';
    this.cdr.detectChanges();
  }

  printSale(): void {
    window.print();
  }

  get filteredSales(): SaleDetail[] {
    const now = new Date();
    return this.sales.filter(s => {
      const d = new Date(s.created_at);
      if (this.period === 'today') return d.toDateString() === now.toDateString();
      if (this.period === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (this.period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    });
  }

  fmt(n: number): string {
    return (n || 0).toFixed(2);
  }

  fmtDate(s: string): string {
    return new Date(s).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  paymentLabel(m: string): string {
    const map: Record<string, string> = { cash: 'Efectivo', yape: 'Yape', plin: 'Plin', transfer: 'Transferencia', card: 'Tarjeta' };
    return map[m] || m;
  }
}
