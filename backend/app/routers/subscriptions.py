import random
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import hash_password, create_access_token
from ..models.store import Store
from ..models.subscription import Subscription
from ..schemas import SubscriptionCheckout, TokenResponse

router = APIRouter()


@router.post("/checkout", response_model=TokenResponse)
def subscription_checkout(payload: SubscriptionCheckout, db: Session = Depends(get_db)):
    existing = db.query(Store).filter(Store.email == payload.store_data.email).first()
    if existing:
        raise HTTPException(400, "El email ya está registrado")

    if len(payload.store_data.password) < 6:
        raise HTTPException(400, "La contraseña debe tener al menos 6 caracteres")

    errors = []
    card_clean = payload.card_number.replace(" ", "").replace("-", "")
    if len(card_clean) != 16 or not card_clean.isdigit():
        errors.append("Número de tarjeta inválido (16 dígitos)")
    if len(payload.cvv) != 3 or not payload.cvv.isdigit():
        errors.append("CVV inválido (3 dígitos)")
    if not payload.expiry or len(payload.expiry) < 5:
        errors.append("Fecha de vencimiento inválida (MM/YY)")
    if errors:
        raise HTTPException(400, " | ".join(errors))

    if random.random() > 0.95:
        raise HTTPException(400, "Transacción rechazada. Intenta con otra tarjeta.")

    plan = payload.plan if payload.plan in ("basic", "premium") else "basic"
    sd = payload.store_data

    store = Store(
        name=sd.store_name,
        ruc=sd.store_ruc,
        address=sd.store_address,
        phone=sd.store_phone,
        owner_name=sd.owner_name,
        email=sd.email,
        password_hash=hash_password(sd.password),
        plan=plan,
        subscription_status="active",
    )
    db.add(store)
    db.flush()

    db.add(Subscription(store_id=store.id, plan=plan, status="active"))
    db.commit()
    db.refresh(store)

    token = create_access_token(data={"sub": str(store.id), "type": "store"})
    return TokenResponse(access_token=token, store_id=str(store.id), store_name=store.name)
