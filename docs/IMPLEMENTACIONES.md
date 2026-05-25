# Implementaciones Pendientes — NexaSupply

> Documento de planificación de funcionalidades no implementadas.
> **Última actualización:** 2026-05-25

---

## 1. Módulo de Ventas para Bodegueros

### Descripción

Los bodegueros necesitan un módulo para **registrar las ventas que realizan desde su inventario**, generar comprobantes (boleta/factura simulada) y dar seguimiento a sus ganancias. Actualmente el sistema solo permite comprar productos de Pauser (B2B), pero no registrar la reventa al cliente final.

### Modelo de Datos (nuevas tablas)

#### `sales` — Cabecera de venta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador único |
| `store_id` | UUID FK → `stores.id` | Bodega que realizó la venta |
| `sale_number` | String(20) | Número correlativo (ej: `VTA-00001`) |
| `client_name` | String(200) ? | Nombre del cliente final (opcional) |
| `client_document` | String(20) ? | DNI o RUC del cliente (opcional) |
| `sale_type` | String(10) | `boleta` o `factura` (opcional) |
| `subtotal` | Float | Suma de items antes de impuestos |
| `discount` | Float | Descuento total (default 0) |
| `igv` | Float | IGV 18% sobre subtotal - descuento |
| `total` | Float | Monto final (subtotal - descuento + igv) |
| `payment_method` | String(30) | `cash`, `yape`, `plin`, `transfer`, `card` |
| `notes` | Text ? | Notas adicionales |
| `created_at` | DateTime | Fecha de venta |

#### `sale_items` — Detalle de venta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador único |
| `sale_id` | UUID FK → `sales.id` | Venta a la que pertenece |
| `product_id` | UUID FK → `products.id` | Producto vendido |
| `product_name` | String(200) | Nombre al momento de la venta (histórico) |
| `quantity` | Integer | Cantidad vendida |
| `unit_price` | Float | Precio de venta unitario |
| `subtotal` | Float | quantity × unit_price |

### Endpoints Nuevos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/sales` | JWT store | Listar ventas de la bodega autenticada |
| `GET` | `/api/sales/{id}` | JWT store | Detalle de una venta (con items) |
| `POST` | `/api/sales` | JWT store | Registrar una nueva venta (decrementa inventory) |
| `GET` | `/api/sales/summary` | JWT store | Resumen: total ventas, ganancias, periodos |

### Lógica de `POST /api/sales`

1. Validar que todos los productos existen en el inventario de la bodega con stock suficiente
2. Calcular subtotal, IGV (18%), total
3. Generar número de venta correlativo (`VTA-{correlativo}`)
4. Decrementar `inventory.quantity` por cada item
5. Crear registro en `sales` + `sale_items`
6. Retornar la venta creada con su número

### Frontend — Nuevas páginas

#### `/ventas` — Listado de Ventas

- Tabla con columnas: N° Venta, Cliente, Total, Método Pago, Fecha
- Botón "Nueva Venta" → abre formulario
- Filtros por fecha (hoy, semana, mes, rango)
- Tarjeta resumen: ventas hoy, ventas semana, ganancia total

#### `/ventas/nueva` — Registrar Venta

- Selector de productos desde el inventario de la bodega
- Tabla dinámica: producto | cantidad | precio unitario | subtotal
- Campo de cliente (nombre + documento, opcional)
- Selector de método de pago
- Resumen: subtotal → descuento → IGV → total
- Botón "Registrar Venta" → confirma y redirige al detalle

#### `/ventas/{id}` — Detalle de Venta

- Comprobante visual (formato boleta/factura)
- Datos de la bodega (nombre, RUC, dirección)
- Datos del cliente (si se registró)
- Lista de productos vendidos
- Totales: subtotal, descuento, IGV, total
- Botón "Imprimir / Exportar PDF"

### Dashboard — Nuevos KPIs

Agregar tarjetas en el dashboard del bodeguero:

| KPI | Descripción | Cálculo |
|-----|-------------|---------|
| Ventas Hoy | Total ventas del día | `SUM(sales.total) WHERE DATE(created_at) = TODAY` |
| Ventas del Mes | Total ventas del mes | `SUM(sales.total) WHERE MONTH(created_at) = CURRENT_MONTH` |
| Ganancias Estimadas | Margen estimado | `SUM(sale_items.unit_price - products.price) * quantity` |
| Ticket Promedio | Venta promedio por transacción | `AVG(sales.total)` |

---

## 2. Flujo de Suscripción al Registrarse

### Estado Actual

Actualmente el registro (`/registro`):
1. Muestra un formulario único con datos de la bodega
2. Al enviar, llama a `POST /api/auth/register` 
3. El backend crea la Store con `subscription_status="active"` directo (sin pago)
4. El campo `plan` existe en `StoreRegister` pero **no se expone en el frontend**
5. El modelo `Subscription` existe en DB pero **nunca se utiliza**

### Flujo Requerido

El registro debe convertirse en un **proceso de 3 pasos**:

```
Paso 1: Datos de la bodega (nombre, dueño, email, password, RUC, teléfono, dirección)
    ↓
Paso 2: Selección de plan (Basic S/29.90 / Premium S/49.90)
    ↓
Paso 3: Simulación de pago con tarjeta (monto según plan)
    ↓
Confirmación → Redirección al Dashboard
```

### Cambios en Backend

#### Nuevo endpoint: `POST /api/subscriptions/checkout`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `store_data` | StoreRegister | Datos del registro |
| `plan` | String | `basic` o `premium` |
| `card_number` | String | Para mock de pago |
| `expiry` | String | Fecha expiración |
| `cvv` | String | Código de seguridad |
| `card_holder` | String | Nombre del titular |

**Lógica del endpoint:**

1. Validar formato de tarjeta (reutilizar lógica de `simulate_payment`)
2. Validar que el email no exista
3. Si pago exitoso:
   - Crear Store con `plan` seleccionado y `subscription_status="active"`
   - Crear registro en tabla `Subscription` con `status="active"`
   - Generar JWT y retornar
4. Si pago falla: retornar error con mensaje

#### Modificar `POST /api/auth/register`

Dejar el endpoint actual pero **quitarlo del flujo de registro frontend** (queda como endpoint legacy/directo para testing). El nuevo flujo usará el endpoint de subscription checkout.

#### Tabla `subscriptions` (ya existe, pero hay que conectarla)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | ✅ Ya existe |
| `store_id` | UUID FK | ✅ Ya existe |
| `plan` | String(20) | ✅ Ya existe (`basic` / `premium`) |
| `status` | String(20) | ✅ Ya existe (`active` / `inactive` / `cancelled`) |
| `start_date` | DateTime | ✅ Ya existe |
| `end_date` | DateTime ? | ✅ Ya existe |
| `payment_transaction_id` | String(50) **?** | ⬜ Opcional: guardar TXN ID del pago mock |
| `amount_paid` | Float **?** | ⬜ Opcional: monto pagado (S/29.90 o S/49.90) |

Las columnas marcadas con ⬜ son opcionales, se pueden agregar para mejor trazabilidad.

### Cambios en Frontend

#### Nuevo componente: `pages/register/register.component.ts` (refactor)

Convertir el formulario actual en un wizard de 3 pasos:

**Paso 1 — Datos de la bodega**

*(Igual al formulario actual)*

- Nombre de la bodega *
- Nombre del dueño *
- Email *
- Contraseña *
- RUC (opcional)
- Teléfono (opcional)
- Dirección (opcional)
- Botón "Continuar"

**Paso 2 — Elegir plan**

```
┌─────────────────────────────────────────────┐
│  🥇 Basic — S/29.90/mes                    │
│  • Catálogo completo de productos           │
│  • Pedidos ilimitados                       │
│  • Tracking de envíos                       │
│  • Inventario básico                        │
│  [Seleccionar]                              │
├─────────────────────────────────────────────┤
│  👑 Premium — S/49.90/mes                  │
│  • Todo lo de Basic +                       │
│  • Analytics avanzados                      │
│  • Prioridad en entregas                    │
│  • Soporte prioritario                      │
│  • Reportes de ventas                       │
│  [Seleccionar]                              │
└─────────────────────────────────────────────┘
```

- Mostrar precio y características de cada plan
- Resaltar el plan seleccionado con borde/color
- Botón "Continuar al pago"

**Paso 3 — Simular pago**

```
┌─────────────────────────────────────────────┐
│  Resumen del pedido                         │
│  Plan: Premium — S/49.90                    │
│                                              │
│  Datos de tarjeta                           │
│  ┌──────────────────────────────────┐       │
│  │ Número: 4111 1111 1111 1111     │       │
│  ├──────────────┬───────────────────┤       │
│  │ Vencimiento   │ CVV              │       │
│  │ 12/28        │ 123              │       │
│  ├──────────────┴───────────────────┤       │
│  │ Titular: Juan Pérez             │       │
│  └──────────────────────────────────┘       │
│                                              │
│  [Pagar S/49.90]                            │
│                                              │
│  💳 Simulación — no se realizará un          │
│  cobro real                                  │
└─────────────────────────────────────────────┘
```

- Pre-cargar datos de tarjeta de prueba (`4111 1111 1111 1111`)
- Validación de formato (16 dígitos, CVV 3 dígitos)
- Animación de "Procesando pago..." (3s como en checkout)
- Mensaje de éxito/error
- Botón "Ir al Dashboard" en éxito

#### Modificar `AuthService`

Agregar método `registerWithPayment(data)` que llama al nuevo endpoint.

### Resumen de Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `backend/app/routers/subscriptions.py` | **Crear** — endpoint `POST /checkout` |
| `backend/app/schemas/__init__.py` | **Modificar** — agregar schema `SubscriptionCheckout` |
| `backend/app/models/subscription.py` | **Modificar** — agregar campos opcionales |
| `frontend/src/app/pages/register/register.component.ts` | **Refactor** — wizard 3 pasos |
| `frontend/src/app/services/auth.service.ts` | **Modificar** — agregar `registerWithPayment()` |
| `frontend/src/app/app.routes.ts` | **Verificar** — ruta `/registro` ya existe |

### Notas

- La tabla `subscriptions` ya existe en la DB con los campos mínimos necesarios
- El modelo `Subscription` ya está importado en `models/__init__.py`
- El mock de pago ya existe en `routers/checkout.py` como `simulate_payment` — se puede reutilizar la lógica
- El plan elegido se debe persistir en `Store.plan` y crear un registro en `Subscription`

---

## 3. Sistema de Opiniones y Valoraciones de Productos

### Descripción

Los bodegueros que compran productos y los marcan como **recibidos** en su pedido deben poder dejar una **valoración con estrellas (1-5)** y un **comentario escrito** sobre el producto. Estas opiniones se muestran en la ficha de detalle del producto (`/producto/:id`) para ayudar a otros compradores.

### Estado Actual

- El endpoint `POST /orders/{id}/receive` confirma la entrega y suma al inventario, pero **no solicita ninguna review**
- El modelo `Product` no tiene relación con reviews
- La ficha de producto no muestra valoraciones
- No existe tabla `product_reviews`

### Modelo de Datos (nueva tabla)

#### `product_reviews`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador único |
| `product_id` | UUID FK → `products.id` | Producto evaluado (NOT NULL, INDEX) |
| `store_id` | UUID FK → `stores.id` | Bodega que compró y opina (NOT NULL) |
| `order_id` | UUID FK → `orders.id` | Orden en la que se compró (para validar) |
| `rating` | Integer | Valoración 1-5 (NOT NULL, CHECK 1-5) |
| `comment` | Text ? | Comentario opcional |
| `created_at` | DateTime | Fecha de la opinión |

**Restricciones:**
- Un store solo puede dejar **una review por producto** (unique constraint: `product_id + store_id`)
- Solo se puede review si el store **compró ese producto en una orden entregada**

### Endpoints Nuevos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/reviews` | JWT store | Crear review (después de recibir pedido) |
| `GET` | `/api/products/{id}/reviews` | No | Listar reviews de un producto (público) |
| `GET` | `/api/products/{id}/reviews/stats` | No | Estadísticas: promedio, total, distribución |

#### `POST /api/reviews`

**Request:**
```json
{
  "product_id": "uuid",
  "order_id": "uuid",
  "rating": 4,
  "comment": "Buen producto, llegó en excelente estado. Lo recomiendo."
}
```

**Validaciones:**
1. El `order_id` debe pertenecer al store autenticado y estar en estado `delivered`
2. El `product_id` debe estar incluido en los `order_items` de esa orden
3. No puede existir ya una review del mismo store para ese producto
4. `rating` debe estar entre 1 y 5

**Response (201):**
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "rating": 4,
  "comment": "Buen producto...",
  "created_at": "2026-05-25T..."
}
```

#### `GET /api/products/{id}/reviews`

Devuelve lista paginada de reviews con datos del store que opinó:
```json
[
  {
    "id": "uuid",
    "store_name": "Bodega Don Roberto",
    "rating": 5,
    "comment": "Excelente producto",
    "created_at": "..."
  }
]
```

#### `GET /api/products/{id}/reviews/stats`

```json
{
  "average_rating": 4.3,
  "total_reviews": 12,
  "distribution": {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 5,
    "5": 4
  }
}
```

### Modificaciones en Endpoints Existentes

#### `GET /api/products` y `GET /api/products/{id}`

Agregar campos calculados al `ProductResponse`:

```python
# Nuevos campos en ProductResponse
average_rating: Optional[float] = None  # promedio de ratings
total_reviews: int = 0                   # cantidad de reviews
```

Se pueden calcular con una subquery SQLAlchemy:
```python
from sqlalchemy import func
avg_rating = (
    db.query(func.coalesce(func.avg(ProductReview.rating), 0))
    .filter(ProductReview.product_id == Product.id)
    .scalar()
)
```

### Flujo en Frontend

#### 1. Después de recibir pedido (en orders page)

Modificar el botón "Marcar como recibido" para que después de confirmar:

```
1. Usuario hace clic en ✅ "Marcar como recibido"
2. Confirm dialog: "¿Confirmas que recibiste este pedido?"
3. API: POST /orders/{id}/receive → éxito
4. Mostrar modal: "¿Quieres calificar los productos que recibiste?"
   [Calificar ahora] [Calificar después]
5. Si elige "Calificar ahora" → modal con lista de productos recibidos
   Producto 1: ★★★★☆ [comentario opcional] [Enviar review]
   Producto 2: ★★★★★ [comentario opcional] [Enviar review]
   Producto 3: ★★★☆☆ [comentario opcional] [Enviar review]
6. Cada review se envía individualmente a POST /api/reviews
```

#### 2. En página de detalle de producto

Agregar sección **"Opiniones de otros bodegueros"** en la zona inferior:

```
┌─────────────────────────────────────────────┐
│  ⭐ Opiniones de otros bodegueros           │
│                                              │
│  ⭐ 4.3   │  12 opiniones                    │
│  ┌───────┐  Distribución:                    │
│  │ 5 ★   │  ████████ 4                      │
│  │ 4 ★   │  ████████ 5                      │
│  │ 3 ★   │  ████ 2                          │
│  │ 2 ★   │  ██ 1                            │
│  │ 1 ★   │  0                               │
│  └───────┘                                   │
│                                              │
│  ─── Reseñas recientes ───                   │
│                                              │
│  🏪 Bodega Don Roberto                      │
│  ⭐⭐⭐⭐⭐ · Hace 3 días                      │
│  "Excelente producto, llegó en perfecto     │
│   estado. Mis clientes lo prefieren."        │
│                                              │
│  🏪 Minimarket La Esquina                   │
│  ⭐⭐⭐⭐ · Hace 1 semana                     │
│  "Buen precio, aunque el empaque podría     │
│   mejorar."                                  │
└─────────────────────────────────────────────┘
```

#### 3. En catálogo (tarjetas de producto)

Agregar indicador de rating en cada card:

```
┌──────────────────┐
│  [Imagen]         │
│  Cerveza Cristal  │
│  S/ 18.50         │
│  ⭐ 4.5 (12)      │  ← nuevo
│  [Agregar al car.]│
└──────────────────┘
```

### Arquitectura de Componentes

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| `ReviewModalComponent` | `frontend/src/app/shared/review-modal/review-modal.component.ts` | Modal que aparece después de recibir pedido, lista productos para calificar |
| `ReviewsSectionComponent` | `frontend/src/app/pages/product-detail/reviews-section.component.ts` | Sección de reviews en detalle de producto (o inline en product-detail) |
| `StarRatingComponent` | `frontend/src/app/shared/star-rating/star-rating.component.ts` | Selector/display de estrellas (reutilizable) |

### Resumen de Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `backend/app/models/product_review.py` | **Crear** — modelo `ProductReview` |
| `backend/app/models/__init__.py` | **Modificar** — importar `ProductReview` |
| `backend/app/routers/reviews.py` | **Crear** — endpoints CRUD de reviews |
| `backend/app/routers/products.py` | **Modificar** — agregar `avg_rating` y `total_reviews` al response |
| `backend/app/schemas/__init__.py` | **Modificar** — agregar schemas de review |
| `backend/app/main.py` | **Modificar** — incluir router de reviews |
| `frontend/src/app/pages/orders/orders.component.ts` | **Modificar** — agregar modal de review después de recibir |
| `frontend/src/app/pages/product-detail/product-detail.component.ts` | **Modificar** — agregar sección de reviews |
| `frontend/src/app/pages/catalog/catalog.component.ts` | **Modificar** — mostrar rating en cards |
| `frontend/src/app/shared/review-modal/review-modal.component.ts` | **Crear** — modal de calificación |
| `frontend/src/app/shared/star-rating/star-rating.component.ts` | **Crear** — componente de estrellas |

### Notas

- No se necesita modificar el modelo `Order` ni `OrderItem`
- La restricción de unique `(product_id, store_id)` evita reviews duplicados
- Las reviews son públicas (se muestran a cualquier visitante)
- Para el cálculo de promedio se puede usar `func.avg()` de SQLAlchemy en una subquery
- El modal de review después de recibir sería ideal como un componente standalone que se abre con un flag
- Se pueden crear algunas reviews como seed data para que la demo se vea con contenido

---

## 4. Mejoras y Features Secundarios

### 4.1 Chatbot Rápido con Groq

#### Descripción

Implementar un chatbot conversacional liviano usando la **API de Groq** (modelo Llama 3 o Mixtral) directamente desde el frontend. Sin necesidad de backend propio para el chat. El chatbot aparece como un widget flotante en todas las páginas y puede responder preguntas sobre el catálogo, precios y el funcionamiento de la plataforma.

#### Stack Propuesto

| Componente | Tecnología |
|------------|-----------|
| API de IA | Groq Cloud (`groq-sdk`) |
| Modelo | `llama-3.1-8b-instant` o `mixtral-8x7b-32768` |
| Frontend | Web Component widget flotante |
| Contexto | Prompt con información del catálogo de NexaSupply |

#### Implementación Sugerida

**Opción A — Frontend directo (recomendada para demo)**

Llamar a la API de Groq directamente desde el frontend Angular usando `fetch()`:

```typescript
// Servicio: groq-chat.service.ts
async sendMessage(messages: {role: string, content: string}[]) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
    })
  });
  return res.json();
}
```

> ⚠️ La API Key de Groq se expondría en el frontend. Para una demo académica es aceptable, pero en producción iría en un backend proxy.

**Opción B — Backend proxy (más segura)**

Crear endpoint `POST /api/chat` en FastAPI que recibe los mensajes, los envía a Groq y retorna la respuesta.

```python
@router.post("/chat")
async def chat(messages: list[dict]):
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
            json={"model": "llama-3.1-8b-instant", "messages": messages}
        )
        return res.json()
```

#### UI del Chatbot

Widget flotante en la esquina inferior derecha:

```
┌──────────────────────────────┐
│  💬 NexaBot                  │
│                              │
│  👋 ¡Hola! Soy NexaBot, tu  │
│  asistente virtual.          │
│                              │
│  Puedo ayudarte con:         │
│  • Precios y stock           │
│  • Cómo comprar              │
│  • Seguimiento de pedidos    │
│                              │
│  ┌────────────────────────┐  │
│  │ ¿Qué producto buscas?  │  │
│  └────────────────────────┘  │
│  [Enviar]                    │
└──────────────────────────────┘
  [💬]  ← botón flotante
```

**Casos de uso del prompt del sistema:**
- Responder sobre productos del catálogo (basado en datos precargados)
- Explicar cómo funciona la plataforma
- Ayudar con el registro y login
- Información de contacto y soporte
- **No** debe inventar precios ni datos que no estén en el contexto

#### Archivos a Crear

| Archivo | Acción |
|---------|--------|
| `frontend/src/app/shared/chatbot/chatbot.component.ts` | **Crear** — widget flotante del chatbot |
| `frontend/src/app/services/chat.service.ts` | **Crear** — servicio de conexión con Groq |
| `frontend/src/environments/environment.ts` | **Modificar** — agregar `groqApiKey` |
| `backend/app/routers/chat.py` | **Crear** (opcional, si se usa Opción B) |

---

### 4.2 Mejora en Simulación de Pagos (Yape, Plin, Efectivo)

#### Descripción

Actualmente el pago simulado solo admite tarjeta de crédito/débito (`/api/checkout/payment/simulate`). Se requiere agregar métodos de pago adicionales típicos del mercado peruano: **Yape**, **Plin** y **Efectivo**, con una simulación visual de confirmación.

#### Nuevos Métodos de Pago

| Método | Ícono | Comportamiento Simulado |
|--------|-------|------------------------|
| `yape` | 📱 | Mostrar QR simulado + botón "Confirmar pago desde Yape" |
| `plin` | 📱 | Mostrar QR simulado + botón "Confirmar pago desde Plin" |
| `cash` | 💵 | Mensaje "Pago contraentrega" + botón "Confirmar pago en efectivo" |
| `card` | 💳 | Formulario de tarjeta (existente) + 95% éxito |

#### Flujo por Método

##### Yape / Plin

```
Paso 1: Seleccionar Yape/Plin como método de pago
Paso 2: Mostrar pantalla con:
  ┌─────────────────────────────┐
  │  📱 Paga con Yape           │
  │                             │
  │  ┌─────────────────────┐    │
  │  │  [QR code simulado]  │    │
  │  │  ██████████████████  │    │
  │  │  ██ NEXASUPPLY ████  │    │
  │  │  ██████████████████  │    │
  │  └─────────────────────┘    │
  │                             │
  │  O usa este número:         │
  │  📞 987 654 321             │
  │                             │
  │  [✅ Ya pagué — Confirmar]  │
  │  [Cancelar]                 │
  └─────────────────────────────┘
Paso 3: Usuario hace clic en "Ya pagué — Confirmar"
Paso 4: Animación de validación (2s)
Paso 5: ✅ Pago confirmado → Redirigir a confirmación de orden
```

##### Efectivo (Contraentrega)

```
Paso 1: Seleccionar "Efectivo — Pago contraentrega"
Paso 2: Mostrar pantalla con:
  ┌─────────────────────────────┐
  |  💵 Pago contraentrega      │
  |                             │
  |  Pagarás S/ 185.50 cuando   │
  |  recibas tu pedido.         │
  |                             │
  |  El repartidor llevará      │
  |  cambio para billetes de    │
  |  hasta S/ 100.              │
  |                             │
  |  [✅ Confirmar pedido]      │
  |  [Cancelar]                 │
  └─────────────────────────────┘
Paso 2: Usuario confirma
Paso 3: ✅ Pedido registrado como "pago contraentrega"
```

#### Cambios en Backend

**Modificar `POST /api/checkout/payment/simulate`** para aceptar el método de pago:

```python
class PaymentRequest(BaseModel):
    method: str = "card"            # card | yape | plin | cash
    card_number: Optional[str] = None
    expiry: Optional[str] = None
    cvv: Optional[str] = None
    card_holder: Optional[str] = None
    amount: float
```

| Método | Validación | Tasa de éxito |
|--------|-----------|---------------|
| `card` | Validar formato tarjeta (16 dígitos, CVV 3) | 95% |
| `yape` | Sin validación (solo confirmación manual) | 100% |
| `plim` | Sin validación (solo confirmación manual) | 100% |
| `cash` | Sin validación (solo confirmación manual) | 100% |

**Modificar `POST /api/checkout`** para almacenar el método de pago en la orden:

```python
order.payment_method = payment_method  # "yape" | "plin" | "cash" | "simulated_card"
```

#### Cambios en Frontend

**Modificar `checkout.component.ts`** para agregar selector visual de métodos de pago:

```
┌─────────────────────────────┐
│  Selecciona método de pago  │
│                             │
│  [💳 Tarjeta]  [📱 Yape]   │
│  [📱 Plín]     [💵 Efectivo]│
│                             │
│  (contenido dinámico según  │
│   el método seleccionado)   │
└─────────────────────────────┘
```

#### Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `backend/app/routers/checkout.py` | **Modificar** — aceptar `method` en payment, guardar en orden |
| `backend/app/schemas/__init__.py` | **Modificar** — `PaymentRequest` con campo `method` |
| `frontend/src/app/pages/checkout/checkout.component.ts` | **Modificar** — agregar selector de método + pantallas Yape/Plin/Efectivo |
| `backend/app/models/order.py` | **Verificar** — `payment_method` ya existe ✅ |

---

### 4.3 Mejoras de UX y Animaciones

#### Descripción

El diseño actual es funcional pero carece de animaciones, transiciones y micro-interacciones que mejoren la experiencia de usuario. Se propone agregar animaciones sutiles para que la demo se vea más profesional.

#### Propuesta de Animaciones

| Elemento | Animación | Implementación |
|----------|-----------|----------------|
| **Landing page hero** | Partículas flotando + fade-in del contenido al cargar | CSS keyframes (ya hay partículas, mejorar) |
| **Transiciones entre rutas** | Slide/fade al navegar entre páginas | Angular route transition animations |
| **Cards de productos** | Scale + shadow en hover (ya hay básico), agregar stagger al aparecer | CSS transitions + `@for` index-based delay |
| **Carrito** | Slide-in desde la derecha al agregar item | CSS transform + transition |
| **Toast notifications** | Slide-up + fade con bounce (ya hay) | Mejorar timing y posición |
| **Modal de review** | Fade-in + scale | CSS keyframes |
| **Loading spinners** | Skeleton screens en lugar de spinner genérico | CSS + componentes placeholder |
| **Botones** | Ripple effect al hacer clic | CSS pseudo-elementos |
| **Tablas** | Hover en filas + stripe alternado | CSS (ya hay hover básico) |
| **Checkout progress** | Barra de progreso animada entre pasos | CSS width transition |
| **Dashboard KPIs** | Contador animado (de 0 a valor final) | Intersection Observer + requestAnimationFrame |
| **Tracking timeline** | Pulse animation en el círculo activo | CSS animation |

#### Implementación Técnica

##### Angular Route Transitions

```typescript
// app.routes.ts — agregar data de animación
{
  path: 'productos',
  loadComponent: () => ...,
  data: { animation: 'catalog' }
}

// app.component.ts — configurar animaciones
import { trigger, transition, style, animate, query } from '@angular/animations';

@Component({
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        query(':enter', [style({ opacity: 0 }), animate('300ms', style({ opacity: 1 }))]),
      ])
    ])
  ]
})
```

##### Skeleton Screens

Componente reutilizable que muestra un placeholder gris animado mientras los datos cargan:

```html
<!-- Uso: @if (loading) { <app-skeleton type="product-card" /> } -->
@Component({ ... })
export class SkeletonComponent {
  @Input() type: 'product-card' | 'table-row' | 'detail-page' = 'product-card';
}
```

##### Contador Animado en KPIs

```typescript
animateCounter(target: number, el: HTMLElement): void {
  const duration = 1000;
  const start = performance.now();
  const frame = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(progress * target).toString();
    if (progress < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
```

##### Stagger Animación en Grid de Productos

```scss
.product-card {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.4s forwards;

  @for $i from 1 through 12 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.05}s;
    }
  }
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/app/app.component.ts` | **Modificar** — agregar route transition animations |
| `frontend/src/app/app.config.ts` | **Modificar** — importar `provideAnimations()` |
| `frontend/src/styles.scss` | **Modificar** — agregar animaciones globales |
| `frontend/src/app/shared/skeleton/skeleton.component.ts` | **Crear** — componente de skeleton loading |
| `frontend/src/app/pages/landing/landing.component.scss` | **Modificar** — mejorar animaciones del hero |
| `frontend/src/app/pages/catalog/catalog.component.ts` | **Modificar** — agregar stagger animation a cards |
| `frontend/src/app/pages/dashboard/dashboard.component.ts` | **Modificar** — contadores animados en KPIs |

#### Dependencias

```bash
pnpm add @angular/animations
```

El provider `provideAnimations()` ya debe estar en `app.config.ts`.

---

## 5. Próximas secciones...

*(Instrucciones: dime qué más falta y lo agrego aquí)*
