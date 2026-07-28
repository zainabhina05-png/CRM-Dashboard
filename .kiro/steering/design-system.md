# LeadFlow CRM - Design System

## Design Philosophy

LeadFlow uses a **Solar Ocean Glassmorphism** design language that combines the transparency and depth of glassmorphism with a sophisticated color palette inspired by oceanic themes. The system prioritizes clarity, accessibility, and modern aesthetics while maintaining professional credibility for business users.

## Core Design Principles

### 1. Depth Through Transparency
- Semi-transparent surfaces with backdrop-filter blur effects
- Layered information hierarchy using opacity and elevation
- Subtle shadows and borders to define surface boundaries

### 2. Ocean-Inspired Color Harmony  
- Deep blues and teals as primary colors
- Soft gradients mimicking water movement
- High contrast text for accessibility compliance
- Warm accent colors for calls-to-action and success states

### 3. Purposeful Motion
- Smooth, physics-based animations using Framer Motion
- Transitions enhance usability rather than decoration
- Consistent timing and easing curves across interactions
- Respect for users' motion sensitivity preferences

### 4. Responsive Fluidity
- Layouts that flow and adapt rather than break at breakpoints
- Content-first responsive design approach
- Touch-friendly interactions on mobile devices
- Contextual navigation based on screen size

## Color System

### Primary Palette
```css
:root {
  /* Primary Blues - Main brand colors */
  --primary-50: #e6f3ff;   /* Lightest blue, backgrounds */
  --primary-100: #b3d9ff;  /* Light blue, hover states */
  --primary-200: #80bfff;  /* Medium blue, borders */
  --primary-300: #4da6ff;  /* Active blue, secondary buttons */
  --primary-400: #1a8cff;  /* Brand blue, primary buttons */
  --primary-500: #0066cc;  /* Deep blue, text links */
  --primary-600: #0052a3;  /* Darker blue, button hover */
  --primary-700: #003d7a;  /* Navy blue, headers */
  --primary-800: #002952;  /* Dark navy, backgrounds */
  --primary-900: #001429;  /* Darkest blue, text */

  /* Secondary Teals - Supporting colors */
  --secondary-50: #e6ffff;
  --secondary-100: #b3ffff; 
  --secondary-200: #80ffff;
  --secondary-300: #4dffff;
  --secondary-400: #1affff;
  --secondary-500: #00e6e6;  /* Primary teal */
  --secondary-600: #00cccc;
  --secondary-700: #009999;
  --secondary-800: #006666;
  --secondary-900: #003333;
}
```

### Semantic Colors
```css
:root {
  /* Success - Ocean greens */
  --success-50: #e6fff2;
  --success-500: #10b981;   /* Success actions, positive states */
  --success-900: #064e3b;

  /* Warning - Sunset oranges */  
  --warning-50: #fff8e6;
  --warning-500: #f59e0b;   /* Caution, pending states */
  --warning-900: #78350f;

  /* Error - Coral reds */
  --error-50: #fef2f2; 
  --error-500: #ef4444;     /* Errors, destructive actions */
  --error-900: #7f1d1d;

  /* Neutral - Ocean depths */
  --neutral-50: #f8fafc;    /* Pure white alternative */
  --neutral-100: #f1f5f9;   /* Light backgrounds */
  --neutral-200: #e2e8f0;   /* Borders, dividers */
  --neutral-300: #cbd5e1;   /* Disabled states */
  --neutral-400: #94a3b8;   /* Placeholder text */
  --neutral-500: #64748b;   /* Secondary text */
  --neutral-600: #475569;   /* Body text */
  --neutral-700: #334155;   /* Headings */
  --neutral-800: #1e293b;   /* Dark text */
  --neutral-900: #0f172a;   /* Darkest text */
}
```

### Glassmorphism Surface Colors
```css
:root {
  /* Glass surfaces with backdrop-filter support */
  --glass-white: rgba(255, 255, 255, 0.1);
  --glass-primary: rgba(26, 140, 255, 0.1);  
  --glass-secondary: rgba(0, 230, 230, 0.1);
  --glass-dark: rgba(15, 23, 42, 0.8);

  /* Glass borders */
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-border-strong: rgba(255, 255, 255, 0.3);
}
```

## Typography Scale

### Font Stack
```css
:root {
  /* Primary font - Clean, modern sans-serif */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                  'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  
  /* Monospace - Code and data display */
  --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 
               'Source Code Pro', monospace;
}
```

### Type Scale (Major Third - 1.25 ratio)
```css
:root {
  /* Font sizes following major third scale */
  --text-xs: 0.75rem;      /* 12px - Captions, labels */
  --text-sm: 0.875rem;     /* 14px - Small text, metadata */
  --text-base: 1rem;       /* 16px - Body text, baseline */
  --text-lg: 1.125rem;     /* 18px - Large body text */
  --text-xl: 1.25rem;      /* 20px - Subheadings */
  --text-2xl: 1.5rem;      /* 24px - Section headings */
  --text-3xl: 1.875rem;    /* 30px - Page titles */
  --text-4xl: 2.25rem;     /* 36px - Hero headings */
  --text-5xl: 3rem;        /* 48px - Display text */
  
  /* Font weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line heights for readability */
  --leading-tight: 1.25;   /* Headings */
  --leading-normal: 1.5;   /* Body text */
  --leading-relaxed: 1.75; /* Large blocks of text */
}
```

## Spacing System

### Base Unit Scale (4px base)
```css
:root {
  /* Spacing scale - 4px base unit system */
  --space-0: 0;
  --space-1: 0.25rem;      /* 4px - Fine adjustments */
  --space-2: 0.5rem;       /* 8px - Small gaps */
  --space-3: 0.75rem;      /* 12px - Text spacing */
  --space-4: 1rem;         /* 16px - Standard gap */
  --space-5: 1.25rem;      /* 20px - Medium gaps */
  --space-6: 1.5rem;       /* 24px - Large gaps */
  --space-8: 2rem;         /* 32px - Section spacing */
  --space-10: 2.5rem;      /* 40px - Large sections */
  --space-12: 3rem;        /* 48px - Major sections */
  --space-16: 4rem;        /* 64px - Layout spacing */
  --space-20: 5rem;        /* 80px - Hero spacing */
  --space-24: 6rem;        /* 96px - Major layout */
}
```

### Component Spacing Patterns
```css
:root {
  /* Consistent component internal spacing */
  --padding-xs: var(--space-2) var(--space-3);    /* 8px 12px */
  --padding-sm: var(--space-3) var(--space-4);    /* 12px 16px */
  --padding-md: var(--space-4) var(--space-6);    /* 16px 24px */
  --padding-lg: var(--space-6) var(--space-8);    /* 24px 32px */
  --padding-xl: var(--space-8) var(--space-12);   /* 32px 48px */
}
```

## Border Radius System

```css
:root {
  /* Border radius scale for various UI elements */
  --radius-none: 0;
  --radius-sm: 0.125rem;    /* 2px - Small elements */
  --radius-base: 0.25rem;   /* 4px - Buttons, inputs */
  --radius-md: 0.375rem;    /* 6px - Cards, panels */
  --radius-lg: 0.5rem;      /* 8px - Larger cards */
  --radius-xl: 0.75rem;     /* 12px - Modals */
  --radius-2xl: 1rem;       /* 16px - Hero elements */
  --radius-full: 50%;       /* Circles, avatars */
}
```

## Shadow System

### Elevation Shadows
```css
:root {
  /* Progressive shadow system for depth hierarchy */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 
               0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
               0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
               0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
               0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Special glassmorphism shadows */
  --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  --shadow-glow: 0 0 20px rgba(26, 140, 255, 0.3);
}
```

## Component Patterns

### Glass Card Pattern
```css
.glass-card {
  background: var(--glass-white);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass);
}

.glass-card--primary {
  background: var(--glass-primary);
  border-color: rgba(26, 140, 255, 0.3);
}

.glass-card--dark {
  background: var(--glass-dark);
  border-color: rgba(255, 255, 255, 0.1);
  color: var(--neutral-100);
}
```

### Button System
```css
/* Primary Action Button */
.btn--primary {
  background: linear-gradient(135deg, var(--primary-400), var(--primary-600));
  color: white;
  border: none;
  border-radius: var(--radius-base);
  padding: var(--padding-sm);
  font-weight: var(--font-medium);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.btn--primary:hover {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* Glass Button Variant */
.btn--glass {
  background: var(--glass-white);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  color: var(--neutral-700);
}

.btn--glass:hover {
  background: var(--glass-border);
  border-color: var(--glass-border-strong);
}
```

## Motion Design Standards

### Animation Timing & Easing
```css
:root {
  /* Standard timing values */
  --duration-fast: 150ms;      /* Quick feedback */
  --duration-normal: 250ms;    /* Standard transitions */
  --duration-slow: 400ms;      /* Complex animations */
  --duration-page: 500ms;      /* Page transitions */
  
  /* Easing curves for natural motion */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Framer Motion Variants
```javascript
// Standard page transition
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { 
    duration: 0.4, 
    ease: [0.16, 1, 0.3, 1] 
  }
};

// Staggered list animation
export const listContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const listItem = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.25 }
  }
};

// Modal entrance
export const modalVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.9,
    y: 20
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};
```

## Responsive Breakpoint System

```css
:root {
  /* Breakpoint definitions */
  --bp-sm: 640px;     /* Small tablets */
  --bp-md: 768px;     /* Large tablets */
  --bp-lg: 1024px;    /* Small desktops */
  --bp-xl: 1280px;    /* Large desktops */
  --bp-2xl: 1536px;   /* Extra large screens */
}

/* Mobile-first media queries */
@media (min-width: 640px) { /* sm+ */ }
@media (min-width: 768px) { /* md+ */ }
@media (min-width: 1024px) { /* lg+ */ }
@media (min-width: 1280px) { /* xl+ */ }
@media (min-width: 1536px) { /* 2xl+ */ }
```

### Layout Patterns by Breakpoint
- **Mobile (< 640px)**: Single column, stacked navigation, full-width cards
- **Tablet (640-1024px)**: Two-column layouts, slide-out navigation, condensed cards  
- **Desktop (1024px+)**: Multi-column grids, persistent sidebar, full feature density

## Component State System

### Interactive States
```css
/* Standard interactive state progression */
.interactive {
  transition: all var(--duration-fast) var(--ease-out);
}

.interactive:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.interactive:active {
  transform: translateY(0);
  transition-duration: var(--duration-fast);
}

.interactive:focus-visible {
  outline: 2px solid var(--primary-400);
  outline-offset: 2px;
}

.interactive:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

### Loading States
```css
/* Skeleton loading animation */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.skeleton {
  background: linear-gradient(
    90deg, 
    var(--neutral-200) 0%, 
    var(--neutral-100) 50%, 
    var(--neutral-200) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
```

## Usage Guidelines

### Do's
- ✅ Use design tokens consistently across all components
- ✅ Implement glassmorphism effects with backdrop-filter support
- ✅ Follow the 4px spacing system for all layout decisions
- ✅ Apply motion purposefully to enhance user experience
- ✅ Maintain color contrast ratios for accessibility (4.5:1 minimum)
- ✅ Use semantic color meanings consistently (green = success, red = error)

### Don'ts  
- ❌ Never hardcode color values - always use CSS custom properties
- ❌ Don't add animations that delay user interactions
- ❌ Don't break the spacing system with arbitrary values
- ❌ Don't use glassmorphism on text-heavy content (readability)
- ❌ Don't modify anything under `<<OTHER_SITE_PATH_OR_ROUTE>>`

### Critical Constraint
**Protected Areas**: Any changes to shared components, styles, or routes that both the main application and `<<OTHER_SITE_PATH_OR_ROUTE>>` depend on must be flagged in design.md as a shared-dependency risk rather than implemented silently.

This design system provides the foundation for a cohesive, professional, and distinctively styled CRM interface that stands apart from generic admin templates while maintaining usability and accessibility standards.