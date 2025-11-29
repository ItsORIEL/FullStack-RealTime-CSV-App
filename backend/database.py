from sqlmodel import SQLModel, create_engine, Session

# Database Connection URL
# ⚠️ Ensure 'YOUR_PASSWORD' is correct!
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/csv_db"

# Create the engine (the connection factory)
engine = create_engine(DATABASE_URL)

def create_db_and_tables():
    """Create tables in the DB if they don't exist yet."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Provides a fresh database session for each request."""
    with Session(engine) as session:
        yield session