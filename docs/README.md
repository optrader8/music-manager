# Music Manager Documentation

Welcome to the Music Manager documentation. This directory contains comprehensive guides and API documentation for the Music Manager project.

## Documentation Index

### User Guides
- [File Browser User Guide](file-browser-guide.md) - Complete guide for using the file browser feature to manage music files

### API Documentation
- [File Browser API](file-browser-api.md) - REST API documentation for file browser endpoints

### Technical Documentation
- [Database Insertion Error Analysis](20250923-db-insertion-error-analysis.md) - Analysis of database insertion issues and solutions

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

### 🎧 Playback & Streaming (Planned)
- Web-based music player
- Streaming capabilities
- Playlist management

## Support

If you have questions or need help:

1. Check the relevant user guide or API documentation
2. Review the main project README for setup issues
3. Submit issues via GitHub Issues for bug reports or feature requests

## Contributing

For development contributions:

1. Read the [development guidelines](../AGENTS.md)
2. Follow the [coding standards](../CLAUDE.md)
3. Ensure proper testing before submitting PRs

---

*Last updated: 2024-09-27*