from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_name: Mapped[str] = mapped_column(String(200))
    provider: Mapped[str] = mapped_column(String(100))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    num_installments: Mapped[int] = mapped_column(Integer)
    first_due_date: Mapped[date] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    installments: Mapped[list["Installment"]] = relationship(
        back_populates="purchase",
        cascade="all, delete-orphan",
        order_by="Installment.number",
    )


class Installment(Base):
    __tablename__ = "installments"
    __table_args__ = (UniqueConstraint("purchase_id", "number"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    purchase_id: Mapped[int] = mapped_column(
        ForeignKey("purchases.id", ondelete="CASCADE")
    )
    number: Mapped[int] = mapped_column(Integer)
    due_date: Mapped[date] = mapped_column(Date, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    paid_on: Mapped[date | None] = mapped_column(Date, nullable=True)

    purchase: Mapped[Purchase] = relationship(back_populates="installments")
