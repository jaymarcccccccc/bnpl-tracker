import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()


def _database_url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Copy backend/.env.example to backend/.env and "
            "paste your Supabase connection string."
        )
    # Supabase hands out postgresql:// URLs; SQLAlchemy needs the driver name (psycopg 3).
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


engine = create_engine(
    _database_url(),
    pool_pre_ping=True,
    pool_recycle=300,
    # Supabase's transaction pooler (port 6543) doesn't support prepared statements.
    # Turning them off also works fine on the session pooler and direct connection.
    connect_args={"prepare_threshold": None},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
