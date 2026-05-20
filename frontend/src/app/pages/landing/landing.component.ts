import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent {
  currentYear = new Date().getFullYear();
  scrolled = false;

  features = [
    {
      icon: 'store',
      title: 'Registra tu bodega',
      description: 'Crea tu cuenta en 2 minutos. Elige tu plan y activa tu suscripción al instante. Sin papeleo, sin visitas.',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      icon: 'cart',
      title: 'Pide todas tus marcas',
      description: 'Cerveza, snacks, lácteos, abarrotes. Todo en un solo pedido. La IA te sugiere qué pedir según tu rotación.',
      color: 'from-emerald-600 to-teal-600',
    },
    {
      icon: 'truck',
      title: 'Recibe y vende',
      description: 'Entrega en 24h. Tracking en tiempo real. Tus productos se suman automáticamente a tu inventario.',
      color: 'from-amber-500 to-orange-600',
    },
  ];

  plans = [
    {
      name: 'Basic',
      price: 29.90,
      features: [
        'Catálogo completo multimarca',
        'Pedidos ilimitados',
        'Tracking de envíos',
        'Inventario digital',
        'Soporte por WhatsApp',
      ],
      highlighted: false,
    },
    {
      name: 'Premium',
      price: 49.90,
      features: [
        'Todo lo de Basic',
        'Predicción de demanda IA',
        'Crédito BNPL para tu bodega',
        'Dashboard de analytics',
        'Entregas prioritarias',
        'Atención 24/7',
      ],
      highlighted: true,
    },
  ];

  brands = [
    { name: 'CBC', logo: 'CBC' },
    { name: 'PepsiCo', logo: 'PEPSI' },
    { name: 'Nestlé', logo: 'NESTLÉ' },
    { name: 'Backus', logo: 'BACKUS' },
    { name: 'Mondelez', logo: 'MONDELEZ' },
    { name: 'Quala', logo: 'QUALA' },
  ];

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 50;
  }

  scrollTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  getIcon(id: string): string {
    const icons: Record<string, string> = {
      store: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
      cart: 'M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z',
      truck: 'M1 3h15v13H1z M16 8h4l3 3v5h-7z M5.5 18.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z M18.5 18.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
    };
    return icons[id] || '';
  }
}
