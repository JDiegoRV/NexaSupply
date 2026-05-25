import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from ..core.database import Base


class ProductImage(Base):
    __tablename__ = "product_images"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id  = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    url         = Column(String(500), nullable=False)
    alt_text    = Column(String(200))
    sort_order  = Column(Integer, default=0)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
