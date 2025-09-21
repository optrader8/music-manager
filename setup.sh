#!/bin/bash

# Music Manager - Complete Setup Script
# Run from project root directory

set -e  # Exit on any error

echo "🎼 Music Manager - Complete Setup"
echo "=================================="
echo ""

# Check if we're in the correct directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected: /path/to/music-manager/"
    echo "   Current:  $(pwd)"
    exit 1
fi

PROJECT_ROOT="$(pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "📂 Project root: $PROJECT_ROOT"
echo "📂 Backend dir:  $BACKEND_DIR"
echo ""

# Change to backend directory
cd "$BACKEND_DIR"

echo "🔍 Checking environment..."

# Check if .env exists, create from example if not
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📋 Creating .env from .env.example"
        cp .env.example .env
    else
        echo "❌ Error: No .env or .env.example file found"
        exit 1
    fi
fi

# Check if music library path exists
MUSIC_PATH="/mnt/nas-music"
if [ ! -d "$MUSIC_PATH" ]; then
    echo "⚠️  Warning: Music library path not found: $MUSIC_PATH"
    echo "   Make sure the NAS is mounted"
    read -p "   Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🗄️  Setting up database..."

# Set database URL to use absolute path
export DATABASE_URL="sqlite:///$BACKEND_DIR/music_manager.db"
echo "   Database URL: $DATABASE_URL"

# Try Alembic first, then fall back to direct table creation
echo "   Attempting Alembic migration..."
if alembic upgrade head 2>/dev/null; then
    echo "✅ Database schema created via Alembic"
else
    echo "⚠️  Alembic failed, using Python script..."
    # Use our Python setup script
    python3 scripts/setup_database.py
    if [ $? -ne 0 ]; then
        echo "❌ Database setup failed!"
        exit 1
    fi
fi

echo ""
echo "🎵 Scanning music library..."

# Run music library scan
python3 scripts/scan_music_library.py
if [ $? -ne 0 ]; then
    echo "❌ Music library scan failed!"
    exit 1
fi

echo ""
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo "✅ Database configured"
echo "✅ Admin user created (admin@music-manager.local / admin123)"
echo "✅ Music library scanned"
echo ""
echo "🚀 To start the server:"
echo "   cd backend"
echo "   uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "📖 API Documentation: http://localhost:8000/docs"
echo ""