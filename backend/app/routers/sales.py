from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import decode_access_token
from ..models.sale import Sale, SaleItem
from ..models.inventory import InventoryItem
from ..models.product import Product
from ..schemas import SaleCreate, SaleResponse, SaleSummary

router = APIRouter()


def _get_store_id(authorization: str = Header(None)) -> str:
    if authorization and authorization.startswith("Bearer "):
        payload = decode_access_token(authorization.split(" ", 1)[1])
        if payload and payload.get("type") == "store":
            return payload["sub"]
    raise HTTPException(401, "Autenticación requerida")


def _to_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


@router.get("/summary", response_model=SaleSummary)
def get_summary(store_id: str = Depends(_get_store_id), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    all_sales = db.query(Sale).filter(Sale.store_id == store_id).all()
    today_sales = [s for s in all_sales if _to_utc(s.created_at) >= today_start]
    month_sales = [s for s in all_sales if _to_utc(s.created_at) >= month_start]

    total_today = sum(s.total for s in today_sales)
    total_month = sum(s.total for s in month_sales)
    total_all = sum(s.total for s in all_sales)
    avg_ticket = total_all / len(all_sales) if all_sales else 0.0

    return SaleSummary(
        sales_today=len(today_sales),
        sales_month=len(month_sales),
        total_today=round(total_today, 2),
        total_month=round(total_month, 2),
        total_all_time=round(total_all, 2),
        avg_ticket=round(avg_ticket, 2),
    )


@router.get("", response_model=list[SaleResponse])
def list_sales(store_id: str = Depends(_get_store_id), db: Session = Depends(get_db)):
    return db.query(Sale).filter(Sale.store_id == store_id).order_by(Sale.created_at.desc()).all()


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: str, store_id: str = Depends(_get_store_id), db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id, Sale.store_id == store_id).first()
    if not sale:
        raise HTTPException(404, "Venta no encontrada")
    return sale


@router.post("", response_model=SaleResponse, status_code=201)
def create_sale(payload: SaleCreate, store_id: str = Depends(_get_store_id), db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(400, "La venta debe tener al menos un producto")

    for item in payload.items:
        inv = db.query(InventoryItem).filter(
            InventoryItem.store_id == store_id,
            InventoryItem.product_id == item.product_id,
        ).first()
        if not inv or inv.quantity < item.quantity:
            product = db.query(Product).get(item.product_id)
            name = product.name if product else item.product_id
            available = inv.quantity if inv else 0
            raise HTTPException(400, f"Stock insuficiente para {name}: disponible {available}")

    subtotal = round(sum(i.quantity * i.unit_price for i in payload.items), 2)
    discount = round(payload.discount or 0.0, 2)
    igv = round((subtotal - discount) * 0.18, 2)
    total = round(subtotal - discount + igv, 2)

    count = db.query(Sale).filter(Sale.store_id == store_id).count()
    sale_number = f"VTA-{count + 1:05d}"

    sale = Sale(
        store_id=store_id,
        sale_number=sale_number,
        client_name=payload.client_name,
        client_document=payload.client_document,
        sale_type=payload.sale_type or "boleta",
        subtotal=subtotal,
        discount=discount,
        igv=igv,
        total=total,
        payment_method=payload.payment_method,
        notes=payload.notes,
    )
    db.add(sale)
    db.flush()

    for item in payload.items:
        product = db.query(Product).get(item.product_id)
        db.add(SaleItem(
            sale_id=sale.id,
            product_id=item.product_id,
            product_name=product.name if product else "Producto",
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=round(item.quantity * item.unit_price, 2),
        ))
        inv = db.query(InventoryItem).filter(
            InventoryItem.store_id == store_id,
            InventoryItem.product_id == item.product_id,
        ).first()
        inv.quantity -= item.quantity

    db.commit()
    db.refresh(sale)
    return sale
