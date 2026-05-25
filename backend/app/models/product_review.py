import uuid
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from ..core.database import Base


class ProductReview(Base):
    __tablename__ = "product_reviews"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    store_id   = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    order_id   = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    rating     = Column(Integer, nullable=False)
    comment    = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("product_id", "store_id", name="uq_review_product_store"),
    )
