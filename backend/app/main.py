import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .core.database import engine, Base
from .models import *  # noqa — carga todos los modelos para create_all
from .routers import auth, products, cart, checkout, orders, inventory, admin
from .dev import router as dev_router
from .dev.auth import router as dev_auth_router
from .dev.products import router as dev_products_router
from .dev.orders import router as dev_orders_router
from .dev.inventory import router as dev_inventory_router
from .dev.subscriptions import router as dev_subscriptions_router
from .dev.admin import router as dev_admin_router
from .api.v1 import router as api_v1_router
from .api.v1.auth import router as api_v1_auth_router
from .api.v1.products import router as api_v1_products_router
from .api.v1.orders import router as api_v1_orders_router
from .api.v1.inventory import router as api_v1_inventory_router
from .api.v1.subscriptions import router as api_v1_subscriptions_router
from .api.v1.admin import router as api_v1_admin_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NexaSupply API",
    description="Demo SaaS B2B — NexaSupply (Pauser Distribuciones 4PL)",
    version="0.1.0",
)

# CORS para dev (Angular en :4200)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Dev routers (no auth, for testing) ──
app.include_router(dev_router, prefix="/dev", tags=["Dev"])
app.include_router(dev_auth_router, prefix="/dev/auth", tags=["Dev Auth"])
app.include_router(dev_products_router, prefix="/dev/products", tags=["Dev Products"])
app.include_router(dev_orders_router, prefix="/dev/orders", tags=["Dev Orders"])
app.include_router(dev_inventory_router, prefix="/dev/inventory", tags=["Dev Inventory"])
app.include_router(dev_subscriptions_router, prefix="/dev/subscriptions", tags=["Dev Subscriptions"])
app.include_router(dev_admin_router, prefix="/dev/admin", tags=["Dev Admin"])

# ── API v1 routers (production, with JWT) ──
app.include_router(api_v1_router, prefix="/api/v1", tags=["API v1"])
app.include_router(api_v1_auth_router, prefix="/api/v1/auth", tags=["API v1 Auth"])
app.include_router(api_v1_products_router, prefix="/api/v1/products", tags=["API v1 Products"])
app.include_router(api_v1_orders_router, prefix="/api/v1/orders", tags=["API v1 Orders"])
app.include_router(api_v1_inventory_router, prefix="/api/v1/inventory", tags=["API v1 Inventory"])
app.include_router(api_v1_subscriptions_router, prefix="/api/v1/subscriptions", tags=["API v1 Subscriptions"])
app.include_router(api_v1_admin_router, prefix="/api/v1/admin", tags=["API v1 Admin"])

# ── Legacy routers (existing code, prefix /api/*) ──
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(cart.router, prefix="/api/cart", tags=["Cart"])
app.include_router(checkout.router, prefix="/api/checkout", tags=["Checkout"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


# ── Static files (product images) ──
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(os.path.join(UPLOAD_DIR, "products"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "nexasupply-api"}
