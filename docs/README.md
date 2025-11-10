# Music Manager Documentation

Welcome to the Music Manager documentation. This directory contains comprehensive guides and API documentation for the Music Manager project.

## Documentation Index

### User Guides
- [File Browser User Guide](file-browser-guide.md) - Complete guide for using the file browser feature to manage music files

### API Documentation
- [File Browser API](file-browser-api.md) - REST API documentation for file browser endpoints

### Technical Documentation
- [Database Insertion Error Analysis](20250923-db-insertion-error-analysis.md) - Analysis of database insertion issues and solutions
- **[SubSonic API 분석](SubSonic_API_분석.md)** - SubSonic API implementation status, album listing, and streaming capabilities (NEW)

### 🔧 Troubleshooting & Diagnostics
- **[빠른_진단_체크리스트.md](빠른_진단_체크리스트.md)** - Quick 5-minute diagnostic checklist (START HERE!)
- **[현재_프로젝트_문제점_분석.md](현재_프로젝트_문제점_분석.md)** - Current project issue analysis and root cause
- [음악파일_조회_문제_진단.md](음악파일_조회_문제_진단.md) - Music file query problem diagnosis
- [Docker_환경_진단.md](Docker_환경_진단.md) - Docker environment diagnostics

## Quick Navigation

### For Users
- **Getting Started**: See the main [README.md](../README.md) for installation and setup instructions
- **File Management**: Check the [File Browser User Guide](file-browser-guide.md) for detailed usage instructions

### For Developers
- **API Reference**: Use the [File Browser API documentation](file-browser-api.md) for integration
- **Development Guidelines**: Refer to [CLAUDE.md](../CLAUDE.md) and [AGENTS.md](../AGENTS.md) for coding standards
- **Project Structure**: See the main README for overall project architecture

### For System Administrators
- **Security**: Review security considerations in the API documentation
- **Configuration**: Check environment variable requirements in the main README
- **Deployment**: Follow Docker setup instructions in the main README

## Feature Overview

The Music Manager includes the following major features:

### 🎵 Music Library Management
- Automatic music file scanning and database indexing
- Album artwork and metadata management
- Artist and album organization

### 📁 File Browser (Fully Implemented)
- **Directory Navigation**: Browse `/mnt/nas-music` directory structure
- **File Operations**: Delete, rename files and folders
- **MP3 Tag Editing**: Edit metadata for MP3 files (title, artist, album, genre, year, track number)
- **Search & Filter**: Real-time file search functionality
- **Security**: Path validation and access control to prevent directory traversal

### 📊 Statistics & Analytics
- Library overview statistics
- Genre, artist, and album analytics
- Detailed music collection insights

### 🎧 Playback & Streaming
- **SubSonic API Support** (Fully Implemented)
  - Compatible with SubSonic/OpenSubsonic clients
  - HTTP Range requests for seeking
  - Album and artist browsing
  - Music streaming and download
  - Search functionality
  - Playlist management
- Web-based music player (Planned)

### 🔌 SubSonic API Integration (NEW)
- **REST API**: `/rest/*` endpoints
- **Authentication**: Token-based and password authentication
- **Streaming**: Full support with HTTP Range requests
- **Album Listing**: Available via getArtist and search endpoints
- **Compatible Clients**: DSub, play:Sub, Ultrasonic, Sonixd, Sublime Music, etc.
- See [SubSonic API 분석](SubSonic_API_분석.md) for detailed information

## Troubleshooting

### 🚨 Music files not showing up?

If you can't see your music library after starting the Docker containers:

1. **Quick Fix (5 minutes)**: Follow [빠른_진단_체크리스트.md](빠른_진단_체크리스트.md)
2. **Root Cause Analysis**: Read [현재_프로젝트_문제점_분석.md](현재_프로젝트_문제점_분석.md)
3. **Detailed Diagnostics**: See [음악파일_조회_문제_진단.md](음악파일_조회_문제_진단.md)

**Common Issue (CRITICAL)**: `docker-compose.yml` has wrong path
```yaml
# ❌ Wrong
MUSIC_LIBRARY_PATH=/music

# ✅ Correct
MUSIC_LIBRARY_PATH=/mnt/nas-music
```

Quick fix:
```bash
# Edit docker-compose.yml, then:
docker-compose down
docker-compose up -d
docker exec music-manager-backend python scripts/scan_music_library.py
```

### 🐳 Docker issues?

See [Docker_환경_진단.md](Docker_환경_진단.md) for:
- Container status checks
- Log analysis
- Network diagnostics
- Volume mount issues

## Support

If you have questions or need help:

1. **Troubleshooting**: Check the diagnostic documents above
2. **User Guides**: Review the relevant user guide or API documentation
3. **Setup Issues**: Check the main project README
4. **Bug Reports**: Submit issues via GitHub Issues

## Contributing

For development contributions:

1. Read the [development guidelines](../AGENTS.md)
2. Follow the [coding standards](../CLAUDE.md)
3. Ensure proper testing before submitting PRs

---

*Last updated: 2025-11-10*
*SubSonic API analysis added - streaming and album listing capabilities confirmed*
*Diagnostic documents added for troubleshooting music file query issues*