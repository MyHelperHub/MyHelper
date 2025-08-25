# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server
pnpm run dev

# Production development
pnpm run dev:prod

# Type checking
pnpm run check
vue-tsc --noEmit

# Build for production
pnpm run build
pnpm run build:prod

# Format code
pnpm run format

# Tauri development
pnpm run tauri dev
pnpm run tauri:dev:prod

# Tauri build
pnpm run tauri build
pnpm run tauri build:prod
```

## Architecture Overview

MyHelper is a cross-platform efficiency tool built with **Tauri v2 + Vue 3 + TypeScript**, featuring a modular plugin system.

### Core Structure

- **Frontend**: Vue 3 + TypeScript + PrimeVue + UnoCSS
- **Backend**: Rust + Tauri v2 
- **Plugin System**: Independent Vue applications with their own development environment
- **Database**: SQLite through Tauri's built-in support
- **UI Framework**: PrimeVue with Aura theme and dark mode support

### Key Directories

```
src/
├── api/ipc/           # Tauri IPC API wrappers
├── components/        # Reusable Vue components
├── views/            # Main application views
├── utils/            # Utility functions and managers  
├── composables/      # Vue composition functions
├── themes/           # Theme management system
└── interface/        # TypeScript type definitions

src-tauri/src/
├── command/          # Tauri command handlers
├── core/             # Core application logic
├── services/         # Business logic services
└── mh_plugin/        # Plugin management system

plugin/mh-plugin/     # Plugin development environment
```

### Plugin System

MyHelper features a comprehensive plugin system:

- **Development Environment**: Located in `plugin/mh-plugin/` with hot-reload support
- **Configuration**: Each plugin requires a `mhPlugin.json` configuration file
- **API Access**: Plugins can access main app APIs via `@/` path alias
- **Window Management**: Each plugin runs in its own window with customizable properties
- **Development Server**: Plugins run on port 1421 in development mode

### Event Communication Patterns

MyHelper uses different event naming conventions:

- **Tauri Events**: Use `:` separator, e.g., `emit('my:event')` for cross-window communication
- **EventBus**: Use `-` separator, e.g., `emit('my-event')` for within-window communication  
- **Vue Events**: Use camelCase, e.g., `emit('myEvent')` for component communication

### Key Managers and Systems

- **WindowManager**: Handles all window operations and positioning
- **PetManager**: Manages Live2D pets and character displays using pixi-live2d-display
- **ThemeManager**: Handles dark/light themes and PrimeVue theme switching
- **DatabaseManager**: SQLite operations through Tauri backend
- **HotkeyManager**: Global shortcut management
- **PluginManager**: Plugin lifecycle and communication

### Development Notes

- **Path Aliases**: `@/` points to `src/`, `mh-plugin` points to `plugin/mh-plugin/`
- **Live2D Integration**: Uses `pixi-live2d-display-lipsyncpatch` for character animations
- **Window System**: Main window is initially hidden and positioned at 65x65px
- **Hot Reload**: Vite dev server runs on port 1420, plugin dev on 1421
- **Build Process**: Frontend builds to `dist/`, Tauri handles final packaging
- **annotation**: When writing comments, functions and variables should be commented on in a single-line document. Unnecessary comments do not need to be added