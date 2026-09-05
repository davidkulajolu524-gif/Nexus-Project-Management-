from pathlib import Path

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker


DATABASE_PATH = Path(__file__).resolve().parent.parent / "nexus.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"


engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 10,
    },
)


@event.listens_for(engine, "connect")
def enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def ensure_schema():
    inspector = inspect(engine)
    task_columns = {
        column["name"]
        for column in inspector.get_columns("tasks")
    }

    if "due_date" not in task_columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE tasks ADD COLUMN due_date DATE"
                )
            )


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
