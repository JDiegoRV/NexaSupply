from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import decode_access_token
from ..models.product_review import ProductReview
from ..models.order import Order, OrderItem
from ..models.store import Store
from ..schemas import ReviewCreate, ReviewResponse, ReviewStats

router = APIRouter()


def _get_store_id(authorization: str = Header(None)) -> str:
    if authorization and authorization.startswith("Bearer "):
        payload = decode_access_token(authorization.split(" ", 1)[1])
        if payload and payload.get("type") == "store":
            return payload["sub"]
    raise HTTPException(401, "Autenticación requerida")


@router.post("", response_model=ReviewResponse, status_code=201)
def create_review(payload: ReviewCreate, store_id: str = Depends(_get_store_id), db: Session = Depends(get_db)):
    if not (1 <= payload.rating <= 5):
        raise HTTPException(400, "La valoración debe ser entre 1 y 5")

    order = db.query(Order).filter(
        Order.id == payload.order_id,
        Order.store_id == store_id,
        Order.tracking_status == "delivered",
    ).first()
    if not order:
        raise HTTPException(400, "Orden no encontrada o aún no entregada")

    order_item = db.query(OrderItem).filter(
        OrderItem.order_id == payload.order_id,
        OrderItem.product_id == payload.product_id,
    ).first()
    if not order_item:
        raise HTTPException(400, "El producto no está en esa orden")

    existing = db.query(ProductReview).filter(
        ProductReview.product_id == payload.product_id,
        ProductReview.store_id == store_id,
    ).first()
    if existing:
        raise HTTPException(400, "Ya dejaste una opinión para este producto")

    review = ProductReview(
        product_id=payload.product_id,
        store_id=store_id,
        order_id=payload.order_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    store = db.query(Store).get(store_id)
    return ReviewResponse(
        id=str(review.id),
        store_name=store.name if store else "Bodega",
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
    )


@router.get("/product/{product_id}", response_model=list[ReviewResponse])
def list_reviews(product_id: str, db: Session = Depends(get_db)):
    reviews = (
        db.query(ProductReview)
        .filter(ProductReview.product_id == product_id)
        .order_by(ProductReview.created_at.desc())
        .all()
    )
    result = []
    for r in reviews:
        store = db.query(Store).get(r.store_id)
        result.append(ReviewResponse(
            id=str(r.id),
            store_name=store.name if store else "Bodega",
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
        ))
    return result


@router.get("/product/{product_id}/stats", response_model=ReviewStats)
def review_stats(product_id: str, db: Session = Depends(get_db)):
    reviews = db.query(ProductReview).filter(ProductReview.product_id == product_id).all()
    if not reviews:
        return ReviewStats(
            average_rating=0.0,
            total_reviews=0,
            distribution={"1": 0, "2": 0, "3": 0, "4": 0, "5": 0},
        )
    dist = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    for r in reviews:
        dist[str(r.rating)] += 1
    avg = sum(r.rating for r in reviews) / len(reviews)
    return ReviewStats(
        average_rating=round(avg, 1),
        total_reviews=len(reviews),
        distribution=dist,
    )
