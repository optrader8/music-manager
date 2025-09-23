#!/bin/bash

# Music Library Analysis Setup Script
# This script sets up and runs comprehensive analysis of the music library
# to identify skipped files, duplicates, and various issues.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
LIBRARY_PATH="/mnt/nas-music"
OUTPUT_DIR="$SCRIPT_DIR/analysis_reports"
VENV_PATH="$SCRIPT_DIR/venv"

echo -e "${BLUE}🎵 Music Library Analysis Setup${NC}"
echo "=================================="

# Function to print colored output
print_step() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if library path exists
if [ ! -d "$LIBRARY_PATH" ]; then
    print_error "Music library path does not exist: $LIBRARY_PATH"
    echo "Please check the path or update LIBRARY_PATH in this script."
    exit 1
fi

print_step "Found music library at: $LIBRARY_PATH"

# Check if virtual environment exists
if [ ! -d "$VENV_PATH" ]; then
    print_warning "Virtual environment not found. Creating new one..."
    python3 -m venv "$VENV_PATH"
    print_step "Created virtual environment"
fi

# Activate virtual environment
print_step "Activating virtual environment..."
source "$VENV_PATH/bin/activate"

# Install/update dependencies
print_step "Installing dependencies..."
cd "$BACKEND_DIR"

if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    # Install essential packages
    pip install sqlalchemy alembic mutagen
fi

# Create database tables for analysis (run migration)
print_step "Setting up database tables..."
if command -v alembic &> /dev/null; then
    # Run any pending migrations
    alembic upgrade head 2>/dev/null || {
        print_warning "Alembic migration failed or not configured. Continuing..."
    }
else
    print_warning "Alembic not available. Manual table creation may be needed."
fi

# Create output directory
print_step "Creating output directory..."
mkdir -p "$OUTPUT_DIR"

# Show analysis options
echo
echo -e "${BLUE}📊 Analysis Options:${NC}"
echo "1. Full analysis (scan all files, save to DB, export reports)"
echo "2. Quick analysis (export reports only, no DB save)"
echo "3. Custom analysis (specify parameters)"
echo

read -p "Choose option (1-3): " choice

case $choice in
    1)
        print_step "Running full analysis..."
        python3 scripts/analyze_library.py \
            --library-path "$LIBRARY_PATH" \
            --output-dir "$OUTPUT_DIR"
        ;;
    2)
        print_step "Running quick analysis..."
        python3 scripts/analyze_library.py \
            --library-path "$LIBRARY_PATH" \
            --output-dir "$OUTPUT_DIR" \
            --skip-db
        ;;
    3)
        echo "Custom analysis options:"
        read -p "Library path [$LIBRARY_PATH]: " custom_library
        read -p "Output directory [$OUTPUT_DIR]: " custom_output
        read -p "Skip database save? (y/N): " skip_db

        custom_library=${custom_library:-$LIBRARY_PATH}
        custom_output=${custom_output:-$OUTPUT_DIR}

        args="--library-path \"$custom_library\" --output-dir \"$custom_output\""
        if [[ $skip_db =~ ^[Yy]$ ]]; then
            args="$args --skip-db"
        fi

        print_step "Running custom analysis..."
        eval "python3 scripts/analyze_library.py $args"
        ;;
    *)
        print_error "Invalid option. Exiting."
        exit 1
        ;;
esac

# Check if analysis completed successfully
if [ $? -eq 0 ]; then
    echo
    print_step "Analysis completed successfully!"
    echo
    echo -e "${BLUE}📁 Results available at:${NC}"
    echo "   - Summary: $OUTPUT_DIR/analysis_summary.json"
    echo "   - Skipped files: $OUTPUT_DIR/skipped_files.json"
    echo "   - Duplicate files: $OUTPUT_DIR/duplicate_files.json"
    echo "   - Analysis log: $BACKEND_DIR/analysis.log"
    echo

    # Show quick summary if summary file exists
    if [ -f "$OUTPUT_DIR/analysis_summary.json" ]; then
        echo -e "${BLUE}📊 Quick Summary:${NC}"
        python3 -c "
import json
try:
    with open('$OUTPUT_DIR/analysis_summary.json', 'r') as f:
        data = json.load(f)
    print(f\"   Total files: {data.get('total_files_found', 0):,}\")
    print(f\"   Processed: {data.get('processed_files', 0):,}\")
    print(f\"   Skipped: {data.get('skipped_files_count', 0):,}\")
    print(f\"   Duplicates: {data.get('duplicate_files_count', 0):,}\")
except:
    pass
"
    fi

    echo
    echo -e "${GREEN}🎉 Analysis setup and execution complete!${NC}"

else
    print_error "Analysis failed. Check the logs for details."
    exit 1
fi

# Provide next steps
echo
echo -e "${BLUE}🔧 Next Steps:${NC}"
echo "1. Review the JSON reports in $OUTPUT_DIR"
echo "2. Check the database tables 'scan_logs' and 'duplicate_files' for detailed info"
echo "3. Use the reports to:"
echo "   - Identify and resolve metadata issues"
echo "   - Clean up duplicate files"
echo "   - Handle unsupported file formats"
echo
echo "To run analysis again: ./analyze.sh"