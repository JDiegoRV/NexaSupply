from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from ..core.database import get_db
from ..models.product import Product
from ..models.product_image import ProductImage
from ..models.product_variant import ProductVariant
from ..schemas import ProductResponse

router = APIRouter()


@router.get("", response_model=list[ProductResponse])
def list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Product).options(
        joinedload(Product.images).load_only(ProductImage.id, ProductImage.url, ProductImage.alt_text, ProductImage.sort_order),
        joinedload(Product.variants).load_only(ProductVariant.id, ProductVariant.name, ProductVariant.price_modifier, ProductVariant.stock),
    ).filter(Product.is_active == True)
    if category:
        q = q.filter(Product.category == category)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    results = q.order_by(Product.name).all()
    return results


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    cats = (
        db.query(Product.category)
        .filter(Product.is_active == True, Product.category.isnot(None))
        .distinct()
        .order_by(Product.category)
        .all()
    )
    return [c[0] for c in cats]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).options(
        joinedload(Product.images).load_only(ProductImage.id, ProductImage.url, ProductImage.alt_text, ProductImage.sort_order),
        joinedload(Product.variants).load_only(ProductVariant.id, ProductVariant.name, ProductVariant.price_modifier, ProductVariant.stock),
    ).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Producto no encontrado")
    return product
