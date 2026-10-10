"""Optional sample data: python seed.py"""
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import SessionLocal
from app.models import Purchase
from app.schemas import PurchaseCreate
from app.services import add_months, create_purchase

today = date.today()

SAMPLES = [
    # (item, provider, total, installments, first due date, payments already made)
    ("Laptop", "Atome", "36000.00", 6, add_months(today.replace(day=15), -2), 2),
    ("Running shoes", "SPayLater", "6000.00", 3, add_months(today.replace(day=5), -1), 0),
    ("Standing desk", "Billease", "12000.00", 4, add_months(today.replace(day=20), 1), 0),
    ("Headphones", "Klarna", "4800.00", 4, add_months(today.replace(day=1), -4), 4),
]

with SessionLocal() as db:
    if db.scalars(select(Purchase)).first():
        raise SystemExit("Database already has purchases; skipping seed.")
    for item, provider, total, n, first_due, paid in SAMPLES:
        p = create_purchase(
            db,
            PurchaseCreate(
                item_name=item,
                provider=provider,
                total_amount=Decimal(total),
                num_installments=n,
                first_due_date=first_due,
            ),
        )
        p = db.scalars(
            select(Purchase).where(Purchase.id == p.id).options(selectinload(Purchase.installments))
        ).one()
        for inst in p.installments[:paid]:
            inst.paid_on = inst.due_date
        db.commit()
    print("Seeded sample purchases.")
