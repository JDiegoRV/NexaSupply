import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Product(Base):
    __tablename__ = "products"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name        = Column(String(200), nullable=False)
    description = Column(String(1000))
    price       = Column(Float, nullable=False)
    category    = Column(String(100))
    image_url   = Column(String(500))
    stock       = Column(Integer, nullable=False, default=0)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    images  = relationship("ProductImage", backref="product", cascade="all, delete-orphan", order_by="ProductImage.sort_order")
    variants = relationship("ProductVariant", backref="product", cascade="all, delete-orphan")
