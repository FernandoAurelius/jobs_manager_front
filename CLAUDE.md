# Jobs Manager Frontend - Claude Development Guide

## Project Overview

This is a Vue 3 + TypeScript frontend for a job management system built for Morris Sheet Metal. It provides a Kanban-style job board, timesheet management, and comprehensive job workflow tracking. The application communicates with a Django REST API backend.

## Backend

The backend is in /home/corrin/src/jobs_manager
It's a standard Django app.

**IMPORTANT: This Claude instance is NOT permitted to read or modify the backend directory or source code.** If you need information about the backend API, models, or validation logic, you must ask the user to coordinate with the Claude instance managing the backend code.

## Tech Stack & Architecture

### Core Technologies

- **Vue 3** with Composition API and `<script setup>`
- **TypeScript** for type safety
- **Vite** as build tool and dev server
- **Pinia** for state management
- **Vue Router** with authentication guards
- **Tailwind CSS v4** with custom theme
- **Axios** for HTTP requests with interceptors

### Key Libraries

- **AG Grid Community** - Data grids for timesheets
- **Reka UI** - Headless component library (shadcn/vue style)
- **VeeValidate + Zod** - Form validation
- **SortableJS** - Drag and drop functionality
- **Vue Sonner** - Toast notifications
- **Lucide Vue** - Icon library

## Project Structure

```
src/
├── components/          # Reusable Vue components
│   ├── ui/             # Base UI components (Button, Dialog, etc.)
│   ├── job/            # Job-specific components
│   ├── timesheet/      # Timesheet-related components
│   └── kanban/         # Kanban board components
├── composables/        # Composition API functions (20+ composables)
├── stores/             # Pinia state stores
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── schemas/            # Zod validation schemas
├── views/              # Page-level components
├── router/             # Vue Router configuration
├── plugins/            # Third-party library configurations
├── lib/                # Utility functions
└── assets/             # CSS and static assets
```

## Key Patterns & Conventions

### Authentication

- Uses **httpOnly cookies** for secure token storage
- Automatic token refresh via Axios interceptors
- Router guards protect authenticated routes
- Auth state managed in `stores/auth.ts`

### API Integration

- Centralized service layer in `services/` directory
- Axios configured with base URL and CSRF handling
- Typed responses using TypeScript interfaces
- Error handling with automatic logout on 401

#### No Fallbacks in Our Own Code

**Do not use fallback patterns when accessing our own API or component data.** Use the correct field names directly.

❌ `job.job_number || job.number || job.jobNumber`
✅ `job.job_number`

If fields are missing or inconsistent, fix the source code, don't mask with fallbacks.

### Component Architecture

- **Composition API** with `<script setup>` syntax
- **Composables** for shared logic (use\* pattern)
- **Props/Emits** with TypeScript interfaces
- **UI components** follow shadcn/vue patterns

### State Management

- **Pinia stores** for global state
- **Reactive refs** for component-local state
- **Computed properties** for derived state
- **Actions** for async operations

## Development Guidelines

### File Organization

- Group related components by feature (job/, timesheet/, etc.)
- Use descriptive, PascalCase names for components
- Keep composables focused and reusable
- Separate types from implementation files

### TypeScript Usage

- Always type component props and emits
- Use interfaces for complex objects
- Leverage type inference where possible
- Validate API responses with Zod schemas

### Component Patterns

```vue
<template>
  <!-- Template with proper accessibility -->
</template>

<script setup lang="ts">
// Imports
import { ref, computed, onMounted } from 'vue'
import type { ComponentProps } from '@/types'

// Props & Emits
interface Props {
  // Define props with types
}
const props = defineProps<Props>()

// Composables
const { data, loading, error } = useApi()

// Local state
const localState = ref('')

// Computed
const computedValue = computed(() => {
  // Derived state
})

// Lifecycle
onMounted(() => {
  // Initialization
})
</script>
```

### API Service Pattern

```typescript
export class SomeService {
  private static instance: SomeService

  static getInstance(): SomeService {
    if (!this.instance) {
      this.instance = new SomeService()
    }
    return this.instance
  }

  async fetchData(): Promise<ApiResponse<DataType>> {
    const response = await api.get<DataType>('/endpoint')
    return response.data
  }
}
```

## Key Features & Components

### Kanban Board (`KanbanView.vue`)

- Drag-and-drop job management using SortableJS
- Advanced search and filtering
- Mobile-responsive column selector
- Staff assignment filters

### Timesheet Management

- **Daily view** (`DailyTimesheetView.vue`) - Overview of all staff
- **Entry view** (`TimesheetEntryView.vue`) - Individual timesheet entry with AG Grid
- **Weekly view** (`WeeklyTimesheetView.vue`) - Weekly summaries

### Job Management

- **Job creation** (`JobCreateView.vue`) - New job wizard
- **Job details** (`JobView.vue`) - Comprehensive job editing
- **Quote import** - Import jobs from external quote systems

## Environment Configuration

### Development Setup

```bash
npm install
npm run dev  # Starts dev server on http://localhost:5173
```

### Environment Variables

- `VITE_API_BASE_URL` - API endpoint (defaults to http://localhost:8001)

### Build Commands

- `npm run build` - Production build
- `npm run type-check` - TypeScript validation
- `npm run lint` - ESLint with auto-fix
- `npm run format` - Prettier formatting

## Important Implementation Details

### Authentication Flow

1. User logs in via `/login` route
2. Backend sets httpOnly cookies
3. Axios automatically includes cookies in requests
4. Router guards check auth state before navigation
5. 401 responses trigger automatic logout

### Drag & Drop Implementation

- Uses SortableJS with Vue 3 integration
- Composables handle drag state and API updates
- Mobile-specific movement buttons for touch devices

### Grid Configuration

- AG Grid with custom theme matching app design
- Column types for currency, dates, hours formatting
- Editable cells with validation

### Form Validation

- VeeValidate for form handling
- Zod schemas for runtime validation
- Custom validation composables

## Common Tasks

### Adding New Components

1. Create component in appropriate `components/` subdirectory
2. Export from component's index.ts if applicable
3. Add TypeScript interfaces for props/emits
4. Follow established naming conventions

### Creating New API Endpoints

1. Add service method in appropriate service class
2. Define TypeScript types for request/response
3. Add Zod schema for validation if needed
4. Update composables to use new service method

### Adding New Routes

1. Define route in `router/index.ts`
2. Set appropriate meta properties (auth, title)
3. Create corresponding view component
4. Update navigation if needed

## Testing & Quality

### Code Quality Tools

- **ESLint** - Linting with Vue/TypeScript rules
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Vue DevTools** - Development debugging

### Browser Support

- Modern browsers with ES2020+ support
- Mobile-responsive design
- Progressive enhancement patterns

## Troubleshooting

### Common Issues

- **CORS errors**: Check API base URL configuration
- **Auth redirects**: Verify cookie settings and domain
- **Build failures**: Run type-check to identify TypeScript errors
- **Style issues**: Check Tailwind class conflicts

### Debug Tools

- Vue DevTools extension
- Browser network tab for API calls
- Console logs in development mode
- TypeScript compiler errors

## Additional Resources

- Main documentation: `docs/overview.md`
- Backend repository: https://github.com/corrin/jobs_manager
- Component library: Based on shadcn/vue patterns
- UI components: Custom implementation in `components/ui/`
