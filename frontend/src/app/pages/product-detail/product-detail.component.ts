import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface ProductImage {
  id: string; url: string; alt_text?: string; sort_order: number;
}

interface ProductVariant {
  id: string; name: string; price_modifier: number; stock: number;
}

interface Product {
  id: string; name: string; description?: string; price: number;
  category?: string; image_url?: string; stock: number; is_active: boolean;
  images: ProductImage[]; variants: ProductVariant[];
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navbar -->
      <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-3">
              <a routerLink="/productos" class="text-gray-600 hover:text-blue-600 transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </a>
              <a routerLink="/dashboard" class="text-2xl font-bold text-blue-600">NexaSupply</a>
            </div>
            <a routerLink="/carrito" class="text-gray-600 hover:text-blue-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
              </svg>
            </a>
          </div>
        </div>
      </nav>

      @if (loading) {
        <div class="flex items-center justify-center py-32">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      } @else if (error) {
        <div class="max-w-7xl mx-auto px-4 py-16 text-center">
          <span class="text-6xl">😕</span>
          <h2 class="text-2xl font-bold text-gray-900 mt-4">Producto no encontrado</h2>
          <p class="text-gray-500 mt-2">{{ error }}</p>
          <a routerLink="/productos" class="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">Volver al catálogo</a>
        </div>
      } @else if (product) {
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- ZONA SUPERIOR: Gallery + Info -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <!-- Gallery -->
            <div>
              <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
                <div class="aspect-square flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
                  @if (selectedImage) {
                    <img [src]="selectedImage.url" [alt]="selectedImage.alt_text || product.name"
                      class="w-full h-full object-contain" />
                  } @else {
                    <span class="text-8xl">{{ getEmoji(product.category) }}</span>
                  }
                </div>
              </div>
              @if (product.images.length > 1) {
                <div class="flex gap-3 overflow-x-auto pb-2">
                  @for (img of product.images; track img.id) {
                    <button (click)="selectImage(img)"
                      class="shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden transition"
                      [class.border-blue-500]="selectedImage?.id === img.id"
                      [class.border-gray-200]="selectedImage?.id !== img.id">
                      <img [src]="img.url" [alt]="img.alt_text || product.name"
                        class="w-full h-full object-cover" />
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Product Info -->
            <div>
              <span class="inline-block text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3">
                {{ product.category }}
              </span>
              <h1 class="text-3xl font-bold text-gray-900">{{ product.name }}</h1>
              <p class="text-gray-500 mt-3 leading-relaxed">{{ product.description }}</p>

              <!-- Price -->
              <div class="mt-6 flex items-baseline gap-3">
                <span class="text-4xl font-bold text-gray-900">S/ {{ effectivePrice.toFixed(2) }}</span>
                @if (selectedVariant && selectedVariant.price_modifier !== 0) {
                  <span class="text-lg text-gray-400 line-through">S/ {{ product.price.toFixed(2)}}
                    @if (selectedVariant.price_modifier < 0) {
                      <span class="text-sm text-green-600 font-medium ml-2">-{{ (selectedVariant.price_modifier * 100 / product.price).toFixed(0) }}%</span>
                    }
                  </span>
                }
              </div>

              <!-- Margen B2B Calculator -->
              <div class="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                <div class="flex items-center gap-2 text-sm font-medium text-green-800">
                  <span>📊 Calculadora de Margen</span>
                </div>
                <div class="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-green-700">Precio sugerido:</span>
                    <span class="font-semibold text-green-900 ml-1">S/ {{ (effectivePrice * 1.25).toFixed(2) }}</span>
                  </div>
                  <div>
                    <span class="text-green-700">Tu margen:</span>
                    <span class="font-semibold text-green-900 ml-1">{{ (effectivePrice > 0 ? ((effectivePrice * 0.25) / effectivePrice * 100) : 0).toFixed(0) }}%</span>
                  </div>
                  <div>
                    <span class="text-green-700">Ganancia por unidad:</span>
                    <span class="font-semibold text-green-900 ml-1">S/ {{ (effectivePrice * 0.25).toFixed(2) }}</span>
                  </div>
                  <div>
                    <span class="text-green-700">Disponible:</span>
                    <span class="font-semibold text-green-900 ml-1">{{ stockDisplay }} und.</span>
                  </div>
                </div>
              </div>

              <!-- Variants -->
              @if (product.variants.length > 0) {
                <div class="mt-6">
                  <h3 class="text-sm font-semibold text-gray-700 mb-2">Variantes disponibles</h3>
                  <div class="flex flex-wrap gap-2">
                    @for (v of product.variants; track v.id) {
                      <button (click)="selectVariant(v)"
                        class="px-4 py-2 rounded-lg border-2 text-sm font-medium transition"
                        [class.border-blue-500]="selectedVariant?.id === v.id"
                        [class.bg-blue-50]="selectedVariant?.id === v.id"
                        [class.border-gray-200]="selectedVariant?.id !== v.id"
                        [class.hover:border-blue-300]="selectedVariant?.id !== v.id">
                        {{ v.name }}
                        @if (v.price_modifier > 0) {
                          <span class="text-blue-600 ml-1">+S/{{ v.price_modifier.toFixed(2) }}</span>
                        } @else if (v.price_modifier < 0) {
                          <span class="text-green-600 ml-1">-S/{{ Math.abs(v.price_modifier).toFixed(2) }}</span>
                        }
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Quantity + Add to Cart -->
              <div class="mt-8 flex items-center gap-4">
                <div class="flex items-center border border-gray-300 rounded-lg">
                  <button (click)="setQty(quantity - 1)"
                    class="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg transition">−</button>
                  <input type="number" [value]="quantity" (change)="setQty(+$any($event).target.value)"
                    class="w-16 h-10 text-center border-x border-gray-300 text-sm outline-none" min="1" [max]="stockDisplay" />
                  <button (click)="setQty(quantity + 1)"
                    class="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg transition">+</button>
                </div>
                <button (click)="addToCart()"
                  [disabled]="stockDisplay === 0"
                  class="flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition"
                  [class.bg-blue-600]="stockDisplay > 0"
                  [class.text-white]="stockDisplay > 0"
                  [class.hover:bg-blue-700]="stockDisplay > 0"
                  [class.bg-gray-200]="stockDisplay === 0"
                  [class.text-gray-400]="stockDisplay === 0"
                  [class.cursor-not-allowed]="stockDisplay === 0">
                  {{ stockDisplay > 0 ? 'Agregar al carrito' : 'Agotado' }}
                </button>
              </div>

              <!-- Trust signals -->
              <div class="mt-6 flex flex-wrap gap-4 text-sm text-gray-500">
                <span class="flex items-center gap-1">✅ Envío 24h</span>
                <span class="flex items-center gap-1">🔄 Devolución gratis</span>
                <span class="flex items-center gap-1">🔒 Pago seguro</span>
              </div>
            </div>
          </div>

          <!-- ZONA MEDIA: Specs + Cross-selling -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <!-- Specs -->
            <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Especificaciones</h2>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="border-b border-gray-100 pb-3">
                  <span class="text-gray-500">Categoría</span>
                  <p class="font-medium text-gray-900 mt-1">{{ product.category || '—' }}</p>
                </div>
                <div class="border-b border-gray-100 pb-3">
                  <span class="text-gray-500">Precio unitario</span>
                  <p class="font-medium text-gray-900 mt-1">S/ {{ effectivePrice.toFixed(2) }}</p>
                </div>
                <div class="border-b border-gray-100 pb-3">
                  <span class="text-gray-500">Stock disponible</span>
                  <p class="font-medium text-gray-900 mt-1">{{ stockDisplay }} unidades</p>
                </div>
                <div class="border-b border-gray-100 pb-3">
                  <span class="text-gray-500">Margen B2B</span>
                  <p class="font-medium text-green-600 mt-1">{{ (effectivePrice > 0 ? 25 : 0) }}%</p>
                </div>
              </div>
            </div>

            <!-- Related Products (cross-selling) -->
            <div class="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Productos relacionados</h2>
              @if (relatedProducts.length > 0) {
                <div class="space-y-4">
                  @for (r of relatedProducts; track r.id) {
                    <a [routerLink]="'/producto/' + r.id"
                      class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition group">
                      <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0">
                        <span class="text-2xl">{{ getEmoji(r.category) }}</span>
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">{{ r.name }}</p>
                        <p class="text-sm font-semibold text-blue-600 mt-0.5">S/ {{ r.price.toFixed(2) }}</p>
                      </div>
                    </a>
                  }
                </div>
              } @else {
                <p class="text-sm text-gray-400">Cargando...</p>
              }
            </div>
          </div>

          <!-- Toast -->
          @if (toastVisible) {
            <div class="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
              {{ toastMessage }}
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ProductDetailComponent implements OnInit {
  protected Math = Math;

  private route = inject(ActivatedRoute);

  product?: Product;
  relatedProducts: Product[] = [];
  selectedImage?: ProductImage;
  selectedVariant?: ProductVariant;
  quantity = 1;
  loading = true;
  error = '';
  toastVisible = false;
  toastMessage = '';
  private apiBase = environment.apiBaseUrl;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    } else {
      this.error = 'ID de producto no especificado';
      this.loading = false;
    }
  }

  get effectivePrice(): number {
    const base = this.product?.price || 0;
    const modifier = this.selectedVariant?.price_modifier || 0;
    return base + modifier;
  }

  get stockDisplay(): number {
    return this.selectedVariant?.stock ?? this.product?.stock ?? 0;
  }

  async loadProduct(id: string): Promise<void> {
    try {
      const res = await fetch(`${this.apiBase}/products/${id}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Producto no encontrado');
      this.product = await res.json();
      const p = this.product!;
      if (p.images?.length > 0) {
        this.selectedImage = p.images[0];
      }
      if (p.variants?.length > 0) {
        this.selectedVariant = p.variants[0];
      }
      this.loadRelated();
    } catch (e: any) {
      this.error = e.message || 'Error al cargar producto';
    } finally {
      this.loading = false;
    }
  }

  async loadRelated(): Promise<void> {
    if (!this.product?.category) return;
    try {
      const res = await fetch(`${this.apiBase}/products/?category=${encodeURIComponent(this.product.category)}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      const all: Product[] = await res.json();
      this.relatedProducts = all.filter(p => p.id !== this.product!.id).slice(0, 4);
    } catch { /* ignore */ }
  }

  selectImage(img: ProductImage): void {
    this.selectedImage = img;
  }

  selectVariant(v: ProductVariant): void {
    this.selectedVariant = v;
    this.quantity = 1;
  }

  setQty(val: number): void {
    this.quantity = Math.max(1, Math.min(val, this.stockDisplay || 1));
  }

  async addToCart(): Promise<void> {
    const token = localStorage.getItem('nexa_token');
    if (!token) { this.showToast('Inicia sesión para agregar al carrito'); return; }
    try {
      await fetch(`${this.apiBase}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: this.product!.id, quantity: this.quantity }),
      });
      this.showToast(`${this.product!.name} ×${this.quantity} agregado al carrito`);
    } catch {
      this.showToast('Error al agregar al carrito');
    }
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }

  getEmoji(category?: string): string {
    const map: Record<string, string> = {
      'Bebidas': '🥤', 'Snacks': '🍪', 'Lácteos': '🥛',
      'Abarrotes': '📦', 'Limpieza': '🧹', 'Estacional': '🎄',
    };
    return map[category || ''] || '📦';
  }
}
