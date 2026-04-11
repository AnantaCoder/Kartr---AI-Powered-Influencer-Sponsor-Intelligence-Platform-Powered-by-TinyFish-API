# Kartr Frontend

A modern, high-performance React frontend for the Kartr influencer-sponsor platform, built with **Bun** runtime and **Redux Toolkit** for state management.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Development](#development)
- [Build & Production](#build--production)
- [Architecture & Coding Practices](#architecture--coding-practices)
- [Contributing](#contributing)

---

## 🎯 Overview

Kartr Frontend provides a sleek, responsive UI for connecting influencers with sponsors. It includes:

- **Authentication**: Login, registration for Influencers & Sponsors
- **YouTube Analytics**: Analyze channels and videos
- **Dashboard**: View and manage connections
- **Modern UI**: Built with shadcn/ui components and TailwindCSS

---

## ⚡ Tech Stack

| Technology | Purpose |
|------------|---------|
| 🥟 **Bun** | JavaScript runtime & package manager |
| ⚛️ **React 19** | UI library |
| 📘 **TypeScript** | Type safety |
| 🎨 **TailwindCSS 4** | Utility-first CSS framework |
| 🧩 **shadcn/ui** | Reusable UI component library |
| 🔄 **Redux Toolkit** | State management |
| 🚏 **React Router v7** | Client-side routing |
| 📝 **React Hook Form** | Form handling |
| ✅ **Zod** | Schema validation |
| 🎬 **Framer Motion** | Animations |
| 🔌 **Axios** | HTTP client |
| 🎨 **Lucide React** | Icon library |

---

## 📁 Project Structure

```
bun_frontend/
├── src/
│   ├── app/                    # Redux store configuration
│   │   ├── store.ts            # Store configuration
│   │   ├── rootReducer.ts      # Combined reducers
│   │   └── hooks.ts            # Typed Redux hooks (useAppDispatch, useAppSelector)
│   │
│   ├── features/               # Feature-based modules
│   │   ├── auth/               # Authentication feature
│   │   │   ├── index.ts        # Barrel exports (re-exports from slices/schemas)
│   │   │   ├── api/            # Auth API calls
│   │   │   └── types/          # TypeScript types
│   │   │
│   │   ├── slices/             # All Redux slices (centralized)
│   │   │   ├── index.ts        # Barrel exports
│   │   │   ├── authSlice.ts    # Authentication state
│   │   │   ├── youtubeSlice.ts # YouTube analytics state
│   │   │   └── chatSlice.ts    # Chat state management
│   │   │
│   │   ├── schemas/            # All schemas (centralized)
│   │   │   ├── index.ts        # Barrel exports
│   │   │   ├── authSchema.ts   # Auth Zod validation schemas
│   │   │   ├── youtubeSchema.ts # YouTube types
│   │   │   └── chatSchema.ts   # Chat types
│   │   │
│   │   └── youtube/            # YouTube analytics feature
│   │
│   ├── components/             # Reusable components
│   │   ├── ui/                 # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── form.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   │
│   │   ├── Header.tsx          # App header
│   │   ├── Footer.tsx          # App footer
│   │   ├── ChatBot.tsx         # AI chat component
│   │   └── ...
│   │
│   ├── pages/                  # Page-level components (route targets)
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── SignupInfluencer.tsx
│   │   ├── SignupSponsor.tsx
│   │   └── YoutubeAnalysis.tsx
│   │
│   ├── routes/                 # Routing configuration
│   │   └── AppRoutes.tsx       # Route definitions
│   │
│   ├── services/               # API & external service clients
│   │   └── apiClient.ts        # Axios instance with interceptors
│   │
│   ├── lib/                    # Shared utilities
│   │   └── utils.ts            # Helper functions (cn, etc.)
│   │
│   ├── types/                  # Global TypeScript types
│   ├── utils/                  # Utility functions
│   ├── assets/                 # Static assets (icons, images)
│   │
│   ├── App.tsx                 # Root App component
│   ├── main.tsx                # Application entry point
│   └── index.html              # HTML template
│
├── styles/
│   └── globals.css             # Global styles & Tailwind imports
│
├── build.ts                    # Bun build script
├── bunfig.toml                 # Bun configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies & scripts
└── components.json             # shadcn/ui configuration
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Bun** (v1.0 or higher) - [Install Bun](https://bun.sh/docs/installation)
- **Node.js** (optional, for compatibility)

### Installation Steps

1. **Clone and navigate to the frontend directory**
   ```bash
   cd bun_frontend
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit with your backend API URL
   # BACKEND_API_URL=http://localhost:8000/api
   ```

4. **Start development server**
   ```bash
   bun dev
   ```

5. **Access the application**
   - Development: http://localhost:3000

---

## 💻 Development

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **dev** | `bun dev` | Start development server with hot reload |
| **start** | `bun start` | Run production build |
| **build** | `bun run build` | Build for production |

### Development Server

```bash
# Start with hot reload
bun dev

# The server runs on http://localhost:3000 by default
```

### Build Script Options

The `build.ts` script accepts various command-line options:

```bash
# Basic production build
bun run build

# With custom options
bun run build.ts --outdir=dist --minify --sourcemap=linked

# View all options
bun run build.ts --help
```

---

## 🏗️ Build & Production

### Production Build

```bash
# Create optimized production build
bun run build

# Output is placed in the 'dist' folder
```

### Build Output

The build process:
- Minifies all JavaScript/TypeScript files
- Generates source maps (linked)
- Processes Tailwind CSS
- Outputs to `dist/` directory

---

## 🏛️ Architecture & Coding Practices

### Feature-Based Architecture

The codebase follows a **feature-based architecture** with centralized slices and schemas:

```
features/
├── auth/                    # Auth feature (uses centralized slices/schemas)
│   ├── index.ts             # Barrel exports (re-exports from slices/schemas)
│   ├── api/                 # Feature-specific API calls
│   └── types/               # TypeScript types/interfaces
│
├── slices/                  # All Redux slices (centralized)
│   ├── index.ts             # Barrel exports
│   ├── authSlice.ts         # Authentication state
│   ├── youtubeSlice.ts      # YouTube analytics state
│   └── chatSlice.ts         # Chat state management
│
└── schemas/                 # All schemas (centralized)
    ├── index.ts             # Barrel exports
    ├── authSchema.ts        # Auth Zod validation schemas
    ├── youtubeSchema.ts     # YouTube types
    └── chatSchema.ts        # Chat types
```

**Benefits:**
- ✅ Centralized state management - all slices in one place
- ✅ Centralized schema definitions - all types in one place
- ✅ Easy to navigate and maintain
- ✅ Scales well as the app grows
- ✅ Clear separation between feature logic (api, types) and state/schemas

### State Management (Redux Toolkit)

```typescript
// src/app/store.ts - Store configuration
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";

export const store = configureStore({
  reducer: rootReducer
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
```

```typescript
// src/app/hooks.ts - Typed hooks
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

### Component Patterns

**UI Components** (`components/ui/`):
- Reusable, presentational components
- Based on shadcn/ui patterns
- Use `class-variance-authority` for variants
- Accept props via interfaces

```typescript
// Example: Button component with variants
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva("btn-base", {
  variants: {
    variant: { default: "...", outline: "..." },
    size: { default: "...", sm: "...", lg: "..." }
  }
});
```

**Feature Components** (`features/*/`):
- Connected to Redux store
- Handle business logic
- Compose UI components

**Page Components** (`pages/`):
- Top-level route components
- Compose features and UI components
- Handle page-level layout

### Form Handling

Forms use **React Hook Form** with **Zod** validation:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type FormData = z.infer<typeof schema>;

const { register, handleSubmit } = useForm<FormData>({
  resolver: zodResolver(schema)
});
```

### API Client

Centralized Axios client with JWT interceptor:

```typescript
// src/services/apiClient.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Path Aliases

TypeScript path aliases are configured for cleaner imports:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// Usage
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/app/hooks";
```

### Code Style Guidelines

| Practice | Description |
|----------|-------------|
| **TypeScript Strict Mode** | All files use strict TypeScript |
| **Functional Components** | Use `React.FC<Props>` pattern |
| **Named Exports** | Prefer named exports for better tree-shaking |
| **Barrel Exports** | Use `index.ts` for feature public APIs |
| **Component Naming** | PascalCase for components, camelCase for utilities |
| **File Naming** | Component files match component name (e.g., `Button.tsx`) |

---

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_API_URL` | Backend API base URL | `http://localhost:8000/api` |

The API client automatically detects environment variables from:
1. Bun environment (`Bun.env`)
2. Vite environment (`import.meta.env`)
3. Node.js environment (`process.env`)

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Follow** the coding practices outlined above
4. **Commit** your changes (`git commit -m 'Add amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

### Before Submitting

- [ ] Code follows the project structure
- [ ] TypeScript has no errors (`bun run build`)
- [ ] New features include types and schemas
- [ ] Components are properly documented

---

## 📝 License

MIT License - See LICENSE file for details.

---

**Built with ❤️ using Bun, React, and TailwindCSS**
