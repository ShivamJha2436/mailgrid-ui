# WARP.md

This file provides guidance when working with code in this repository.

## Project Overview
Mailgrid-UI is a desktop email marketing application built with **Wails v2** (Go + React + TypeScript). It provides a GUI wrapper around the mailgrid CLI tool for bulk email sending with CSV/Google Sheets integration. The app features an onboarding flow, authorization screen, and dashboard for managing email campaigns.

## Architecture
- **Backend**: Go application using Wails v2 framework with mailgrid CLI integration
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS 4 with Lottie animations
- **Binding**: Wails binds Go methods to frontend via context injection
- **State Management**: React hooks with localStorage for persistence
- **UI Flow**: Onboarding → Auth → Dashboard with theme switching

## Essential Commands

### Development
```bash
# Start development mode with hot reload
wails dev

# Install frontend dependencies  
cd frontend && npm install

# Lint frontend code
cd frontend && npm run lint

# Build frontend only
cd frontend && npm run build
```

### Building & Distribution
```bash
# Build production executable
wails build

# Check system requirements
wails doctor

# Generate bindings (if Go methods change)
wails generate bindings
```

### Testing Frontend
```bash
# Run Vite preview
cd frontend && npm run preview

# Access dev server for browser testing
# http://localhost:34115 (when wails dev is running)
```

## Key File Structure
```
/
├── main.go              # Wails app entry point
├── app.go               # Main app struct with Go methods
├── backend/mailgrid.go  # Mailgrid CLI service wrapper
├── wails.json           # Wails configuration
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main app component with routing
│   │   ├── components/      # UI components
│   │   │   ├── OnBoarding.tsx   # Multi-step onboarding
│   │   │   ├── AuthScreen.tsx   # API key authentication
│   │   │   ├── DashBoard.tsx    # Main email campaign interface
│   │   │   └── sections/        # Component sections
│   │   ├── utils/slide.ts   # Onboarding slide definitions
│   │   └── @types/props.ts  # TypeScript type definitions
│   ├── package.json     # Frontend dependencies
│   └── vite.config.ts   # Vite + React + TailwindCSS config
```

## Development Patterns

### Adding Go Methods
1. Add method to `App` struct in `app.go`
2. Run `wails generate bindings` to update frontend bindings
3. Import and use in React components via wailsjs

### Frontend State Flow
- `App.tsx` manages route state (onboarded, token)
- `localStorage` persists onboarding completion
- Theme switching handled in individual components
- File uploads managed via React hooks

### Component Structure
- Lazy-loaded Lottie animations for performance
- Motion/Framer Motion for animations
- TailwindCSS with dark mode support
- Lucide React for icons

### Backend Integration
- `backend/mailgrid.go` wraps the mailgrid CLI
- Methods must accept `context.Context` as first parameter
- Error handling should follow Go conventions
- Service currently commented out in main.go binding

## Configuration Notes

### Wails Configuration (`wails.json`)
- Frontend commands use npm (not pnpm despite lock file)
- Auto server URL detection for dev mode
- Output filename: `mailgrid-ui`

### Frontend Dependencies
- React 19 with latest features
- TailwindCSS 4.x with Vite plugin
- Motion library (newer Framer Motion)
- Lottie React for animations

### Go Dependencies
- Core dependency: `github.com/bravo1goingdark/mailgrid v0.1.0`
- Wails v2.10.2 with WebView2 backend

## Troubleshooting

### Build Issues
- Ensure `wails doctor` shows all green
- Check Go version compatibility (1.23.0+)
- Verify WebView2 is installed on Windows

### Frontend Development
- Use `wails dev` instead of standalone Vite for full functionality
- Browser testing available at http://localhost:34115
- Hot reload works for frontend changes

### Binding Issues
- Re-run `wails generate bindings` after Go method changes
- Ensure Go methods are exported (capitalized)
- Context parameter required for Wails binding
