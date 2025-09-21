#!/usr/bin/env python3
"""Script to create an admin user for the Music Manager system."""

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.security import hash_password
from app.db.models import User, UserRole
from app.db.session import SessionLocal


def create_admin_user(
    email: str = "admin@music-manager.local",
    password: str = "admin123",
    display_name: str = "Administrator",
):
    """Create an admin user in the database."""
    session = SessionLocal()
    try:
        # Check if admin user already exists
        existing_user = session.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User with email {email} already exists!")
            return

        # Create new admin user
        admin_user = User(
            email=email,
            display_name=display_name,
            hashed_password=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
        )
        session.add(admin_user)
        session.commit()

        print(f"✅ Admin user created successfully!")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   Display Name: {display_name}")
        print(f"   Role: {UserRole.ADMIN}")

    except Exception as e:
        session.rollback()
        print(f"❌ Failed to create admin user: {e}")
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Create an admin user")
    parser.add_argument("--email", default="admin@music-manager.local", help="Admin email")
    parser.add_argument("--password", default="admin123", help="Admin password")
    parser.add_argument("--name", default="Administrator", help="Display name")

    args = parser.parse_args()

    print("Creating admin user...")
    create_admin_user(
        email=args.email,
        password=args.password,
        display_name=args.name,
    )