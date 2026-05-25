import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">

    <!-- Header -->
    <div class="text-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Registrar mi bodega</h1>
      <p class="text-gray-500 mt-1 text-sm">Comienza a vender más con NexaSupply</p>
    </div>

    <!-- Step indicator -->
    <div class="flex items-center justify-center gap-2 mb-8">
      @for (n of [1,2,3]; track n) {
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
            [class.bg-blue-600]="step >= n" [class.text-white]="step >= n"
            [class.bg-gray-100]="step < n" [class.text-gray-400]="step < n">
            @if (step > n) { ✓ } @else { {{ n }} }
          </div>
          @if (n < 3) {
            <div class="w-10 h-0.5 transition-all"
              [class.bg-blue-600]="step > n" [class.bg-gray-200]="step <= n"></div>
          }
        </div>
      }
    </div>
    <div class="flex justify-between text-xs text-gray-400 mb-6 -mt-4">
      <span [class.text-blue-600]="step === 1" [class.font-medium]="step === 1">Datos bodega</span>
      <span [class.text-blue-600]="step === 2" [class.font-medium]="step === 2">Elige tu plan</span>
      <span [class.text-blue-600]="step === 3" [class.font-medium]="step === 3">Pago</span>
    </div>

    <!-- ══ STEP 1: STORE DATA ══ -->
    @if (step === 1) {
      <form (ngSubmit)="goStep2()" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la bodega *</label>
            <input type="text" [(ngModel)]="storeName" name="storeName" required
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="Mi Bodega" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del dueño *</label>
            <input type="text" [(ngModel)]="ownerName" name="ownerName" required
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="Juan Pérez" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" [(ngModel)]="email" name="email" required
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
            placeholder="tu@email.com" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
          <input type="password" [(ngModel)]="password" name="password" required
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
            placeholder="Mínimo 6 caracteres" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">RUC</label>
            <input type="text" [(ngModel)]="ruc" name="ruc"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="10456789012" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input type="text" [(ngModel)]="phone" name="phone"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="987654321" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input type="text" [(ngModel)]="address" name="address"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
            placeholder="Av. Principal 123" />
        </div>
        @if (error) {
          <div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{{ error }}</div>
        }
        <button type="submit"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition">
          Continuar →
        </button>
      </form>
    }

    <!-- ══ STEP 2: PLAN SELECTION ══ -->
    @if (step === 2) {
      <div class="space-y-4">
        <!-- Basic plan -->
        <div (click)="plan = 'basic'"
          class="border-2 rounded-xl p-5 cursor-pointer transition-all"
          [class.border-blue-500]="plan === 'basic'" [class.bg-blue-50]="plan === 'basic'"
          [class.border-gray-200]="plan !== 'basic'" [class.hover:border-gray-300]="plan !== 'basic'">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl">🥇</span>
                <span class="text-lg font-bold text-gray-900">Basic</span>
              </div>
              <div class="mt-1">
                <span class="text-3xl font-extrabold text-gray-900">S/29.90</span>
                <span class="text-gray-400 text-sm">/mes</span>
              </div>
            </div>
            <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 transition"
              [class.border-blue-500]="plan === 'basic'" [class.bg-blue-500]="plan === 'basic'"
              [class.border-gray-300]="plan !== 'basic'">
              @if (plan === 'basic') { <div class="w-2 h-2 bg-white rounded-full"></div> }
            </div>
          </div>
          <ul class="mt-3 space-y-1.5 text-sm text-gray-600">
            @for (f of basicFeatures; track f) {
              <li class="flex items-center gap-2"><span class="text-green-500 font-bold">✓</span>{{ f }}</li>
            }
          </ul>
        </div>

        <!-- Premium plan -->
        <div (click)="plan = 'premium'"
          class="border-2 rounded-xl p-5 cursor-pointer transition-all relative"
          [class.border-blue-500]="plan === 'premium'" [class.bg-blue-50]="plan === 'premium'"
          [class.border-gray-200]="plan !== 'premium'" [class.hover:border-gray-300]="plan !== 'premium'">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
            Más popular
          </div>
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl">👑</span>
                <span class="text-lg font-bold text-gray-900">Premium</span>
              </div>
              <div class="mt-1">
                <span class="text-3xl font-extrabold text-gray-900">S/49.90</span>
                <span class="text-gray-400 text-sm">/mes</span>
              </div>
            </div>
            <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 transition"
              [class.border-blue-500]="plan === 'premium'" [class.bg-blue-500]="plan === 'premium'"
              [class.border-gray-300]="plan !== 'premium'">
              @if (plan === 'premium') { <div class="w-2 h-2 bg-white rounded-full"></div> }
            </div>
          </div>
          <ul class="mt-3 space-y-1.5 text-sm text-gray-600">
            @for (f of premiumFeatures; track f) {
              <li class="flex items-center gap-2"><span class="text-green-500 font-bold">✓</span>{{ f }}</li>
            }
          </ul>
        </div>

        <div class="flex gap-3">
          <button (click)="step = 1"
            class="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition text-sm">
            ← Atrás
          </button>
          <button (click)="goStep3()"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition text-sm">
            Continuar al pago →
          </button>
        </div>
      </div>
    }

    <!-- ══ STEP 3: PAYMENT ══ -->
    @if (step === 3) {
      <div class="space-y-4">
        <!-- Order summary -->
        <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Resumen del pedido</p>
          <div class="flex items-center justify-between">
            <div>
              <span class="font-semibold text-gray-900 capitalize">Plan {{ plan }}</span>
              <span class="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Mensual</span>
            </div>
            <span class="font-bold text-xl text-gray-900">S/{{ plan === 'premium' ? '49.90' : '29.90' }}</span>
          </div>
        </div>

        <!-- Card form -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Número de tarjeta</label>
          <input type="text" [(ngModel)]="cardNumber" name="cardNumber" maxlength="19"
            (input)="formatCard($event)"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-mono tracking-widest"
            placeholder="4111 1111 1111 1111" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Vencimiento</label>
            <input type="text" [(ngModel)]="expiry" name="expiry" maxlength="5"
              (input)="formatExpiry($event)"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="MM/YY" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">CVV</label>
            <input type="text" [(ngModel)]="cvv" name="cvv" maxlength="3"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="123" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Titular de la tarjeta</label>
          <input type="text" [(ngModel)]="cardHolder" name="cardHolder"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
            placeholder="JUAN PEREZ" />
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-700 flex items-center gap-2">
          <span>💳</span>
          <span>Simulación de pago — no se realizará ningún cobro real. Usa <strong>4111 1111 1111 1111</strong> como tarjeta de prueba.</span>
        </div>

        @if (error) {
          <div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{{ error }}</div>
        }

        @if (paymentState === 'processing') {
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <svg class="animate-spin h-8 w-8 mx-auto text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <p class="text-blue-700 font-medium text-sm">Procesando pago...</p>
          </div>
        }

        @if (paymentState === 'success') {
          <div class="bg-green-50 border border-green-300 rounded-xl p-4 text-center">
            <p class="text-3xl">🎉</p>
            <p class="text-green-700 font-bold mt-1">¡Pago exitoso!</p>
            <p class="text-green-600 text-sm mt-1">Bienvenido a NexaSupply. Redirigiendo...</p>
          </div>
        }

        <div class="flex gap-3">
          <button (click)="step = 2" [disabled]="paymentState !== 'idle'"
            class="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition text-sm disabled:opacity-40">
            ← Atrás
          </button>
          <button (click)="submitPayment()" [disabled]="paymentState !== 'idle'"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            Pagar S/{{ plan === 'premium' ? '49.90' : '29.90' }}
          </button>
        </div>
      </div>
    }

    <p class="text-center text-sm text-gray-500 mt-6">
      ¿Ya tienes cuenta?
      <a routerLink="/login" class="text-blue-600 hover:text-blue-800 font-medium">Inicia sesión</a>
    </p>
  </div>
</div>
  `,
  styles: [`:host { display: block; }`]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  step = 1;
  error = '';

  // Step 1
  storeName = ''; ownerName = ''; email = ''; password = '';
  ruc = ''; phone = ''; address = '';

  // Step 2
  plan = 'basic';

  // Step 3
  cardNumber = '4111 1111 1111 1111';
  expiry = '12/28';
  cvv = '123';
  cardHolder = '';
  paymentState: 'idle' | 'processing' | 'success' = 'idle';

  basicFeatures = [
    'Catálogo completo multimarca',
    'Pedidos ilimitados',
    'Tracking de envíos',
    'Inventario digital',
    'Soporte por WhatsApp',
  ];

  premiumFeatures = [
    'Todo lo de Basic',
    'Predicción de demanda IA',
    'Crédito BNPL para tu bodega',
    'Dashboard de analytics',
    'Entregas prioritarias',
    'Atención 24/7',
  ];

  goStep2(): void {
    this.error = '';
    if (!this.storeName || !this.ownerName || !this.email || !this.password) {
      this.error = 'Completa los campos obligatorios (*)'; return;
    }
    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres'; return;
    }
    this.step = 2;
  }

  goStep3(): void {
    this.error = '';
    this.step = 3;
  }

  formatCard(e: Event): void {
    const input = e.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').slice(0, 16);
    this.cardNumber = v.replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry(e: Event): void {
    const input = e.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
    this.expiry = v;
  }

  submitPayment(): void {
    this.error = '';
    const cardClean = this.cardNumber.replace(/\s/g, '');
    if (cardClean.length !== 16) { this.error = 'Número de tarjeta inválido'; return; }
    if (this.cvv.length !== 3) { this.error = 'CVV inválido'; return; }
    if (!this.expiry || this.expiry.length < 5) { this.error = 'Fecha de vencimiento inválida'; return; }

    this.paymentState = 'processing';
    this.cdr.detectChanges();

    const payload = {
      store_data: {
        store_name: this.storeName,
        owner_name: this.ownerName,
        email: this.email,
        password: this.password,
        store_ruc: this.ruc || null,
        store_phone: this.phone || null,
        store_address: this.address || null,
        plan: this.plan,
      },
      plan: this.plan,
      card_number: this.cardNumber,
      expiry: this.expiry,
      cvv: this.cvv,
      card_holder: this.cardHolder || this.ownerName.toUpperCase(),
    };

    this.authService.registerWithPayment(payload).subscribe({
      next: () => {
        this.paymentState = 'success';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/dashboard']), 1800);
      },
      error: (err) => {
        this.paymentState = 'idle';
        this.error = err.error?.detail || 'Error al procesar el pago. Intenta de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }
}
