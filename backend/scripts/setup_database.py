#!/usr/bin/env python3
"""
Database setup script for Music Manager
Sets up database schema and creates admin user
"""

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import subprocess
from app.core.security import hash_password
from app.db.models import User, UserRole
from app.db.session import SessionLocal

def run_migrations():
    """Run database migrations."""
    print("🗄️  Setting up database schema...")
    try:
        # Run alembic upgrade
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=backend_dir,
            capture_output=True,
            text=True,
            check=True
        )
        print("✅ Database schema created successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Migration failed: {e}")
        print(f"Error output: {e.stderr}")
        return False
    except FileNotFoundError:
        print("❌ Alembic not found. Please install requirements.txt")
        return False

def create_admin_user():
    """Create admin user."""
    print("👤 Creating admin user...")

    session = SessionLocal()
    try:
        # Check if admin already exists
        existing = session.query(User).filter(User.email == "admin@music-manager.local").first()
        if existing:
            print("⚠️  Admin user already exists!")
            return True

        # Create admin user
        admin = User(
            email="admin@music-manager.local",
            display_name="Administrator",
            hashed_password=hash_password("admin123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        session.add(admin)
        session.commit()

        print("✅ Admin user created:")
        print("   📧 Email: admin@music-manager.local")
        print("   🔑 Password: admin123")
        print("   👑 Role: Admin")

        return True

    except Exception as e:
        print(f"❌ Failed to create admin user: {e}")
        session.rollback()
        return False
    finally:
        session.close()

def check_environment():
    """Check if environment is properly configured."""
    print("🔍 Checking environment...")

    # Check if .env exists
    env_file = backend_dir / ".env"
    if not env_file.exists():
        print("⚠️  .env file not found, using defaults")
        # Copy from example
        env_example = backend_dir / ".env.example"
        if env_example.exists():
            import shutil
            shutil.copy(env_example, env_file)
            print("✅ Created .env from .env.example")

    # Check music library path
    from app.core.config import settings
    if not settings.music_library_path.exists():
        print(f"⚠️  Music library path not found: {settings.music_library_path}")
        print("   Make sure /mnt/nas-music is mounted")
        return False

    print(f"✅ Music library found: {settings.music_library_path}")
    return True

def main():
    """Main setup function."""
    print("🎼 Music Manager - Database Setup")
    print("=" * 50)

    # Check environment
    if not check_environment():
        return 1

    # Run migrations
    if not run_migrations():
        return 1

    # Create admin user
    if not create_admin_user():
        return 1

    print("\n🎉 Database setup completed!")
    print("📝 Next steps:")
    print("   1. Run: python scripts/scan_music_library.py")
    print("   2. Start server: uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    print("   3. Open browser: http://localhost:8000/docs")

    return 0

if __name__ == "__main__":
    sys.exit(main())