from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

InstallmentStatus = Literal["paid", "overdue", "due_soon", "upcoming"]
PurchaseStatus = Literal["active", "overdue", "completed"]


# ---------- input ----------
class PurchaseCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    item_name: str = Field(min_length=1, max_length=200)
    provider: str = Field(min_length=1, max_length=100)
    total_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    num_installments: int = Field(ge=1, le=60)
    first_due_date: date
    notes: str | None = Field(default=None, max_length=1000)


class PurchaseUpdate(BaseModel):
    """Only descriptive fields can change. To change the amount or schedule,
    delete the purchase and add it again."""

    model_config = ConfigDict(str_strip_whitespace=True)

    item_name: str | None = Field(default=None, min_length=1, max_length=200)
    provider: str | None = Field(default=None, min_length=1, max_length=100)
    notes: str | None = Field(default=None, max_length=1000)


class PayIn(BaseModel):
    paid_on: date | None = None


# ---------- output ----------
class InstallmentOut(BaseModel):
    id: int
    purchase_id: int
    number: int
    num_installments: int
    item_name: str
    provider: str
    due_date: date
    amount: float
    paid_on: date | None
    status: InstallmentStatus


class PurchaseOut(BaseModel):
    id: int
    item_name: str
    provider: str
    total_amount: float
    num_installments: int
    first_due_date: date
    notes: str | None
    paid_amount: float
    remaining_amount: float
    paid_count: int
    status: PurchaseStatus
    next_due_date: date | None
    installments: list[InstallmentOut]


class DashboardOut(BaseModel):
    total_remaining: float
    total_paid: float
    active_purchases: int
    overdue_count: int
    overdue_amount: float
    month: str
    month_total: float
    month_paid: float
    month_remaining: float
    month_installments: list[InstallmentOut]
    up_next: list[InstallmentOut]
    active: list[PurchaseOut]


class MonthOut(BaseModel):
    month: str
    total: float
    paid: float
    remaining: float
    items: list[InstallmentOut]
    carried_over: list[InstallmentOut]
