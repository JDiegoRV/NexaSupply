import { Routes } from '@angular/router';

export const routes: Routes = [
  // Públicas
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  // Bodeguero (auth requerido en el guard)
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'productos',
    loadComponent: () => import('./pages/catalog/catalog.component').then(m => m.CatalogComponent),
  },
  {
    path: 'carrito',
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'pedidos',
    loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent),
  },
  {
    path: 'inventario',
    loadComponent: () => import('./pages/inventory/inventory.component').then(m => m.InventoryComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
  },
  { path: '**', redirectTo: '' },
];
