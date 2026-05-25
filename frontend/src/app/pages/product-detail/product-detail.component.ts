import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface ProductImage { id: string; url: string; alt_text?: string; sort_order: number; }
interface ProductVariant { id: string; name: string; price_modifier: number; stock: number; }
interface Product {
  id: string; name: string; description?: string; price: number;
  category?: string; image_url?: string; stock: number; is_active: boolean;
  images: ProductImage[]; variants: ProductVariant[];
}
interface Review {
  id: string; store_name: string; rating: number; comment?: string; created_at: string;
}
interface ReviewStats {
  average_rating: number; total_reviews: number;
  distribution: Record<string, number>;
}
interface MyOrder {
  id: string; order_number: string; tracking_status: string;
  items: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number }>;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
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
            <a routerLink="/carrito" class="relative text-gray-600 hover:text-blue-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
              </svg>
              @if (cartCount > 0) {
                <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{{ cartCount }}</span>
              }
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

          <!-- Product main section -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <!-- Images -->
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

            <!-- Info -->
            <div>
              <span class="inline-block text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3">
                {{ product.category }}
              </span>
              <h1 class="text-3xl font-bold text-gray-900">{{ product.name }}</h1>
              <p class="text-gray-500 mt-3 leading-relaxed">{{ product.description }}</p>

              <!-- Rating preview -->
              @if (reviewStats.total_reviews > 0) {
                <div class="flex items-center gap-2 mt-3">
                  <div class="flex">
                    @for (s of [1,2,3,4,5]; track s) {
                      <span class="text-lg" [class.text-yellow-400]="s <= reviewStats.average_rating" [class.text-gray-200]="s > reviewStats.average_rating">★</span>
                    }
                  </div>
                  <span class="text-sm font-semibold text-gray-700">{{ reviewStats.average_rating.toFixed(1) }}</span>
                  <span class="text-sm text-gray-400">({{ reviewStats.total_reviews }} opiniones)</span>
                </div>
              }

              <div class="mt-6 flex items-baseline gap-3">
                <span class="text-4xl font-bold text-gray-900">S/ {{ effectivePrice.toFixed(2) }}</span>
                @if (selectedVariant && selectedVariant.price_modifier !== 0) {
                  <span class="text-lg text-gray-400 line-through">S/ {{ product.price.toFixed(2) }}</span>
                }
              </div>

              <div class="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                <div class="flex items-center gap-2 text-sm font-medium text-green-800 mb-2">
                  <span>Calculadora de Margen</span>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div><span class="text-green-700">Precio sugerido:</span><span class="font-semibold text-green-900 ml-1">S/ {{ (effectivePrice * 1.25).toFixed(2) }}</span></div>
                  <div><span class="text-green-700">Tu margen:</span><span class="font-semibold text-green-900 ml-1">25%</span></div>
                  <div><span class="text-green-700">Ganancia por unidad:</span><span class="font-semibold text-green-900 ml-1">S/ {{ (effectivePrice * 0.25).toFixed(2) }}</span></div>
                  <div><span class="text-green-700">Disponible:</span><span class="font-semibold text-green-900 ml-1">{{ stockDisplay }} und.</span></div>
                </div>
              </div>

              @if (product.variants.length > 0) {
                <div class="mt-6">
                  <h3 class="text-sm font-semibold text-gray-700 mb-2">Variantes disponibles</h3>
                  <div class="flex flex-wrap gap-2">
                    @for (v of product.variants; track v.id) {
                      <button (click)="selectVariant(v)"
                        class="px-4 py-2 rounded-lg border-2 text-sm font-medium transition"
                        [class.border-blue-500]="selectedVariant?.id === v.id"
                        [class.bg-blue-50]="selectedVariant?.id === v.id"
                        [class.border-gray-200]="selectedVariant?.id !== v.id">
                        {{ v.name }}
                        @if (v.price_modifier > 0) { <span class="text-blue-600 ml-1">+S/{{ v.price_modifier.toFixed(2) }}</span> }
                        @if (v.price_modifier < 0) { <span class="text-green-600 ml-1">-S/{{ (0 - v.price_modifier).toFixed(2) }}</span> }
                      </button>
                    }
                  </div>
                </div>
              }

              <div class="mt-8 flex items-center gap-4">
                <div class="flex items-center border border-gray-300 rounded-lg">
                  <button (click)="qty = Math.max(1, qty - 1)" class="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg transition">−</button>
                  <input type="number" [(ngModel)]="qty" class="w-16 h-10 text-center border-x border-gray-300 text-sm outline-none" min="1" [max]="stockDisplay" />
                  <button (click)="qty = Math.min(stockDisplay || 1, qty + 1)" class="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg transition">+</button>
                </div>
                <button (click)="addToCart()"
                  [disabled]="stockDisplay === 0"
                  class="flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition"
                  [class.bg-blue-600]="stockDisplay > 0" [class.text-white]="stockDisplay > 0"
                  [class.hover:bg-blue-700]="stockDisplay > 0"
                  [class.bg-gray-200]="stockDisplay === 0" [class.text-gray-400]="stockDisplay === 0"
                  [class.cursor-not-allowed]="stockDisplay === 0">
                  {{ stockDisplay > 0 ? 'Agregar al carrito' : 'Agotado' }}
                </button>
              </div>

              <div class="mt-6 flex flex-wrap gap-4 text-sm text-gray-500">
                <span>✅ Envío 24h</span>
                <span>🔄 Devolución gratis</span>
                <span>🔒 Pago seguro</span>
              </div>
            </div>
          </div>

          <!-- Specs + Related -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Especificaciones</h2>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="border-b border-gray-100 pb-3"><span class="text-gray-500">Categoría</span><p class="font-medium text-gray-900 mt-1">{{ product.category || '—' }}</p></div>
                <div class="border-b border-gray-100 pb-3"><span class="text-gray-500">Precio unitario</span><p class="font-medium text-gray-900 mt-1">S/ {{ effectivePrice.toFixed(2) }}</p></div>
                <div class="border-b border-gray-100 pb-3"><span class="text-gray-500">Stock disponible</span><p class="font-medium text-gray-900 mt-1">{{ stockDisplay }} unidades</p></div>
                <div class="border-b border-gray-100 pb-3"><span class="text-gray-500">Margen B2B</span><p class="font-medium text-green-600 mt-1">25%</p></div>
              </div>
            </div>
            <div class="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Productos relacionados</h2>
              @if (relatedProducts.length > 0) {
                <div class="space-y-4">
                  @for (r of relatedProducts; track r.id) {
                    <a [routerLink]="'/producto/' + r.id" class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition group">
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
              }
            </div>
          </div>

          <!-- ══ REVIEWS SECTION ══ -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 class="text-xl font-bold text-gray-900 mb-6">⭐ Opiniones de otros bodegueros</h2>

            @if (reviewsLoading) {
              <div class="text-center py-8 text-gray-400">Cargando opiniones...</div>
            } @else {
              <!-- Stats bar -->
              @if (reviewStats.total_reviews > 0) {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <!-- Average -->
                  <div class="flex items-center gap-4">
                    <div class="text-center">
                      <p class="text-5xl font-extrabold text-gray-900">{{ reviewStats.average_rating.toFixed(1) }}</p>
                      <div class="flex justify-center mt-1">
                        @for (s of [1,2,3,4,5]; track s) {
                          <span class="text-2xl" [class.text-yellow-400]="s <= reviewStats.average_rating" [class.text-gray-200]="s > reviewStats.average_rating">★</span>
                        }
                      </div>
                      <p class="text-xs text-gray-400 mt-1">{{ reviewStats.total_reviews }} opiniones</p>
                    </div>
                  </div>
                  <!-- Distribution -->
                  <div class="space-y-1.5">
                    @for (s of [5,4,3,2,1]; track s) {
                      <div class="flex items-center gap-2 text-xs">
                        <span class="w-3 text-gray-500 text-right">{{ s }}</span>
                        <span class="text-yellow-400">★</span>
                        <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div class="bg-yellow-400 h-full rounded-full transition-all"
                            [style.width.%]="reviewStats.total_reviews > 0 ? (reviewStats.distribution[s.toString()] || 0) / reviewStats.total_reviews * 100 : 0">
                          </div>
                        </div>
                        <span class="w-4 text-gray-500">{{ reviewStats.distribution[s.toString()] || 0 }}</span>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="text-center py-4 text-gray-400 text-sm mb-6">
                  Aún no hay opiniones para este producto. ¡Sé el primero en opinar!
                </div>
              }

              <!-- Write review (logged-in only) -->
              @if (isLoggedIn) {
                @if (!showReviewForm && !myReview) {
                  <div class="flex justify-start mb-6">
                    <button (click)="showReviewForm = true"
                      class="bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-800 font-semibold text-sm px-4 py-2 rounded-lg transition">
                      ✍️ Escribir una opinión
                    </button>
                  </div>
                }
                @if (myReview) {
                  <div class="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-700">
                    ✅ Ya dejaste tu opinión sobre este producto.
                  </div>
                }
                @if (showReviewForm) {
                  <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
                    <h3 class="font-semibold text-gray-900 mb-4 text-sm">Tu opinión</h3>
                    <!-- Star selector -->
                    <div class="flex items-center gap-1 mb-3">
                      @for (s of [1,2,3,4,5]; track s) {
                        <button (click)="reviewRating = s" (mouseover)="hoverRating = s" (mouseleave)="hoverRating = 0"
                          class="text-3xl transition focus:outline-none">
                          <span [class.text-yellow-400]="s <= (hoverRating || reviewRating)" [class.text-gray-200]="s > (hoverRating || reviewRating)">★</span>
                        </button>
                      }
                      <span class="ml-2 text-sm text-gray-500">{{ ratingLabel(hoverRating || reviewRating) }}</span>
                    </div>

                    <!-- Order selector -->
                    @if (deliveredOrders.length > 0) {
                      <div class="mb-3">
                        <label class="block text-xs font-medium text-gray-600 mb-1">Pedido asociado *</label>
                        <select [(ngModel)]="reviewOrderId" name="reviewOrder"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 outline-none">
                          <option value="">— Selecciona un pedido —</option>
                          @for (o of deliveredOrders; track o.id) {
                            <option [value]="o.id">{{ o.order_number }}</option>
                          }
                        </select>
                      </div>
                    } @else {
                      <p class="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-3">
                        ⚠️ Solo puedes opinar sobre productos que hayas recibido en un pedido entregado.
                      </p>
                    }

                    <textarea [(ngModel)]="reviewComment" name="reviewComment" rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 outline-none resize-none"
                      placeholder="Cuéntanos tu experiencia con este producto... (opcional)">
                    </textarea>

                    @if (reviewError) {
                      <p class="text-xs text-red-600 mt-2">{{ reviewError }}</p>
                    }

                    <div class="flex gap-2 mt-3">
                      <button (click)="showReviewForm = false; reviewError = ''"
                        class="px-4 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                        Cancelar
                      </button>
                      <button (click)="submitReview()" [disabled]="submittingReview || reviewRating === 0"
                        class="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                        @if (submittingReview) { Enviando... } @else { Publicar opinión }
                      </button>
                    </div>
                  </div>
                }
              }

              <!-- Reviews list -->
              @if (reviews.length > 0) {
                <div class="space-y-4">
                  @for (r of reviews; track r.id) {
                    <div class="border-b border-gray-100 pb-4 last:border-0">
                      <div class="flex items-start justify-between mb-1">
                        <div class="flex items-center gap-2">
                          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                            {{ r.store_name.charAt(0).toUpperCase() }}
                          </div>
                          <div>
                            <p class="text-sm font-semibold text-gray-900">{{ r.store_name }}</p>
                            <div class="flex items-center gap-1">
                              @for (s of [1,2,3,4,5]; track s) {
                                <span class="text-sm" [class.text-yellow-400]="s <= r.rating" [class.text-gray-200]="s > r.rating">★</span>
                              }
                            </div>
                          </div>
                        </div>
                        <span class="text-xs text-gray-400">{{ timeAgo(r.created_at) }}</span>
                      </div>
                      @if (r.comment) {
                        <p class="text-sm text-gray-600 mt-2 ml-10 leading-relaxed">"{{ r.comment }}"</p>
                      }
                    </div>
                  }
                </div>
              }
            }
          </div>

        </div>
      }
    </div>

    @if (toastVisible) {
      <div class="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
        {{ toastMessage }}
      </div>
    }
  `,
  styles: [`:host { display: block; }`]
})
export class ProductDetailComponent implements OnInit {
  protected Math = Math;

  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  product?: Product;
  relatedProducts: Product[] = [];
  selectedImage?: ProductImage;
  selectedVariant?: ProductVariant;
  qty = 1;
  loading = true;
  error = '';
  toastVisible = false;
  toastMessage = '';
  cartCount = 0;

  // Reviews
  reviews: Review[] = [];
  reviewStats: ReviewStats = { average_rating: 0, total_reviews: 0, distribution: {} };
  reviewsLoading = true;
  showReviewForm = false;
  reviewRating = 0;
  hoverRating = 0;
  reviewComment = '';
  reviewOrderId = '';
  reviewError = '';
  submittingReview = false;
  myReview: Review | null = null;
  deliveredOrders: MyOrder[] = [];
  isLoggedIn = false;

  ngOnInit(): void {
    this.isLoggedIn = !!localStorage.getItem('nexa_token');
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
      this.loadCartCount();
    } else {
      this.error = 'ID de producto no especificado';
      this.loading = false;
    }
  }

  get effectivePrice(): number {
    return (this.product?.price || 0) + (this.selectedVariant?.price_modifier || 0);
  }

  get stockDisplay(): number {
    return this.selectedVariant?.stock ?? this.product?.stock ?? 0;
  }

  loadProduct(id: string): void {
    this.api.get<Product>(`/products/${id}`).subscribe({
      next: (p) => {
        this.product = p;
        if (p.images?.length > 0) this.selectedImage = p.images[0];
        if (p.variants?.length > 0) this.selectedVariant = p.variants[0];
        this.loading = false;
        this.cdr.detectChanges();
        this.loadRelated(p.category);
        this.loadReviews(id);
        if (this.isLoggedIn) this.loadDeliveredOrders(id);
      },
      error: () => {
        this.error = 'Error al cargar producto';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRelated(category?: string): void {
    if (!category) return;
    this.api.get<Product[]>(`/products/?category=${encodeURIComponent(category)}`).subscribe({
      next: (all) => { this.relatedProducts = all.filter(r => r.id !== this.product!.id).slice(0, 4); }
    });
  }

  loadReviews(productId: string): void {
    this.reviewsLoading = true;
    this.api.get<Review[]>(`/reviews/product/${productId}`).subscribe({
      next: (data) => {
        this.reviews = data;
        this.reviewsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.reviewsLoading = false; this.cdr.detectChanges(); }
    });
    this.api.get<ReviewStats>(`/reviews/product/${productId}/stats`).subscribe({
      next: (s) => { this.reviewStats = s; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  loadDeliveredOrders(productId: string): void {
    this.api.get<MyOrder[]>('/orders/my').subscribe({
      next: (orders) => {
        const store = localStorage.getItem('nexa_store');
        const storeId = store ? JSON.parse(store).id : null;
        this.deliveredOrders = orders.filter(o =>
          o.tracking_status === 'delivered' &&
          o.items.some(i => i.product_id === productId)
        );
        // Check if already reviewed by this store
        const myStoreName = store ? JSON.parse(store).name : '';
        this.myReview = this.reviews.find(r => r.store_name === myStoreName) || null;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  submitReview(): void {
    if (this.reviewRating === 0) { this.reviewError = 'Selecciona una valoración'; return; }
    if (!this.reviewOrderId) { this.reviewError = 'Selecciona el pedido donde compraste este producto'; return; }
    this.submittingReview = true;
    this.reviewError = '';

    this.api.post<Review>('/reviews', {
      product_id: this.product!.id,
      order_id: this.reviewOrderId,
      rating: this.reviewRating,
      comment: this.reviewComment || null,
    }).subscribe({
      next: (r) => {
        this.reviews.unshift(r);
        this.reviewStats.total_reviews++;
        this.reviewStats.average_rating = this.reviews.reduce((s, rev) => s + rev.rating, 0) / this.reviews.length;
        this.myReview = r;
        this.showReviewForm = false;
        this.submittingReview = false;
        this.reviewRating = 0;
        this.reviewComment = '';
        this.showToast('¡Opinión publicada!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.submittingReview = false;
        this.reviewError = err.error?.detail || 'Error al publicar la opinión';
        this.cdr.detectChanges();
      }
    });
  }

  selectImage(img: ProductImage): void { this.selectedImage = img; }
  selectVariant(v: ProductVariant): void { this.selectedVariant = v; this.qty = 1; }

  addToCart(): void {
    this.api.post<any>('/cart/add', { product_id: this.product!.id, quantity: this.qty }).subscribe({
      next: () => {
        this.cartCount += this.qty;
        this.showToast(`${this.product!.name} x${this.qty} agregado al carrito`);
      },
      error: () => this.showToast('Error al agregar al carrito')
    });
  }

  loadCartCount(): void {
    this.api.get<any[]>('/cart').subscribe({
      next: (items) => { this.cartCount = items.reduce((s, i) => s + i.quantity, 0); this.cdr.detectChanges(); }
    });
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    this.cdr.detectChanges();
    setTimeout(() => { this.toastVisible = false; this.cdr.detectChanges(); }, 2500);
  }

  getEmoji(category?: string): string {
    const map: Record<string, string> = {
      'Bebidas': '🥤', 'Snacks': '🍪', 'Lacteos': '🥛',
      'Abarrotes': '📦', 'Limpieza': '🧹', 'Estacional': '🎄',
    };
    return map[category || ''] || '📦';
  }

  ratingLabel(r: number): string {
    return ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][r] || '';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
    return `Hace ${Math.floor(days / 30)} meses`;
  }
}
