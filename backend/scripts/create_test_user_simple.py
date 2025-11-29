#!/usr/bin/env python3
"""Create a test user directly in the database."""
import asyncio
import os
import bcrypt
import asyncpg


async def create_test_user():
    """Create a test user in the database."""
    # Get database credentials from environment
    db_host = os.getenv("DB_HOST")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_name = os.getenv("DB_NAME")
    
    if not all([db_host, db_user, db_password, db_name]):
        print("Error: Database environment variables not set")
        print("Required: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME")
        return
    
    # Connect to database
    conn = await asyncpg.connect(
        host=db_host,
        user=db_user,
        password=db_password,
        database=db_name,
    )
    
    email = "test@amara.ai"
    password = "test123"
    
    # Hash password
    hashed_password = bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")
    
    try:
        # Check if user exists
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", email
        )
        
        if existing:
            print(f"User {email} already exists")
            # Update password
            await conn.execute(
                "UPDATE users SET hashed_password = $1 WHERE email = $2",
                hashed_password,
                email,
            )
            print(f"✓ Updated password for {email}")
        else:
            # Create new user
            await conn.execute(
                """
                INSERT INTO users (email, hashed_password, full_name, role, is_active)
                VALUES ($1, $2, $3, $4, $5)
                """,
                email,
                hashed_password,
                "Test User",
                "admin",
                True,
            )
            print(f"✓ Created user {email}")
        
        print(f"\n{'='*50}")
        print(f"Login Credentials:")
        print(f"{'='*50}")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"{'='*50}")
        
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(create_test_user())