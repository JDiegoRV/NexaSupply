import uuid
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from ..core.database import Base


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id     = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    name           = Column(String(100), nullable=False)
    price_modifier = Column(Float, default=0.0)
    stock          = Column(Integer, default=0)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
