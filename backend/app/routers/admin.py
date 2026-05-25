import os
import uuid
import shutil
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from ..core.database import get_db
from ..core.config import get_settings
from ..core.security import create_access_token
from ..models.product import Product
from ..models.product_image import ProductImage
from ..models.product_variant import ProductVariant
from ..models.order import Order
from ..models.store import Store
from ..schemas import ProductResponse

router = APIRouter()
settings = get_settings()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "products")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/login")
def admin_login(data: dict):
    email = data.get("email", "")
    password = data.get("password", "")
    if email == settings.ADMIN_EMAIL and password == settings.ADMIN_PASSWORD:
        token = create_access_token(data={"sub": "admin", "type": "admin"})
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(401, "Credenciales inválidas")


@router.get("/orders")
def list_all_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(50).all()
    return [
        {
            "id": str(o.id),
            "order_number": o.order_number,
            "store_name": db.get(Store, o.store_id).name,
            "total": o.total,
            "tracking_status": o.tracking_status,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]


@router.post("/orders/{order_id}/advance")
def advance_tracking(order_id: str, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Orden no encontrada")

    transitions = {
        "confirmed": "preparing",
        "preparing": "in_transit",
        "in_transit": "delivered",
    }
    next_status = transitions.get(order.tracking_status)
    if not next_status:
        raise HTTPException(400, f"No se puede avanzar desde {order.tracking_status}")

    now = datetime.now(timezone.utc)
    order.tracking_status = next_status
    history = order.status_history or []
    history.append({"status": next_status, "timestamp": now.isoformat()})
    order.status_history = history

    if next_status == "delivered":
        order.delivered_at = now

    db.commit()
    return {
        "order_id": str(order.id),
        "tracking_status": order.tracking_status,
        "status_history": order.status_history,
    }


@router.get("/stores")
def list_stores(db: Session = Depends(get_db)):
    stores = db.query(Store).order_by(Store.created_at.desc()).all()
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "owner_name": s.owner_name,
            "email": s.email,
            "plan": s.plan,
            "subscription_status": s.subscription_status,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in stores
    ]


# ── Product CRUD ──

@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).options(
        joinedload(Product.images),
        joinedload(Product.variants),
    ).order_by(Product.created_at.desc()).all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "category": p.category,
            "image_url": p.image_url,
            "stock": p.stock,
            "is_active": p.is_active,
            "images": [
                {"id": str(img.id), "url": img.url, "alt_text": img.alt_text, "sort_order": img.sort_order}
                for img in (p.images or [])
            ],
            "variants": [
                {"id": str(v.id), "name": v.name, "price_modifier": v.price_modifier, "stock": v.stock}
                for v in (p.variants or [])
            ],
        }
        for p in products
    ]


@router.post("/products", status_code=201)
def create_product(data: dict, db: Session = Depends(get_db)):
    product = Product(
        name=data["name"],
        description=data.get("description"),
        price=data["price"],
        category=data.get("category"),
        stock=data.get("stock", 0),
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return {"id": str(product.id), "name": product.name}


@router.put("/products/{product_id}")
def update_product(product_id: str, data: dict, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Producto no encontrado")
    for field in ["name", "description", "price", "category", "stock", "is_active"]:
        if field in data:
            setattr(product, field, data[field])
    db.commit()
    return {"id": str(product.id), "name": product.name}


@router.delete("/products/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Producto no encontrado")
    db.delete(product)
    db.commit()
    return {"ok": True}


# ── Product Images ──

@router.post("/products/{product_id}/images", status_code=201)
async def upload_product_image(product_id: str, file: UploadFile = File(...), alt_text: Optional[str] = Form(None), db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Producto no encontrado")

    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    max_order = db.query(ProductImage.sort_order).filter(
        ProductImage.product_id == product_id
    ).order_by(ProductImage.sort_order.desc()).first()
    next_order = (max_order[0] or 0) + 1 if max_order else 1

    img = ProductImage(
        product_id=product.id,
        url=f"uploads/products/{filename}",
        alt_text=alt_text or product.name,
        sort_order=next_order,
    )
    db.add(img)
    db.commit()
    db.refresh(img)

    if not product.image_url:
        product.image_url = img.url
        db.commit()

    return {
        "id": str(img.id),
        "url": img.url,
        "alt_text": img.alt_text,
        "sort_order": img.sort_order,
    }


@router.delete("/products/{product_id}/images/{image_id}")
def delete_product_image(product_id: str, image_id: str, db: Session = Depends(get_db)):
    img = db.get(ProductImage, image_id)
    if not img or str(img.product_id) != product_id:
        raise HTTPException(404, "Imagen no encontrada")

    filepath = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), img.url)
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(img)
    db.commit()
    return {"ok": True}


# ── Product Variants ──

@router.post("/products/{product_id}/variants", status_code=201)
def create_variant(product_id: str, data: dict, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Producto no encontrado")
    variant = ProductVariant(
        product_id=product.id,
        name=data["name"],
        price_modifier=data.get("price_modifier", 0.0),
        stock=data.get("stock", 0),
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return {
        "id": str(variant.id),
        "name": variant.name,
        "price_modifier": variant.price_modifier,
        "stock": variant.stock,
    }


@router.put("/products/{product_id}/variants/{variant_id}")
def update_variant(product_id: str, variant_id: str, data: dict, db: Session = Depends(get_db)):
    variant = db.get(ProductVariant, variant_id)
    if not variant or str(variant.product_id) != product_id:
        raise HTTPException(404, "Variante no encontrada")
    for field in ["name", "price_modifier", "stock"]:
        if field in data:
            setattr(variant, field, data[field])
    db.commit()
    return {"id": str(variant.id), "name": variant.name}


@router.delete("/products/{product_id}/variants/{variant_id}")
def delete_variant(product_id: str, variant_id: str, db: Session = Depends(get_db)):
    variant = db.get(ProductVariant, variant_id)
    if not variant or str(variant.product_id) != product_id:
        raise HTTPException(404, "Variante no encontrada")
    db.delete(variant)
    db.commit()
    return {"ok": True}
