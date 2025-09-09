# Mailgrid UI - Modern Email Campaign Management Interface

A powerful, modern desktop application built with **Wails** (Go + React/TypeScript) that provides a sleek graphical interface for **Mailgrid**, the ultra-lightweight email automation CLI.

## 🚀 Key Features

### ✨ **Complete CLI Feature Parity**
- **Bulk email campaigns** from CSV files or Google Sheets
- **Single recipient** quick sends
- **Dynamic templating** with Go template engine
- **File attachments** (up to 10MB each)
- **CC/BCC support** (inline lists or file references)
- **SMTP configuration** with visual config builder
- **Advanced controls** - concurrency, retries, rate limiting, filtering

### 🕐 **Scheduling System** *(New!)*
- **One-time scheduling** - set specific date/time for campaigns
- **Recurring campaigns** - intervals (1m, 5m, 1h, daily, weekly, etc.)
- **Cron scheduling** - full cron expression support
- **Job management** - list, monitor, and cancel scheduled campaigns
- **Persistent storage** - jobs survive app restarts

### 🔍 **Preview & Testing**
- **Live preview** - see rendered emails before sending
- **Template editor** with Monaco (VS Code editor)
- **Dry run mode** - test campaigns without sending
- **Real-time activity logs** with color-coded status

### 🎨 **Modern UI/UX**
- **Dark/Light mode** toggle
- **Responsive design** 
- **Modular components** for maintainability
- **Smooth animations** with Framer Motion

## 🛠️ Architecture

**Frontend**: React 19 + TypeScript + Tailwind CSS + Monaco Editor
**Backend**: Go + Wails v2 with direct Mailgrid CLI integration
**Cross-platform**: Windows, macOS, Linux

## 📋 Getting Started

### Prerequisites
- Go 1.21+
- Node.js 18+
- Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Development
```bash
wails dev
```

### Building
```bash
wails build
```

## 🚧 Recent Improvements

### ✅ Completed
- ✅ **Fixed backend mapping** - All CLI flags properly mapped
- ✅ **Added scheduling system** - Complete job management UI
- ✅ **Modular components** - Extracted reusable sidebar sections
- ✅ **Enhanced validation** - Better error handling
- ✅ **Visual polish** - Consistent design system

### 🔄 Integration Status
- ✅ Core email sending (CSV, Sheets, single recipient)
- ✅ Advanced settings (concurrency, retries, filtering)
- ✅ Preview and dry-run functionality  
- ✅ SMTP configuration management
- 🔄 **Scheduling methods** - Backend ready, Wails bindings need regeneration

### 📋 To Enable Full Scheduling
```bash
# Regenerate Wails bindings to include new backend methods:
wails generate bindings
```

## 📄 License

BSD-3-Clause - Same as Mailgrid CLI

---

**Built with ❤️ using Wails - bringing Mailgrid's power to a modern desktop interface.**
