from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import decode_access_token
from ..models.order import Order, OrderItem
from ..models.product import Product
from ..models.inventory import InventoryItem
from ..schemas import OrderResponse, OrderItemResponse
from fastapi import Header

router = APIRouter()


def _get_store_id(authorization: str = Header(None)) -> str:
    if authorization and authorization.startswith("Bearer "):
        payload = decode_access_token(authorization.split(" ", 1)[1])
        if payload and payload.get("type") == "store":
            return payload["sub"]
    raise HTTPException(401, "Autenticación requerida")


@router.get("/", response_model=list[OrderResponse])
def list_orders(
    store_id: str = Depends(_get_store_id),
    db: Session = Depends(get_db),
):
    return _list_orders(store_id, db)


@router.get("/my", response_model=list[OrderResponse])
def list_my_orders(
    store_id: str = Depends(_get_store_id),
    db: Session = Depends(get_db),
):
    """Alias para /orders/ — usado por el frontend."""
    return _list_orders(store_id, db)


def _list_orders(store_id: str, db: Session):
    orders = (
        db.query(Order)
        .filter(Order.store_id == store_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    result = []
    for o in orders:
        items = [
            OrderItemResponse(
                product_id=str(i.product_id),
                product_name=db.query(Product).get(i.product_id).name,
                quantity=i.quantity,
                unit_price=i.unit_price,
            )
            for i in o.items
        ]
        result.append(OrderResponse(
            id=str(o.id),
            order_number=o.order_number,
            total=o.total,
            tracking_status=o.tracking_status,
            status_history=o.status_history or [],
            payment_method=o.payment_method,
            paid_at=o.paid_at,
            delivered_at=o.delivered_at,
            created_at=o.created_at,
            items=items,
        ))
    return result


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    store_id: str = Depends(_get_store_id),
    db: Session = Depends(get_db),
):
    o = db.query(Order).filter(Order.id == order_id, Order.store_id == store_id).first()
    if not o:
        raise HTTPException(404, "Orden no encontrada")
    items = [
        OrderItemResponse(
            product_id=str(i.product_id),
            product_name=db.query(Product).get(i.product_id).name,
            quantity=i.quantity,
            unit_price=i.unit_price,
        )
        for i in o.items
    ]
    return OrderResponse(
        id=str(o.id),
        order_number=o.order_number,
        total=o.total,
        tracking_status=o.tracking_status,
        status_history=o.status_history or [],
        payment_method=o.payment_method,
        paid_at=o.paid_at,
        delivered_at=o.delivered_at,
        created_at=o.created_at,
        items=items,
    )


@router.post("/{order_id}/advance")
def advance_tracking(
    order_id: str,
    store_id: str = Depends(_get_store_id),
    db: Session = Depends(get_db),
):
    """Avanza manualmente el tracking de una orden (bodeguero o admin)."""
    order = db.query(Order).filter(Order.id == order_id, Order.store_id == store_id).first()
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
        # Actualizar inventario igual que en receive_order
        for item in order.items:
            inv = (
                db.query(InventoryItem)
                .filter(InventoryItem.store_id == store_id, InventoryItem.product_id == item.product_id)
                .first()
            )
            if inv:
                inv.quantity += item.quantity
            else:
                db.add(InventoryItem(store_id=store_id, product_id=item.product_id, quantity=item.quantity))

    db.commit()
    return {
        "order_id": str(order.id),
        "tracking_status": order.tracking_status,
        "status_history": order.status_history,
        "inventory_updated": len(order.items) if next_status == "delivered" else 0,
    }


@router.post("/{order_id}/receive")
def receive_order(
    order_id: str,
    store_id: str = Depends(_get_store_id),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id, Order.store_id == store_id).first()
    if not order:
        raise HTTPException(404, "Orden no encontrada")
    if order.tracking_status != "in_transit":
        raise HTTPException(400, "Solo se puede recibir pedidos en ruta")

    now = datetime.now(timezone.utc)
    order.tracking_status = "delivered"
    order.delivered_at = now
    history = order.status_history or []
    history.append({"status": "delivered", "timestamp": now.isoformat()})
    order.status_history = history

    # Sumar al inventario
    for item in order.items:
        inv = (
            db.query(InventoryItem)
            .filter(InventoryItem.store_id == store_id, InventoryItem.product_id == item.product_id)
            .first()
        )
        if inv:
            inv.quantity += item.quantity
        else:
            db.add(InventoryItem(store_id=store_id, product_id=item.product_id, quantity=item.quantity))

    db.commit()
    return {"order_id": str(order.id), "status": "delivered", "inventory_updated": len(order.items)}
