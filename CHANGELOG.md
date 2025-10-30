# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Automatic bleed generation for local files** - Images now automatically get bleed added when uploaded, with option to revert to original
- **Zip download functionality** - Download all cards as a zip file with duplicate removal
- **Scryfall decklist import** - Import card lists directly from Scryfall using decklist format
- **Advanced image processing options**:
  - Max DPI setting (300-1000) for high-resolution images
  - JPG conversion with custom quality settings
  - WebP file format support
  - Manual bleed addition action
- **Enhanced UI and user experience**:
  - Complete UI redesign with new sidebar and paginated preview
  - Drag and drop with visual overlay
  - Card selection and bulk operations
  - Card reordering functionality
  - Context menu for card actions
  - Cross guides visibility toggle
  - Advanced settings organized in tabs
- **Performance improvements**:
  - React Query integration for image fetching
  - Better loading indicators and progress tracking

### Changed

- **Completely custom PDF generation** - PDF is now generated with one image per card
- **Guide thickness is in milimeters** - No more confusing "pixel" values

### Technical

- Migrated to Panda CSS + Ark UI component system
- Added test coverage with Vitest
- Implemented proper TypeScript path aliases
- Enhanced build pipeline and CI/CD workflows
- Added React Query dev tools support
- Improved code organization with component refactoring
- Added prettier

## [0.0.0]

Initial release with MPCFill import, various settings, using screenshot to generate PDF pages.
