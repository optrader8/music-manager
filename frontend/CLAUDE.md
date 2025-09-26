# CLAUDE.md - React UI Template

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

> **📋 Common Guidelines**: This document extends [/home/optrader/CLAUDE.md](/home/optrader/CLAUDE.md). Please reference the global file for shared coding philosophy, conventions, and git workflow.

## Project Overview

React UI Template is a reusable UI template system extracted from a production application. It provides a modern Header + Sidebar + Content layout structure that can be easily integrated into new React projects.

**Current Phase**: Phase 1 - Porting Layout system from Receipt Manager
**Next Phase**: Phase 2 - Template system development

## Project-Specific Architecture

### Technology Stack

- **React 18.3.1** with TypeScript 5.8.3
- **RSBuild** (Rspack-based bundler) with Hot Module Replacement
- **TanStack Router** for file-based routing
- **Tailwind CSS 4.1.11** + **SCSS Modules** for styling
- **Radix UI** for accessible components
- **Zustand** for state management
- **TanStack Query** for server state

### Source Structure

```
src/
├── components/
│   ├── Layout/              # Core layout system
│   │   ├── Layout.tsx       # Main container with responsive logic
│   │   ├── Header.tsx       # Top navigation bar
│   │   ├── Sidebar.tsx      # Side navigation panel
│   │   └── *.module.scss    # Component-scoped styles
│   ├── ui/                  # Radix UI wrapper components
│   └── ui2/                 # Custom UI components (CVA-based)
├── app/                     # File-based routing (Next.js style)
├── constants/               # Navigation items, theme constants
├── types/                   # TypeScript definitions
├── utils/                   # Utility functions (cn, etc.)
└── hooks/                   # Custom React hooks
```

## Development Commands

### Setup and Development

```bash
# Install dependencies
npm install

# Development server (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Code quality
npm run lint
npm run format
```

### Git Workflow

Use the global `gac` command as specified in [/home/optrader/CLAUDE.md](/home/optrader/CLAUDE.md):

```bash
# Template project commits
gac auto -y -d -t "feat: add responsive sidebar" -c "Implement mobile-responsive sidebar with overlay mode and touch-friendly interactions"
```

## Component Development Guidelines

### Layout Components

When working with Layout components, follow these principles:

1. **Responsive First**: Always consider mobile and desktop experiences
2. **Accessibility**: Use semantic HTML and ARIA attributes
3. **Performance**: Lazy load route components, optimize re-renders
4. **Theming**: Use CSS custom properties for easy customization

### SCSS Module Conventions

```scss
// Layout.module.scss
.root {
  // Root container styles
}

.container {
  // Main layout container
}

.mainContent {
  // Content area wrapper
}

// Responsive variants
.sidebarContainer {
  &.hidden {
    // Hidden state
  }
}

.mobileSidebarContainer {
  &.visible {
    // Visible state
  }
}
```

### TypeScript Patterns

```typescript
// Interface definitions
export interface LayoutProps {
  children: ReactNode;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  active?: boolean;
}

// Component with proper typing
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Implementation
};
```

## Styling Strategy

### CSS Architecture

- **Global styles**: `src/styles/globals.css` for Tailwind base and utilities
- **Component styles**: SCSS modules for component-specific styles
- **Theme system**: CSS custom properties for easy customization
- **Responsive design**: Mobile-first approach with breakpoints

### Class Naming (BEM-inspired)

```scss
// Block
.sidebar {
}

// Element
.sidebarHeader {
}
.sidebarContent {
}

// Modifier
.sidebar--collapsed {
}
.sidebar--mobile {
}
```

### Utility Usage

```typescript
import { cn } from '@/utils/cn';

// Combining classes
className={cn(
  styles.sidebarContainer,
  { [styles.hidden]: !isSidebarVisible }
)}
```

## State Management

### Component State

- Use `useState` for local component state
- Use `useReducer` for complex state logic
- Custom hooks for reusable stateful logic

### Application State (Zustand)

```typescript
// Store structure
interface AppStore {
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  setTheme: (theme: "light" | "dark") => void;
  toggleSidebar: () => void;
}
```

## Routing Conventions

### File-Based Routing

```
src/app/
├── __root.tsx              # Root layout
├── index.tsx               # Home route (/)
├── dashboard/
│   └── index.tsx           # Dashboard route (/dashboard)
└── settings/
    └── index.tsx           # Settings route (/settings)
```

### Route Components

```typescript
// Route component structure
export default function DashboardPage() {
  return (
    <div>
      {/* Page content */}
    </div>
  );
}
```

## Testing Strategy

### Component Testing

- Focus on Layout component behavior
- Test responsive breakpoints
- Verify accessibility features
- Mock navigation interactions

### Integration Testing

- Test route transitions
- Verify layout state persistence
- Check theme switching

## Performance Considerations

### Bundle Optimization

- Use React.lazy for route components
- Implement dynamic imports for heavy dependencies
- Minimize CSS-in-JS runtime if used

### Runtime Performance

- Memoize expensive Layout calculations
- Optimize sidebar toggle animations
- Use CSS transforms for smooth transitions

## Customization Points

### Theme Customization

```css
:root {
  --sidebar-width: 240px;
  --header-height: 64px;
  --primary-color: #your-brand-color;
}
```

### Navigation Customization

```typescript
// constants/navigation.tsx
export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home />,
    href: '/dashboard',
  },
  // Add your items...
];
```

## Migration from Receipt Manager

When porting components from Receipt Manager:

1. **Extract core layout logic** without business-specific code
2. **Generalize prop interfaces** for reusability
3. **Remove dependencies** on specific APIs or stores
4. **Maintain responsive behavior** and accessibility features
5. **Update import paths** to match template structure

## Future Phase 2 Considerations

### Template System Requirements

- Configuration-based customization
- CLI tool for project generation
- Multiple layout variants
- Theme system with design tokens
- Component library export

### Plugin Architecture

- Extensible navigation system
- Custom layout compositions
- Third-party integrations
- Theme marketplace

---

_For common coding standards, git workflow, and general best practices, refer to [/home/optrader/CLAUDE.md](/home/optrader/CLAUDE.md)._
