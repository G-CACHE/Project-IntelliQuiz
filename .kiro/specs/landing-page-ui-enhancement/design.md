# Design Document: Landing Page UI Enhancement

## Overview

This design enhances the IntelliQuiz landing page (UniversalLogin) to match the polished, modern aesthetic established in the participant and proctor interfaces. The redesign transforms the current minimal black-background page into a cohesive, branded experience using the app's maroon-gold color scheme, gradient styling, and card-based layout patterns.

## Architecture

The landing page follows a simple single-page component architecture:

```
UniversalLogin.tsx
├── Hero Section (branded header with decorations)
├── Login Options Container
│   ├── Participant Login Card (primary)
│   ├── Proctor Login Card (secondary)
│   └── Admin Login Card (tertiary)
└── Footer Section
```

### Styling Approach

The component will use a dedicated CSS file (`landing.css`) following the same patterns as `participant.css` and `proctor.css`:
- CSS class naming convention: `landing-*` prefix
- Reuse of CSS variables from `variables.css`
- Gradient-based backgrounds and decorative elements
- Consistent animation keyframes

## Components and Interfaces

### UniversalLogin Component

```typescript
// UniversalLogin.tsx - Enhanced landing page component
interface LoginOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  variant: 'primary' | 'secondary' | 'tertiary';
}

const loginOptions: LoginOption[] = [
  {
    id: 'participant',
    title: 'Join as Participant',
    description: 'Enter your team code to join a quiz',
    icon: <UsersIcon />,
    route: '/participant/login',
    variant: 'primary'
  },
  {
    id: 'proctor',
    title: 'Host as Proctor',
    description: 'Enter your proctor PIN to host a quiz',
    icon: <MonitorIcon />,
    route: '/proctor/login',
    variant: 'secondary'
  },
  {
    id: 'admin',
    title: 'Admin Portal',
    description: 'Manage quizzes, teams, and settings',
    icon: <SettingsIcon />,
    route: '/admin/login',
    variant: 'tertiary'
  }
];
```

### CSS Structure

```css
/* landing.css - Key class structure */

/* Page container */
.landing-page { }

/* Hero section with gradient header */
.landing-hero { }
.landing-hero-decoration { }
.landing-hero-title { }
.landing-hero-subtitle { }

/* Login cards container */
.landing-cards-container { }

/* Individual login cards */
.landing-card { }
.landing-card-primary { }
.landing-card-secondary { }
.landing-card-tertiary { }
.landing-card-icon { }
.landing-card-title { }
.landing-card-description { }

/* Footer */
.landing-footer { }

/* Animations */
@keyframes landingFadeIn { }
@keyframes landingSlideUp { }
```

## Data Models

No data models required - this is a purely presentational component with no state management beyond React Router navigation.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Login Card Content Completeness

*For any* login card rendered on the landing page, the card SHALL contain both an icon element and descriptive text content.

**Validates: Requirements 3.6**

### Property 2: Navigation Route Validity

*For any* login card click action, the navigation SHALL route to a valid application path that exists in the router configuration.

**Validates: Requirements 3.1, 3.3, 3.4, 3.5**

## Error Handling

This component has minimal error scenarios:

1. **Navigation Failure**: If `useNavigate` fails, React Router will handle the error boundary
2. **CSS Loading**: If CSS fails to load, the page will render with default browser styling but remain functional

No explicit error handling code is required for this presentational component.

## Testing Strategy

### Unit Tests

Unit tests will verify:
- Component renders without crashing
- All three login options are displayed
- Each login card contains required elements (icon, title, description)
- Navigation is triggered on card click
- Footer displays correct copyright year

### Property-Based Tests

Due to the presentational nature of this component, property-based testing has limited applicability. The main testable property is:

**Property 1**: For all login cards, verify content completeness
- Generate variations of the login options array
- Verify each rendered card contains icon and text elements

### Visual Testing

Manual visual testing should verify:
- Gradient backgrounds render correctly
- Hover animations work smoothly
- Responsive breakpoints function properly
- Color scheme matches design system

### Test Configuration

- Testing framework: Vitest with React Testing Library
- Minimum iterations for property tests: 100
- Test file location: `src/pages/auth/__tests__/UniversalLogin.test.ts`
