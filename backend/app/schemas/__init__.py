from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, field_serializer
from typing import Optional
from datetime import datetime


def _uuid_to_str(v: UUID) -> str:
    return str(v)


# ── Auth ──
class StoreRegister(BaseModel):
    store_name: str
    store_ruc: Optional[str] = None
    store_address: Optional[str] = None
    store_phone: Optional[str] = None
    owner_name: str
    email: EmailStr
    password: str
    plan: str = "basic"


class StoreLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    store_id: str
    store_name: str


class StoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    ruc: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    owner_name: str
    email: str
    plan: str
    subscription_status: str
    created_at: datetime

    _ser_id = field_serializer("id")(_uuid_to_str)


# ── Producto Images ──
class ProductImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    url: str
    alt_text: Optional[str] = None
    sort_order: int = 0

    _ser_id = field_serializer("id")(_uuid_to_str)


# ── Producto Variants ──
class ProductVariantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    price_modifier: float = 0.0
    stock: int = 0

    _ser_id = field_serializer("id")(_uuid_to_str)


class ProductVariantCreate(BaseModel):
    name: str
    price_modifier: float = 0.0
    stock: int = 0


# ── Productos ──
class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    image_url: Optional[str] = None
    stock: int
    is_active: bool
    images: list[ProductImageResponse] = []
    variants: list[ProductVariantResponse] = []

    _ser_id = field_serializer("id")(_uuid_to_str)


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    stock: int = 0


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None


# ── Carrito ──
class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1


class CartItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    product_id: UUID
    product_name: str
    product_price: float
    product_stock: int
    quantity: int

    _ser_id = field_serializer("id")(_uuid_to_str)
    _ser_pid = field_serializer("product_id")(_uuid_to_str)


# ── Pago ──
class PaymentRequest(BaseModel):
    card_number: str
    expiry: str
    cvv: str
    amount: float
    card_holder: str


class PaymentResponse(BaseModel):
    success: bool
    transaction_id: str
    message: str


# ── Checkout ──
class CheckoutRequest(BaseModel):
    pass


class CheckoutResponse(BaseModel):
    order_id: str
    order_number: str
    status: str
    total: float


# ── Órdenes ──
class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: UUID
    product_name: str
    quantity: int
    unit_price: float

    _ser_pid = field_serializer("product_id")(_uuid_to_str)


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    order_number: str
    total: float
    tracking_status: str
    status_history: list
    payment_method: str
    paid_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime
    items: list[OrderItemResponse] = []

    _ser_id = field_serializer("id")(_uuid_to_str)


# ── Inventario ──
class InventoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    product_id: UUID
    product_name: str
    product_category: Optional[str] = None
    quantity: int
    last_updated: datetime

    _ser_id = field_serializer("id")(_uuid_to_str)
    _ser_pid = field_serializer("product_id")(_uuid_to_str)
