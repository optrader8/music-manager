#!/usr/bin/env python3
"""
Complete setup script for Music Manager
Runs database setup and music library scan
"""

import sys
import subprocess
from pathlib import Path

def run_script(script_name: str) -> bool:
    """Run a Python script and return success status."""
    script_path = Path(__file__).parent / script_name
    print(f"\n{'='*60}")
    print(f"🚀 Running {script_name}")
    print(f"{'='*60}")

    try:
        result = subprocess.run([sys.executable, str(script_path)], check=True)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"❌ {script_name} failed with exit code {e.returncode}")
        return False
    except Exception as e:
        print(f"❌ Error running {script_name}: {e}")
        return False

def main():
    """Run complete setup process."""
    print("🎼 Music Manager - Complete Setup")
    print("🎯 This will:")
    print("   1. Setup database schema")
    print("   2. Create admin user")
    print("   3. Scan /mnt/nas-music library")
    print()

    # Auto-continue for automated execution
    print("Proceeding with setup...")

    # Step 1: Database setup
    if not run_script("setup_database.py"):
        print("\n❌ Database setup failed!")
        return 1

    # Step 2: Music library scan
    if not run_script("scan_music_library.py"):
        print("\n❌ Music library scan failed!")
        return 1

    # Success!
    print("\n" + "="*60)
    print("🎉 SETUP COMPLETE!")
    print("="*60)
    print("✅ Database configured")
    print("✅ Admin user created (admin@music-manager.local / admin123)")
    print("✅ Music library scanned")
    print()
    print("🌐 Ready to start the server:")
    print("   cd backend")
    print("   uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    print()
    print("📖 API Documentation: http://localhost:8000/docs")

    return 0

if __name__ == "__main__":
    sys.exit(main())