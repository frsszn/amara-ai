"""
Database service for Cloud SQL PostgreSQL.
Supports both Cloud Run (via Cloud SQL Connector) and local development.
"""
import asyncio
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.core.config import settings

Base = declarative_base()

_engine = None
_async_session_factory = None
_connector = None


def get_database_url() -> str:
    """
    Build database URL based on environment.
    - If DATABASE_URL is set, use it directly (local dev)
    - If CLOUD_SQL_CONNECTION_NAME is set, use Cloud SQL Connector
    """
    if settings.DATABASE_URL:
        # Direct connection URL (local development)
        # Convert postgres:// to postgresql+asyncpg://
        url = settings.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    # Build URL for local PostgreSQL
    return f"postgresql+asyncpg://{settings.DB_USER}:{settings.DB_PASS}@localhost:5432/{settings.DB_NAME}"


async def init_db():
    """Initialize database engine and session factory."""
    global _engine, _async_session_factory, _connector

    # Priority: DATABASE_URL (local) > CLOUD_SQL_CONNECTION_NAME (Cloud Run)
    if settings.DATABASE_URL:
        # Local development with direct connection
        database_url = get_database_url()
        _engine = create_async_engine(
            database_url,
            pool_size=5,
            max_overflow=2,
            pool_timeout=30,
            pool_recycle=1800,
            echo=False,
        )
    elif settings.CLOUD_SQL_CONNECTION_NAME:
        # Cloud Run with Cloud SQL Connector
        from google.cloud.sql.connector import Connector

        # Initialize connector with current event loop
        loop = asyncio.get_running_loop()
        _connector = Connector(loop=loop)

        async def getconn():
            conn = await _connector.connect_async(
                settings.CLOUD_SQL_CONNECTION_NAME,
                "asyncpg",
                user=settings.DB_USER,
                password=settings.DB_PASS,
                db=settings.DB_NAME,
            )
            return conn

        _engine = create_async_engine(
            "postgresql+asyncpg://",
            async_creator=getconn,
            pool_size=5,
            max_overflow=2,
            pool_timeout=30,
            pool_recycle=1800,
        )
    else:
        raise ValueError("No database configuration found. Set DATABASE_URL or CLOUD_SQL_CONNECTION_NAME")

    _async_session_factory = async_sessionmaker(
        bind=_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


async def close_db():
    """Close database connections."""
    global _engine, _connector
    if _engine:
        await _engine.dispose()
    if _connector:
        await _connector.close_async()


@asynccontextmanager
async def get_db_session():
    """Get async database session."""
    if _async_session_factory is None:
        await init_db()

    async with _async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_db():
    """FastAPI dependency for database sessions."""
    async with get_db_session() as session:
        yield session


async def check_db_connection() -> dict:
    """Health check for database connectivity."""
    try:
        async with get_db_session() as session:
            await session.execute(text("SELECT 1"))
            return {"status": "connected", "message": "Database is reachable"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
