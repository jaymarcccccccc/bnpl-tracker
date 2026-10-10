import os
from datetime import date

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text
from sqlalchemy.orm import Session, joinedload, selectinload

from . import services
from .database import get_db
from .models import Installment, Purchase
from .schemas import (
    DashboardOut,
    InstallmentOut,
    MonthOut,
    PayIn,
    PurchaseCreate,
    PurchaseOut,
    PurchaseUpdate,
)


app = FastAPI(title="BNPL Tracker API")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")]
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"]
)

router = APIRouter(prefix="/api")


def _purchase_or_404(db: Session, purchase_id: int) -> Purchase:
    stmt = (
        select(Purchase)
        .where(Purchase.id == purchase_id)
        .options(selectinload(Purchase.installments))
    )
    purchase = db.scalars(stmt).first()
    if purchase is None:
        raise HTTPException(404, "Purchase not found")
    return purchase


def _installment_or_404(db: Session, installment_id: int) -> Installment:
    stmt = (
        select(Installment)
        .where(Installment.id == installment_id)
        .options(joinedload(Installment.purchase))
    )
    inst = db.scalars(stmt).first()
    if inst is None:
        raise HTTPException(404, "Payment not found")
    return inst


# ---------- dashboard ----------
@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    today = date.today()
    insts = db.scalars(
        select(Installment).options(joinedload(Installment.purchase))
    ).all()

    paid = [i for i in insts if i.paid_on is not None]
    unpaid = [i for i in insts if i.paid_on is None]
    overdue = [i for i in unpaid if i.due_date < today]
    in_month = [
        i for i in insts
        if (i.due_date.year, i.due_date.month) == (today.year, today.month)
    ]

    up_next = sorted(unpaid, key=lambda i: (i.due_date, i.purchase_id, i.number))[:5]
    month_sorted = sorted(in_month, key=lambda i: (i.due_date, i.purchase_id, i.number))

    purchases = db.scalars(
        select(Purchase)
        .options(selectinload(Purchase.installments))
        .order_by(Purchase.created_at.desc())
    ).all()
    outs = [services.purchase_out(p, today) for p in purchases]
    active = sorted(
        (p for p in outs if p.status != "completed"),
        key=lambda p: p.next_due_date or date.max,
    )

    return DashboardOut(
        total_remaining=services.money(i.amount for i in unpaid),
        total_paid=services.money(i.amount for i in paid),
        active_purchases=len(active),
        overdue_count=len(overdue),
        overdue_amount=services.money(i.amount for i in overdue),
        month=today.strftime("%Y-%m"),
        month_total=services.money(i.amount for i in in_month),
        month_paid=services.money(i.amount for i in in_month if i.paid_on),
        month_remaining=services.money(i.amount for i in in_month if not i.paid_on),
        month_installments=[services.installment_out(i, today) for i in month_sorted],
        up_next=[services.installment_out(i, today) for i in up_next],
        active=active,
    )


# ---------- purchases ----------
@router.get("/purchases", response_model=list[PurchaseOut])
def list_purchases(db: Session = Depends(get_db)):
    today = date.today()
    purchases = db.scalars(
        select(Purchase)
        .options(selectinload(Purchase.installments))
        .order_by(Purchase.created_at.desc(), Purchase.id.desc())
    ).all()
    return [services.purchase_out(p, today) for p in purchases]


@router.post("/purchases", response_model=PurchaseOut, status_code=201)
def add_purchase(data: PurchaseCreate, db: Session = Depends(get_db)):
    purchase = services.create_purchase(db, data)
    return services.purchase_out(_purchase_or_404(db, purchase.id), date.today())


@router.get("/purchases/{purchase_id}", response_model=PurchaseOut)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    return services.purchase_out(_purchase_or_404(db, purchase_id), date.today())


@router.patch("/purchases/{purchase_id}", response_model=PurchaseOut)
def update_purchase(
    purchase_id: int, data: PurchaseUpdate, db: Session = Depends(get_db)
):
    purchase = _purchase_or_404(db, purchase_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        if key in ("item_name", "provider") and value is None:
            continue
        setattr(purchase, key, (value or None) if key == "notes" else value)
    db.commit()
    return services.purchase_out(_purchase_or_404(db, purchase_id), date.today())


@router.delete("/purchases/{purchase_id}", status_code=204)
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    db.delete(_purchase_or_404(db, purchase_id))
    db.commit()
    return Response(status_code=204)


# ---------- monthly tracker ----------
@router.get("/installments", response_model=MonthOut)
def month_view(
    month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
):
    today = date.today()
    month = month or today.strftime("%Y-%m")
    year, mon = (int(x) for x in month.split("-"))
    start = date(year, mon, 1)
    end = services.add_months(start, 1)

    def load(*conditions):
        return db.scalars(
            select(Installment)
            .where(*conditions)
            .options(joinedload(Installment.purchase))
            .order_by(Installment.due_date, Installment.purchase_id, Installment.number)
        ).all()

    items = load(Installment.due_date >= start, Installment.due_date < end)

    # Late payments from earlier months only matter on the current month's view.
    carried: list[Installment] = []
    if month == today.strftime("%Y-%m"):
        carried = load(Installment.due_date < start, Installment.paid_on.is_(None))

    return MonthOut(
        month=month,
        total=services.money(i.amount for i in items),
        paid=services.money(i.amount for i in items if i.paid_on),
        remaining=services.money(i.amount for i in items if not i.paid_on),
        items=[services.installment_out(i, today) for i in items],
        carried_over=[services.installment_out(i, today) for i in carried],
    )


# ---------- payment status ----------
@router.post("/installments/{installment_id}/pay", response_model=InstallmentOut)
def mark_paid(
    installment_id: int, payload: PayIn | None = None, db: Session = Depends(get_db)
):
    inst = _installment_or_404(db, installment_id)
    inst.paid_on = (payload.paid_on if payload else None) or date.today()
    db.commit()
    return services.installment_out(inst, date.today())


@router.post("/installments/{installment_id}/unpay", response_model=InstallmentOut)
def mark_unpaid(installment_id: int, db: Session = Depends(get_db)):
    inst = _installment_or_404(db, installment_id)
    inst.paid_on = None
    db.commit()
    return services.installment_out(inst, date.today())


@router.get("/health")
def health(db: Session = Depends(get_db)):
    """Open /api/health to confirm the backend can reach Supabase."""
    db.execute(text("select 1"))
    return {"ok": True}


app.include_router(router)
