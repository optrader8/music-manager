# Music Manager Frontend - Project Context

## Project Overview

The Music Manager Frontend is a React-based web application designed for managing music collections with features for browsing albums, music tracks, statistics, and server management. This is a modern TypeScript React application using Vite as the build tool, with a comprehensive UI library based on Radix UI components and Tailwind CSS for styling.

The project was originally developed by extracting a UI template from a receipt manager application, but has been repurposed into a music management system. The codebase shows a well-structured architecture with proper separation of concerns, utilizing modern React patterns and state management libraries.

## Technologies & Dependencies

### Core Frameworks
- **React 18.3.1** - Modern React functionality with hooks and concurrent features
- **TypeScript 5.8.3** - Type safety and enhanced developer experience
- **Vite 7.1.7** - Fast development build tool (not RSBuild as mentioned in README)

### UI & Styling
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **SCSS Modules** - Component-scoped styling
- **Radix UI** - Accessible UI primitives (Dialog, Navigation, Select, Tooltip, etc.)
- **Lucide React** - Consistent icon system
- **Class Variance Authority (CVA)** - Type-safe variant management
- **Tailwind CSS Animate** - CSS animations

### State Management & Routing
- **React Router DOM 7.9.2** - Client-side routing (not TanStack Router as mentioned in README)
- **TanStack Query 5.81.5** - Server state management
- **Zustand 5.0.6** - Client state management

### Forms & Validation
- **React Hook Form** - Form management and validation
- **Zod** - Schema validation
- **@hookform/resolvers** - Integration between React Hook Form and Zod

### Utilities
- **Recharts** - Charting and data visualization
- **react-window** - Virtual scrolling
- **react-window-infinite-loader** - Infinite scrolling
- **axios** - HTTP client
- **react-hot-toast** - Notification system

## Project Structure

```
src/
├── __tests__/                    # Test files
├── app/                          # Application routing
├── components/                   # Reusable UI components
│   ├── AudioPlayer/              # Audio playback functionality
│   ├── Dashboard/                # Dashboard-specific components
│   ├── Layout/                   # Main layout components (Header, Sidebar, Content)
│   ├── Music/                    # Music-related components
│   ├── MusicCard/                # Music card components
│   ├── Statistics/               # Statistics components
│   ├── ui/                       # Radix UI wrapper components
│   ├── ui2/                      # Custom UI components with CVA
│   └── [other components]
├── config/                       # Configuration files
├── constants/                    # Constants (navigation, etc.)
├── context/                      # React context providers
├── hooks/                        # Custom React hooks
├── lib/                          # Library utilities
├── pages/                        # Route components
├── services/                     # API service layer
├── styles/                       # Global styles and CSS
├── themes/                       # Theme configurations
├── types/                        # TypeScript type definitions
├── utils/                        # Utility functions
├── App.tsx                       # Main application component
├── index.tsx                     # Application entry point
└── styles.css                    # CSS imports
```

## Building and Running

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

### Development Server Configuration
The development server runs on port 32001 and is configured to:
- Proxy API requests to the backend service at `http://music-manager-backend:8000`
- Allow external connections (0.0.0.0 host)
- Enable hot module replacement (HMR)
- Use file system polling for change detection

### Environment Variables
- `VITE_API_URL` - API base URL (defaults to `/api` via proxy in development)

## Key Features and Architecture

### Layout System
The application uses a consistent layout system with:
- **Header**: Contains branding, navigation, and user actions
- **Sidebar**: Provides application navigation with collapsible sections
- **Content**: Main content area that adapts to the screen size
- Responsive design for both desktop and mobile experiences

### Routing
The application implements a comprehensive routing system with routes for:
- Dashboard (`/`, `/dashboard`)
- Server management (`/server`)
- Statistics (`/statistics`)
- Albums (`/albums`, `/albums/:albumId`)
- Music list (`/music/list`)
- Playlists and settings (planned features)

### State Management
- **Client State**: Managed with Zustand for local application state
- **Server State**: Handled with TanStack Query for API data caching, fetching, and synchronization
- **Form State**: Managed with React Hook Form for efficient form handling

### API Integration
The application is configured to communicate with a backend service:
- API requests are proxied through the development server
- Axios is used as the HTTP client
- TanStack Query manages request caching and synchronization
- Error handling includes retry strategies for failed requests

## Development Conventions

### TypeScript Usage
- All components and functions are strongly typed
- Type definitions are maintained in the `src/types` directory
- Interfaces and types follow consistent naming conventions

### Component Architecture
- **Separation of Concerns**: UI components are separate from business logic
- **Composition**: Components are built using composition patterns
- **Accessibility**: All UI components follow WCAG 2.1 AA accessibility standards
- **Responsive Design**: Components adapt to different screen sizes

### Styling Approach
- **Utility-First**: Tailwind CSS classes for styling
- **Component Scoping**: SCSS modules for component-specific styles
- **Theme Consistency**: Centralized color and typography definitions
- **Animation**: Tailwind CSS animations for enhanced UI interactions

### Code Quality
- **ESLint**: Code quality enforcement with configured rules
- **Prettier**: Consistent code formatting
- **Testing**: Unit and integration tests in the `__tests__` directories
- **Git Practices**: Standard git workflows with feature branches

### Security Considerations
- Input validation through Zod schemas
- Proper error handling to prevent information disclosure
- Sanitization of user inputs
- Secure communication with backend services