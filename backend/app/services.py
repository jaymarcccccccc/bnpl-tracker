import calendar
from datetime import date
from decimal import ROUND_DOWN, Decimal

from sqlalchemy.orm import Session

from .models import Installment, Purchase
from .schemas import InstallmentOut, PurchaseCreate, PurchaseOut

CENT = Decimal("0.01")
DUE_SOON_DAYS = 7


# ---------- schedule building ----------
def add_months(d: date, months: int) -> date:
    """Add calendar months, clamping the day (Jan 31 + 1 month = Feb 28/29)."""
    index = d.month - 1 + months
    year = d.year + index // 12
    month = index % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def split_amount(total: Decimal, n: int) -> list[Decimal]:
    """Split evenly to the cent; the last payment absorbs any rounding."""
    base = (total / n).quantize(CENT, rounding=ROUND_DOWN)
    amounts = [base] * n
    amounts[-1] = total - base * (n - 1)
    return amounts


def create_purchase(db: Session, data: PurchaseCreate) -> Purchase:
    amounts = split_amount(data.total_amount, data.num_installments)
    purchase = Purchase(
        item_name=data.item_name,
        provider=data.provider,
        total_amount=data.total_amount,
        num_installments=data.num_installments,
        first_due_date=data.first_due_date,
        notes=data.notes or None,
        installments=[
            Installment(
                number=i + 1,
                # Always count from the first date so Jan 31 -> Feb 28 -> Mar 31.
                due_date=add_months(data.first_due_date, i),
                amount=amounts[i],
            )
            for i in range(data.num_installments)
        ],
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return purchase


# ---------- status ----------
def installment_status(inst: Installment, today: date) -> str:
    if inst.paid_on is not None:
        return "paid"
    if inst.due_date < today:
        return "overdue"
    if (inst.due_date - today).days <= DUE_SOON_DAYS:
        return "due_soon"
    return "upcoming"


def money(values) -> float:
    return float(sum(values, Decimal("0")))


# ---------- output mapping ----------
def installment_out(inst: Installment, today: date) -> InstallmentOut:
    p = inst.purchase
    return InstallmentOut(
        id=inst.id,
        purchase_id=inst.purchase_id,
        number=inst.number,
        num_installments=p.num_installments,
        item_name=p.item_name,
        provider=p.provider,
        due_date=inst.due_date,
        amount=float(inst.amount),
        paid_on=inst.paid_on,
        status=installment_status(inst, today),
    )


def purchase_out(p: Purchase, today: date) -> PurchaseOut:
    paid = [i for i in p.installments if i.paid_on is not None]
    unpaid = [i for i in p.installments if i.paid_on is None]

    if not unpaid:
        status = "completed"
    elif any(i.due_date < today for i in unpaid):
        status = "overdue"
    else:
        status = "active"

    return PurchaseOut(
        id=p.id,
        item_name=p.item_name,
        provider=p.provider,
        total_amount=float(p.total_amount),
        num_installments=p.num_installments,
        first_due_date=p.first_due_date,
        notes=p.notes,
        paid_amount=money(i.amount for i in paid),
        remaining_amount=money(i.amount for i in unpaid),
        paid_count=len(paid),
        status=status,
        next_due_date=min((i.due_date for i in unpaid), default=None),
        installments=[installment_out(i, today) for i in p.installments],
    )
