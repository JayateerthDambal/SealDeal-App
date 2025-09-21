# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (runs on http://localhost:5173)
- **Build for production**: `npm run build` (TypeScript compilation + Vite build)
- **Lint code**: `npm run lint` (ESLint with TypeScript rules)
- **Preview production build**: `npm run preview`

## Architecture Overview

This is a React + TypeScript frontend for SealDeal.ai, a deal analysis platform for investment firms. The app uses:

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS with custom UI components
- **Authentication**: Firebase Auth with Google OAuth
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage for document uploads
- **Functions**: Firebase Functions (region: asia-south1)
- **Routing**: React Router DOM with protected routes

## Key Architecture Patterns

### Authentication Flow
- `AuthContext` provides global auth state management
- `ProtectedRoute` component wraps authenticated routes
- Firebase emulators are used in development (localhost detection)
- All Firebase services are configured in `firebaseConfig.ts`

### Component Structure
- **Pages**: Main route components (`DashboardPage`, `DealAnalysisPage`, `LoginPage`)
- **Layouts**: `AppLayout` provides consistent shell for authenticated views
- **UI Components**: Reusable components in `components/ui/` (Button, Card, Input, etc.)
- **Feature Components**: Domain-specific components in `components/deals/` and `components/dashboard/`

### Data Types
Core business entities are defined in `types.ts`:
- `Deal`: Investment deals with processing status
- `Analysis`: AI analysis results with metrics, SWOT, risk flags
- `UserProfile`: User roles (analyst, partner, admin, benchmarking_admin)
- `Metric`: Structured data with source quotes and notes

### Deal Processing Flow
Deals follow this status progression:
1. `1_AwaitingUpload` → Documents not yet uploaded
2. `2_Processing` → Documents being processed
3. `4_Analyzed` → Analysis complete, results available
4. `Error_Processing_Failed` / `Error_Analysis_Failed` → Processing errors

### Firebase Configuration
- **Development**: Automatically connects to local emulators when hostname is localhost
- **Auth**: Port 9099
- **Firestore**: Port 8080  
- **Storage**: Port 9199
- **Functions**: Port 5001

## Component Dependencies

The app uses several key libraries:
- **Radix UI**: Accessible UI primitives (Select, Tooltip, Slot)
- **Lucide React**: Icon library
- **React Dropzone**: File upload handling
- **Recharts**: Data visualization
- **html2canvas + jsPDF**: Report generation
- **Sonner**: Toast notifications

## Development Notes

- Uses Vite for fast development and building
- ESLint configured for TypeScript with React-specific rules
- TailwindCSS for styling with custom animations
- Firebase config includes TODO to move to environment variables
- Component architecture follows feature-based organization under `components/`