import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id       = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False, index=True)
    sale_number    = Column(String(20), nullable=False, unique=True)
    client_name    = Column(String(200), nullable=True)
    client_document= Column(String(20), nullable=True)
    sale_type      = Column(String(10), nullable=True, default="boleta")
    subtotal       = Column(Float, nullable=False, default=0.0)
    discount       = Column(Float, nullable=False, default=0.0)
    igv            = Column(Float, nullable=False, default=0.0)
    total          = Column(Float, nullable=False, default=0.0)
    payment_method = Column(String(30), nullable=False, default="cash")
    notes          = Column(Text, nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan", lazy="joined")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_id      = Column(UUID(as_uuid=True), ForeignKey("sales.id"), nullable=False)
    product_id   = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    product_name = Column(String(200), nullable=False)
    quantity     = Column(Integer, nullable=False)
    unit_price   = Column(Float, nullable=False)
    subtotal     = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")
