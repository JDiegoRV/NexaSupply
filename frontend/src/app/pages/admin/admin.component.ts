import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';

interface AdminStore {
  id: string; name: string; owner_name: string; email: string;
  plan: string; subscription_status: string; created_at: string;
}

interface AdminOrder {
  id: string; order_number: string; store_name?: string;
  total: number; tracking_status: string; created_at: string;
}

interface AdminImage {
  id: string; url: string; alt_text?: string; sort_order: number;
}

interface AdminVariant {
  id: string; name: string; price_modifier: number; stock: number;
}

interface AdminProduct {
  id: string; name: string; description?: string; price: number;
  category?: string; image_url?: string; stock: number; is_active: boolean;
  images: AdminImage[]; variants: AdminVariant[];
}

type View = 'login' | 'dashboard' | 'orders' | 'stores' | 'products' | 'product-form' | 'product-detail';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="min-h-screen bg-gray-900">
      @if (view === 'login') { admin login template }
      @if (view === 'login') {
        <div class="min-h-screen flex items-center justify-center p-4">
          <div class="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8">
            <div class="text-center mb-8">
              <span class="text-4xl">⚙️</span>
              <h1 class="text-2xl font-bold text-white mt-4">Panel Administrativo</h1>
              <p class="text-gray-400 mt-2">NexaSupply Admin</p>
            </div>
            <form (ngSubmit)="adminLogin()" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input type="email" [(ngModel)]="email" name="email" required
                  class="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="admin@nexasupply.store" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input type="password" [(ngModel)]="password" name="password" required
                  class="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="••••••••" />
              </div>
              @if (error) {
                <div class="bg-red-900/50 text-red-400 px-4 py-3 rounded-lg text-sm">{{ error }}</div>
              }
              <button type="submit" [disabled]="loading"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50">
                {{ loading ? 'Ingresando...' : 'Ingresar' }}
              </button>
            </form>
            <p class="text-center text-sm text-gray-500 mt-6">Demo: admin@nexasupply.store / admin123</p>
            <a routerLink="/" class="block text-center text-sm text-blue-400 hover:text-blue-300 mt-4">← Volver al inicio</a>
          </div>
        </div>
      }

      @if (view === 'dashboard') {
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h1 class="text-2xl font-bold text-white">Panel de Administracion</h1>
              <p class="text-gray-400">Gestiona bodegas, pedidos y productos</p>
            </div>
            <div class="flex items-center gap-4">
              <button (click)="view = 'products'" class="text-sm text-blue-400 hover:text-blue-300">Productos</button>
              <button (click)="view = 'orders'" class="text-sm text-blue-400 hover:text-blue-300">Pedidos</button>
              <button (click)="view = 'stores'" class="text-sm text-blue-400 hover:text-blue-300">Bodegas</button>
              <button (click)="logout()" class="text-sm text-red-400 hover:text-red-300">Cerrar sesion</button>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-gray-800 rounded-xl p-6">
              <p class="text-sm text-gray-400">Productos</p>
              <p class="text-3xl font-bold text-white mt-1">{{ products.length }}</p>
            </div>
            <div class="bg-gray-800 rounded-xl p-6">
              <p class="text-sm text-gray-400">Bodegas</p>
              <p class="text-3xl font-bold text-white mt-1">{{ stores.length }}</p>
            </div>
            <div class="bg-gray-800 rounded-xl p-6">
              <p class="text-sm text-gray-400">Pedidos Totales</p>
              <p class="text-3xl font-bold text-white mt-1">{{ orders.length }}</p>
            </div>
            <div class="bg-gray-800 rounded-xl p-6">
              <p class="text-sm text-gray-400">Pedidos Pendientes</p>
              <p class="text-3xl font-bold text-yellow-400 mt-1">{{ pendingOrders }}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button (click)="view = 'products'"
              class="bg-gray-800 rounded-xl p-6 text-left hover:bg-gray-750 transition border border-gray-700 hover:border-blue-500">
              <span class="text-2xl">📦</span>
              <h3 class="text-lg font-semibold text-white mt-2">Gestionar Productos</h3>
              <p class="text-sm text-gray-400">CRUD de productos, imagenes y variantes</p>
            </button>
            <button (click)="view = 'orders'"
              class="bg-gray-800 rounded-xl p-6 text-left hover:bg-gray-750 transition border border-gray-700 hover:border-blue-500">
              <span class="text-2xl">📋</span>
              <h3 class="text-lg font-semibold text-white mt-2">Gestionar Pedidos</h3>
              <p class="text-sm text-gray-400">Ver y actualizar estado de pedidos</p>
            </button>
            <button (click)="view = 'stores'"
              class="bg-gray-800 rounded-xl p-6 text-left hover:bg-gray-750 transition border border-gray-700 hover:border-blue-500">
              <span class="text-2xl">🏪</span>
              <h3 class="text-lg font-semibold text-white mt-2">Bodegas</h3>
              <p class="text-sm text-gray-400">Ver bodegas registradas</p>
            </button>
          </div>
        </div>
      }

      @if (view === 'products') {
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <button (click)="view = 'dashboard'" class="text-blue-400 hover:text-blue-300 text-sm">← Volver al panel</button>
              <h1 class="text-2xl font-bold text-white mt-2">Gestion de Productos</h1>
            </div>
            <button (click)="openNewProduct()"
              class="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">+ Nuevo Producto</button>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-gray-400 border-b border-gray-700 bg-gray-850">
                    <th class="px-6 py-3 font-medium">Producto</th>
                    <th class="px-6 py-3 font-medium">Categoria</th>
                    <th class="px-6 py-3 font-medium">Precio</th>
                    <th class="px-6 py-3 font-medium">Stock</th>
                    <th class="px-6 py-3 font-medium">Imagenes</th>
                    <th class="px-6 py-3 font-medium">Variantes</th>
                    <th class="px-6 py-3 font-medium">Estado</th>
                    <th class="px-6 py-3 font-medium text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of products; track p.id) {
                    <tr class="border-b border-gray-700 last:border-0 hover:bg-gray-750">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                            @if (p.images?.length > 0) {
                              <img [src]="p.images[0].url" class="w-full h-full object-cover" />
                            } @else { <span class="text-lg">📦</span> }
                          </div>
                          <span class="text-white font-medium">{{ p.name }}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-gray-300">{{ p.category || '—' }}</td>
                      <td class="px-6 py-4 text-gray-300">S/ {{ p.price.toFixed(2) }}</td>
                      <td class="px-6 py-4">
                        <span [class.text-green-400]="p.stock > 10" [class.text-yellow-400]="p.stock > 0 && p.stock <= 10" [class.text-red-400]="p.stock === 0">
                          {{ p.stock }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-gray-300">{{ p.images?.length || 0 }}</td>
                      <td class="px-6 py-4 text-gray-300">{{ p.variants?.length || 0 }}</td>
                      <td class="px-6 py-4">
                        <span class="px-2 py-1 rounded-full text-xs font-medium"
                          [class.bg-green-900]="p.is_active" [class.text-green-300]="p.is_active"
                          [class.bg-red-900]="!p.is_active" [class.text-red-300]="!p.is_active">
                          {{ p.is_active ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <div class="flex items-center justify-center gap-2">
                          <button (click)="editProduct(p)" class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition">Editar</button>
                          <button (click)="deleteProduct(p)" class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg transition">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="8" class="px-6 py-8 text-center text-gray-500">No hay productos registrados</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      @if (view === 'product-form') {
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button (click)="cancelProductForm()" class="text-blue-400 hover:text-blue-300 text-sm">← Volver a productos</button>
          <h1 class="text-2xl font-bold text-white mt-2 mb-6">{{ editingProduct ? 'Editar Producto' : 'Nuevo Producto' }}</h1>

          <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                <input type="text" [(ngModel)]="formName" class="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
                <input type="text" [(ngModel)]="formCategory" class="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Bebidas, Snacks" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Precio (S/)</label>
                <input type="number" [(ngModel)]="formPrice" step="0.1" class="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Stock</label>
                <input type="number" [(ngModel)]="formStock" class="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-300 mb-1">Descripcion</label>
                <textarea [(ngModel)]="formDescription" rows="3" class="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
            </div>
            <div class="flex gap-3">
              <button (click)="saveProduct()" [disabled]="saving"
                class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-50">
                {{ saving ? 'Guardando...' : 'Guardar Producto' }}
              </button>
              <button (click)="cancelProductForm()" class="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-2.5 rounded-lg transition">Cancelar</button>
            </div>
          </div>

          <!-- Image management  -->
          @if (editingProduct) {
            <div class="bg-gray-800 rounded-xl border border-gray-700 p-6 mt-6">
              <h2 class="text-lg font-semibold text-white mb-4">Imagenes del Producto</h2>

              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                @for (img of editingProduct.images; track img.id) {
                  <div class="relative group">
                    <div class="aspect-square rounded-lg bg-gray-700 overflow-hidden">
                      <img [src]="img.url" class="w-full h-full object-cover" />
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate rounded-b-lg">
                      {{ img.alt_text || '' }}
                    </div>
                    <button (click)="deleteImage(img)"
                      class="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-lg">×</button>
                  </div>
                } @empty {
                  <div class="col-span-full text-center py-8 text-gray-500">Sin imagenes. Sube una imagen abajo.</div>
                }
              </div>

              <div class="border-t border-gray-700 pt-4">
                <h3 class="text-sm font-medium text-gray-300 mb-3">Subir nueva imagen</h3>
                <div class="flex items-center gap-4">
                  <input type="file" (change)="onImageSelected($event)" accept="image/*"
                    class="text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
                  <input type="text" [(ngModel)]="imageAltText" placeholder="Texto alternativo"
                    class="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  <button (click)="uploadImage()" [disabled]="!selectedFile || uploading"
                    class="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50">
                    {{ uploading ? 'Subiendo...' : 'Subir' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Variants management -->
            <div class="bg-gray-800 rounded-xl border border-gray-700 p-6 mt-6">
              <h2 class="text-lg font-semibold text-white mb-4">Variantes</h2>
              @if (editingProduct.variants.length > 0) {
                <div class="space-y-3 mb-4">
                  @for (v of editingProduct.variants; track v.id) {
                    <div class="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
                      <span class="text-white font-medium flex-1">{{ v.name }}</span>
                      <span class="text-gray-300 text-sm">S/ {{ v.price_modifier >= 0 ? '+' : '' }}{{ v.price_modifier.toFixed(2) }}</span>
                      <span class="text-gray-300 text-sm">Stock: {{ v.stock }}</span>
                      <button (click)="deleteVariant(v)" class="text-red-400 hover:text-red-300 text-sm">Eliminar</button>
                    </div>
                  }
                </div>
              }
              <div class="flex items-center gap-3">
                <input type="text" [(ngModel)]="variantName" placeholder="Nombre (ej: Lata 355ml)"
                  class="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" [(ngModel)]="variantModifier" placeholder="Ajuste S/" step="0.1"
                  class="w-28 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" [(ngModel)]="variantStock" placeholder="Stock"
                  class="w-24 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <button (click)="addVariant()"
                  class="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Agregar</button>
              </div>
            </div>
          }
        </div>
      }

      @if (view === 'orders') {
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <button (click)="view = 'dashboard'" class="text-blue-400 hover:text-blue-300 text-sm">← Volver al panel</button>
              <h1 class="text-2xl font-bold text-white mt-2">Gestion de Pedidos</h1>
            </div>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-400 border-b border-gray-700 bg-gray-850">
                  <th class="px-6 py-3 font-medium">N° Pedido</th>
                  <th class="px-6 py-3 font-medium">Bodega</th>
                  <th class="px-6 py-3 font-medium">Total</th>
                  <th class="px-6 py-3 font-medium">Estado</th>
                  <th class="px-6 py-3 font-medium">Fecha</th>
                  <th class="px-6 py-3 font-medium text-center">Accion</th>
                </tr>
              </thead>
              <tbody>
                @for (order of orders; track order.id) {
                  <tr class="border-b border-gray-700 last:border-0 hover:bg-gray-750">
                    <td class="px-6 py-4 font-medium text-blue-400">{{ order.order_number }}</td>
                    <td class="px-6 py-4 text-gray-300">{{ order.store_name || '—' }}</td>
                    <td class="px-6 py-4 text-gray-300">S/ {{ order.total.toFixed(2) }}</td>
                    <td class="px-6 py-4">
                      <span class="px-2 py-1 rounded-full text-xs font-medium"
                        [class.bg-blue-900]="order.tracking_status === 'pending'"
                        [class.text-blue-300]="order.tracking_status === 'pending'"
                        [class.bg-yellow-900]="order.tracking_status === 'confirmed'"
                        [class.text-yellow-300]="order.tracking_status === 'confirmed'"
                        [class.bg-orange-900]="order.tracking_status === 'shipped'"
                        [class.text-orange-300]="order.tracking_status === 'shipped'"
                        [class.bg-green-900]="order.tracking_status === 'delivered'"
                        [class.text-green-300]="order.tracking_status === 'delivered'">
                        {{ order.tracking_status }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-gray-400">{{ order.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td class="px-6 py-4 text-center">
                      @if (order.tracking_status !== 'delivered') {
                        <button (click)="advanceOrder(order)"
                          class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
                          Avanzar
                        </button>
                      } @else {
                        <span class="text-xs text-gray-500">Completado</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No hay pedidos registrados</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (view === 'stores') {
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <button (click)="view = 'dashboard'" class="text-blue-400 hover:text-blue-300 text-sm">← Volver al panel</button>
              <h1 class="text-2xl font-bold text-white mt-2">Bodegas Registradas</h1>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (store of stores; track store.id) {
              <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div class="flex items-center justify-between mb-4">
                  <span class="text-2xl">🏪</span>
                  <span class="px-2 py-1 rounded-full text-xs font-medium"
                    [class.bg-green-900]="store.subscription_status === 'active'"
                    [class.text-green-300]="store.subscription_status === 'active'"
                    [class.bg-red-900]="store.subscription_status !== 'active'"
                    [class.text-red-300]="store.subscription_status !== 'active'">
                    {{ store.subscription_status }}
                  </span>
                </div>
                <h3 class="text-lg font-semibold text-white">{{ store.name }}</h3>
                <p class="text-sm text-gray-400 mt-1">{{ store.owner_name }}</p>
                <div class="mt-4 space-y-1 text-sm text-gray-400">
                  <p>📧 {{ store.email }}</p>
                  <p>📋 Plan: {{ store.plan }}</p>
                  <p>📅 {{ store.created_at | date:'dd/MM/yyyy' }}</p>
                </div>
              </div>
            } @empty {
              <div class="col-span-full text-center py-12"><p class="text-gray-500">No hay bodegas registradas</p></div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .bg-gray-850 { background-color: rgb(26, 32, 44); }
    .hover\\:bg-gray-750:hover { background-color: rgb(47, 55, 70); }
  `]
})
export class AdminComponent implements OnInit {
  view: View = 'login';

  // Login
  email = '';
  password = '';
  loading = false;
  error = '';

  // Data
  stores: AdminStore[] = [];
  orders: AdminOrder[] = [];
  products: AdminProduct[] = [];

  // Product form
  editingProduct: AdminProduct | null = null;
  formName = '';
  formDescription = '';
  formPrice = 0;
  formCategory = '';
  formStock = 0;
  saving = false;

  // Image upload
  selectedFile: File | null = null;
  imageAltText = '';
  uploading = false;

  // Variant form
  variantName = '';
  variantModifier = 0;
  variantStock = 0;

  private apiBase = '/api';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('nexa_token');
    if (token) this.loadData();
  }

  get totalRevenue(): number { return this.orders.reduce((sum, o) => sum + (o.total || 0), 0); }
  get pendingOrders(): number { return this.orders.filter(o => o.tracking_status !== 'delivered').length; }

  adminLogin(): void {
    if (!this.email || !this.password) { this.error = 'Ingresa email y contrasena'; return; }
    this.loading = true;
    this.error = '';
    this.api.post<any>('/admin/login', { email: this.email, password: this.password }).subscribe({
      next: (res) => {
        localStorage.setItem('nexa_token', res.access_token);
        this.loading = false;
        this.loadData();
      },
      error: (err) => { this.loading = false; this.error = err.error?.detail || 'Credenciales invalidas'; }
    });
  }

  loadData(): void {
    this.view = 'dashboard';
    this.api.get<AdminStore[]>('/admin/stores').subscribe({ next: (data) => this.stores = data });
    this.api.get<AdminOrder[]>('/admin/orders').subscribe({ next: (data) => this.orders = data });
    this.api.get<AdminProduct[]>('/admin/products').subscribe({ next: (data) => this.products = data });
  }

  // ── Orders ──
  advanceOrder(order: AdminOrder): void {
    this.api.post<any>(`/admin/orders/${order.id}/advance`, {}).subscribe({
      next: () => this.api.get<AdminOrder[]>('/admin/orders').subscribe({ next: (data) => this.orders = data }),
      error: (err) => alert(err.error?.detail || 'Error al avanzar el pedido')
    });
  }

  // ── Products ──
  openNewProduct(): void {
    this.editingProduct = null;
    this.formName = ''; this.formDescription = ''; this.formPrice = 0; this.formCategory = ''; this.formStock = 0;
    this.variantName = ''; this.variantModifier = 0; this.variantStock = 0;
    this.view = 'product-form';
  }

  editProduct(p: AdminProduct): void {
    this.editingProduct = { ...p, images: [...p.images], variants: [...p.variants] };
    this.formName = p.name; this.formDescription = p.description || ''; this.formPrice = p.price;
    this.formCategory = p.category || ''; this.formStock = p.stock;
    this.variantName = ''; this.variantModifier = 0; this.variantStock = 0;
    this.selectedFile = null; this.imageAltText = '';
    this.view = 'product-form';
  }

  cancelProductForm(): void {
    this.view = 'products';
    this.editingProduct = null;
    this.api.get<AdminProduct[]>('/admin/products').subscribe({ next: (data) => this.products = data });
  }

  saveProduct(): void {
    this.saving = true;
    const body = { name: this.formName, description: this.formDescription, price: this.formPrice, category: this.formCategory, stock: this.formStock };

    if (this.editingProduct) {
      this.api.put<any>(`/admin/products/${this.editingProduct.id}`, body).subscribe({
        next: () => { this.saving = false; this.cancelProductForm(); },
        error: (e) => { this.saving = false; alert('Error al guardar'); }
      });
    } else {
      this.api.post<any>('/admin/products', body).subscribe({
        next: (res) => {
          this.editingProduct = { ...res, images: [], variants: [], description: this.formDescription, category: this.formCategory, stock: this.formStock, price: this.formPrice, is_active: true, image_url: '' };
          this.saving = false;
        },
        error: (e) => { this.saving = false; alert('Error al crear'); }
      });
    }
  }

  deleteProduct(p: AdminProduct): void {
    if (!confirm(`Eliminar "${p.name}"?`)) return;
    this.api.delete<any>(`/admin/products/${p.id}`).subscribe({
      next: () => { this.products = this.products.filter(x => x.id !== p.id); },
      error: (e) => alert('Error al eliminar')
    });
  }

  // ── Images ──
  onImageSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) this.selectedFile = file;
  }

  async uploadImage(): Promise<void> {
    if (!this.selectedFile || !this.editingProduct) return;
    this.uploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    if (this.imageAltText) formData.append('alt_text', this.imageAltText);

    try {
      const token = localStorage.getItem('nexa_token');
      const res = await fetch(`${this.apiBase}/admin/products/${this.editingProduct.id}/images`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const img = await res.json();
      this.editingProduct.images.push(img);
      this.selectedFile = null;
      this.imageAltText = '';
    } catch (e) {
      alert('Error al subir imagen');
    } finally {
      this.uploading = false;
    }
  }

  deleteImage(img: AdminImage): void {
    if (!this.editingProduct || !confirm('Eliminar esta imagen?')) return;
    this.api.delete<any>(`/admin/products/${this.editingProduct.id}/images/${img.id}`).subscribe({
      next: () => { this.editingProduct!.images = this.editingProduct!.images.filter(x => x.id !== img.id); },
      error: () => alert('Error al eliminar imagen')
    });
  }

  // ── Variants ──
  addVariant(): void {
    if (!this.editingProduct || !this.variantName) return;
    this.api.post<any>(`/admin/products/${this.editingProduct.id}/variants`, {
      name: this.variantName, price_modifier: this.variantModifier, stock: this.variantStock
    }).subscribe({
      next: (v) => {
        this.editingProduct!.variants.push(v);
        this.variantName = ''; this.variantModifier = 0; this.variantStock = 0;
      },
      error: () => alert('Error al agregar variante')
    });
  }

  deleteVariant(v: AdminVariant): void {
    if (!this.editingProduct || !confirm(`Eliminar variante "${v.name}"?`)) return;
    this.api.delete<any>(`/admin/products/${this.editingProduct.id}/variants/${v.id}`).subscribe({
      next: () => { this.editingProduct!.variants = this.editingProduct!.variants.filter(x => x.id !== v.id); },
      error: () => alert('Error al eliminar variante')
    });
  }

  logout(): void {
    localStorage.removeItem('nexa_token');
    this.view = 'login';
    this.email = ''; this.password = '';
  }
}
