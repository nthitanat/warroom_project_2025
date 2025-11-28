---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

# Component and Page Creation Guide for WarRoom Project

This guide outlines the architectural patterns and file organization structure for creating new components and pages in the WarRoom React application.

## Table of Contents
1. [Project Architecture Overview](#project-architecture-overview)
2. [API Layer Pattern](#api-layer-pattern)
3. [Page Structure Pattern](#page-structure-pattern)
4. [Component Structure Pattern](#component-structure-pattern)
5. [Styling Guidelines](#styling-guidelines)
6. [Step-by-Step Creation Process](#step-by-step-creation-process)
7. [Examples](#examples)

---

## Project Architecture Overview

The project follows a **separation of concerns** pattern with the following structure:

```
src/
├── api/                    # API service layer
│   ├── axiosInstance.js    # Centralized axios configuration
│   └── *Service.js         # Service files for each domain
├── components/             # Reusable components
│   ├── common/            # Shared components (Navbar, Modal, etc.)
│   └── [domain]/          # Domain-specific components
│       └── [ComponentName]/
│           ├── ComponentName.jsx
│           ├── ComponentName.module.scss
│           ├── useComponentName.js      (optional)
│           └── ComponentNameHandler.js  (optional)
├── pages/                 # Route-level pages
│   └── [PageName]/
│       ├── PageName.jsx
│       ├── PageName.module.scss
│       ├── usePageName.js
│       └── PageNameHandler.js
├── context/               # React Context providers
├── styles/                # Global styles
│   ├── main.scss         # Main stylesheet with mixins
│   ├── colors.scss       # Color palette and theme variables
│   └── animations.scss   # Animation keyframes and mixins
└── App.js                # Main app with routing
```

---

## API Layer Pattern

### 1. Axios Instance (`src/api/axiosInstance.js`)
**DO NOT MODIFY** this file. It provides:
- Base URL configuration
- Authentication token injection
- Global error handling (401 redirects)
- Request/response interceptors

### 2. Service Files Pattern (`src/api/[domain]Service.js`)

Each domain (lessons, charities, users, warroom, etc.) has its own service file.

**Naming Convention:** `[domain]Service.js` (e.g., `lessonsService.js`, `charitiesService.js`)

**Structure:**
```javascript
import axiosInstance from './axiosInstance';

// Get all items
export const getAllItems = (params) =>
  axiosInstance.get('/items', { params });

// Alias (if needed for backward compatibility)
export const getItems = (params) =>
  axiosInstance.get('/items', { params });

// Get item by ID
export const getItemById = (id) =>
  axiosInstance.get(`/items/${id}`);

// Get image/file (with blob response)
export const getItemImage = (itemId) =>
  axiosInstance.get(`/items/${itemId}/image`, {
    responseType: 'blob'
  });

// Create item (admin only)
export const createItem = (data) =>
  axiosInstance.post('/items', data);

// Update item (admin only)
export const updateItem = (id, data) =>
  axiosInstance.put(`/items/${id}`, data);

// Delete item (admin only)
export const deleteItem = (id) =>
  axiosInstance.delete(`/items/${id}`);
```

**Key Points:**
- Import `axiosInstance`, NOT axios directly
- Use arrow functions for exports
- For images/files, use `responseType: 'blob'`
- Keep functions simple and focused
- Use consistent naming: `get`, `create`, `update`, `delete` prefixes

---

## Page Structure Pattern

Pages represent route-level components with their own state management.

### File Structure for a Page
```
src/pages/[PageName]/
├── PageName.jsx              # Main page component
├── PageName.module.scss      # Scoped styles
├── usePageName.js           # Custom hook for state management
└── PageNameHandler.js       # Business logic and event handlers
```

### 1. Main Page Component (`PageName.jsx`)

**Purpose:** Render UI, orchestrate data fetching, and delegate logic to handlers.

**Pattern:**
```jsx
import React, { useEffect, useState } from 'react';
import usePageName from './usePageName';
import PageNameHandler from './PageNameHandler';
import { getItems, getItemImage } from '../../api/itemsService';
import { LoadingIndicator } from '../../components/common';
import styles from './PageName.module.scss';

export default function PageName() {
  const { statePageName, setPageName } = usePageName();
  const handlers = PageNameHandler(statePageName, setPageName);
  const [imageUrls, setImageUrls] = useState({});

  // Initial data fetch
  useEffect(() => {
    handlers.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch images from API (if needed)
  useEffect(() => {
    const fetchImages = async () => {
      if (!statePageName.items || statePageName.items.length === 0) return;

      const urls = {};
      for (const item of statePageName.items) {
        try {
          const response = await getItemImage(item.id);
          const imageBlob = new Blob([response.data]);
          const imageObjectURL = URL.createObjectURL(imageBlob);
          urls[item.id] = imageObjectURL;
        } catch (error) {
          console.error(`Failed to load image for item ${item.id}:`, error);
          urls[item.id] = '/images/fallback.jpg';
        }
      }
      setImageUrls(urls);
    };

    fetchImages();

    // Cleanup function to revoke object URLs
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [statePageName.items]);

  // Loading state
  if (statePageName.loading) {
    return <LoadingIndicator message="Loading..." />;
  }

  // Error state
  if (statePageName.error) {
    return (
      <div className={styles.Container}>
        <div className={styles.Error}>{statePageName.error}</div>
      </div>
    );
  }

  // Main render
  return (
    <div className={styles.Container}>
      <h1 className={styles.Title}>Page Title</h1>
      
      <div className={styles.Grid}>
        {statePageName.items.map((item, index) => (
          <div key={item.id || index} className={styles.Card}>
            {imageUrls[item.id] && (
              <img
                src={imageUrls[item.id]}
                alt={item.title}
                className={styles.CardImage}
                onError={(e) => {
                  console.error('Image loading error:', e);
                  e.target.src = '/images/fallback.jpg';
                }}
              />
            )}
            <div className={styles.CardContent}>
              <h4 className={styles.CardTitle}>{item.title}</h4>
              <p className={styles.CardDescription}>{item.description}</p>
              <button
                onClick={() => handlers.handleAction(item.id)}
                className={styles.Button}
              >
                Action
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Key Points:**
- Default export the function component
- Use custom hooks for state (`usePageName`)
- Use handler file for business logic (`PageNameHandler`)
- Handle loading/error states
- Cleanup blob URLs in useEffect return
- Use `styles.ClassName` for CSS modules
- Always provide fallback images with `onError`
- Use `key={item.id || index}` for lists

### 2. State Management Hook (`usePageName.js`)

**Purpose:** Centralize state management with a flexible setter.

**Pattern:**
```javascript
import { useState } from 'react';

const usePageName = () => {
  const [statePageName, setState] = useState({
    items: [],
    selectedItem: null,
    loading: true,
    error: null,
    modalOpen: false,
    // Add more state fields as needed
  });

  const setPageName = (field, value) => {
    if (typeof field === 'object') {
      // Update multiple fields at once
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      // Update single field
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  return {
    statePageName,
    setPageName,
  };
};

export default usePageName;
```

**Key Points:**
- State name follows pattern: `state[PageName]`
- Setter name follows pattern: `set[PageName]`
- Setter supports both single field and object updates
- Initialize all state fields with default values
- Always include `loading` and `error` fields

### 3. Handler File (`PageNameHandler.js`)

**Purpose:** Separate business logic, API calls, and event handlers from UI.

**Pattern:**
```javascript
import { useNavigate } from 'react-router-dom';
import { getItems, createItem, deleteItem } from '../../api/itemsService';

const PageNameHandler = (statePageName, setPageName) => {
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await getItems();
      setPageName('items', response.data.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      setPageName('error', 'Failed to load items');
    } finally {
      setPageName('loading', false);
    }
  };

  const handleAction = (itemId) => {
    // Handle action logic
    console.log('Action for item:', itemId);
  };

  const handleOpenModal = () => {
    setPageName('modalOpen', true);
  };

  const handleCloseModal = () => {
    setPageName('modalOpen', false);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return {
    fetchData,
    handleAction,
    handleOpenModal,
    handleCloseModal,
    handleNavigate,
  };
};

export default PageNameHandler;
```

**Key Points:**
- Takes state and setter as parameters
- Use `useNavigate` for routing (not useHistory)
- Handler names start with `handle` or `fetch`
- Always wrap API calls in try-catch
- Set `loading: false` in finally block
- Return all handlers as an object
- Keep functions pure and testable

---

## Component Structure Pattern

Components are reusable pieces of UI, organized by domain.

### File Structure for a Component
```
src/components/[domain]/[ComponentName]/
├── ComponentName.jsx
├── ComponentName.module.scss
├── useComponentName.js      (optional, for complex state)
└── ComponentNameHandler.js  (optional, for complex logic)
```

### Component Pattern
```jsx
import React, { useEffect, useState } from 'react';
import styles from './ComponentName.module.scss';

export default function ComponentName({ prop1, prop2, onAction }) {
  const [localState, setLocalState] = useState(null);

  useEffect(() => {
    // Component initialization logic
  }, []);

  const handleClick = () => {
    // Local handler logic
    if (onAction) onAction();
  };

  return (
    <div className={styles.Container}>
      {/* Component content */}
    </div>
  );
}
```

**Key Points:**
- Keep components focused and reusable
- Use props for data and callbacks
- Local state for component-specific UI state
- Extract to custom hooks if state logic is complex

### Common Component Pattern (`src/components/common/`)

Common components are shared across the entire app:
- Navbar
- Modal
- PrivateRoute
- LoadingIndicator
- Loading spinner
- Error boundary

---

## Styling Guidelines

### 1. CSS Modules Pattern

**File:** `ComponentName.module.scss`

**Import main stylesheet:**
```scss
@import '../../../styles/main.scss';  // Adjust path based on depth
```

**Use BEM-like naming with PascalCase:**
```scss
.Container {
  min-height: 100vh;
  padding: $spacing-xl 0;
  background: var(--gradient-primary);
}

.Card {
  @include glass-card;
  padding: $spacing-lg;
}

.CardTitle {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}

.CardActive {
  border-color: var(--border-glow);
  box-shadow: var(--shadow-glow);
}
```

### 2. Global Styles (`src/styles/main.scss`)

**Available Variables:**
- **Spacing:** `$spacing-xs` to `$spacing-3xl`
- **Font sizes:** `$font-size-xs` to `$font-size-4xl`
- **Font weights:** `$font-weight-light` to `$font-weight-bold`
- **Border radius:** `$border-radius-sm` to `$border-radius-full`
- **Breakpoints:** `$breakpoint-sm` to `$breakpoint-xl`
- **Transitions:** `$transition-fast`, `$transition-base`, `$transition-slow`

**Available Mixins:**
```scss
@include flex-center;         // Center content
@include flex-between;        // Space between items
@include flex-column;         // Vertical flex layout
@include container;           // Max-width container
@include button-reset;        // Remove button styles
@include card;                // Basic card style
@include glass-card;          // Glassmorphism card
@include glass-panel;         // Glassmorphism panel
@include glass-button;        // Glassmorphism button
@include glass-input;         // Glassmorphism input
@include glow-effect;         // Glowing shadow
@include truncate;            // Single line truncate
@include line-clamp($lines);  // Multi-line truncate
@include media-up($breakpoint);     // Min-width media query
@include media-down($breakpoint);   // Max-width media query
@include media-between($min, $max); // Range media query
@include fade-in;             // Fade in animation
@include slide-up;            // Slide up animation
```

### 3. Animation System (`src/styles/animations.scss`)

**DO NOT HARDCODE ANIMATIONS** - Use animation mixins:

**Available Animation Mixins:**
```scss
@include animate-fade-in($duration, $delay);          // Fade in animation
@include animate-slide-up($duration, $delay);         // Slide up animation
@include animate-slide-in-left($duration, $delay);    // Slide in from left
@include animate-slide-in-right($duration, $delay);   // Slide in from right
@include animate-scale-in($duration, $delay);         // Scale in animation
@include animate-pulse($duration);                    // Pulse animation
@include animate-bounce($duration);                   // Bounce animation
@include animate-rotate($duration);                   // Rotate animation
@include animate-pattern-move($duration);             // Pattern movement
@include animate-glow-pulse($duration);               // Glow pulse effect
```

**Available Keyframes:**
- fadeIn, fadeOut, fadeInUp, fadeInDown
- slideUp, slideDown, slideInLeft, slideInRight
- scaleIn, scaleOut, pulse
- rotate, rotateIn
- bounce, bounceIn, shake
- shimmer, loading
- patternMove, patternFloat
- wave, glowPulse

**Usage Example:**
```scss
.HeroContent {
  @include animate-slide-in-left(0.8s);
}

.Card {
  @include animate-scale-in;
  
  &:hover {
    @include animate-pulse(2s);
  }
}
```

### 4. Color System (`src/styles/colors.scss`)

**DO NOT MODIFY** - Use CSS variables:

**Primary colors:**
- `var(--primary-500)` - Main brand color
- `var(--primary-50)` to `var(--primary-900)` - Shades

**Semantic colors:**
- `var(--success)` - Green
- `var(--warning)` - Yellow
- `var(--error)` - Red
- `var(--info)` - Blue

**Background colors:**
- `var(--background-default)` - Main background
- `var(--background-paper)` - Card/panel background
- `var(--background-glass)` - Glassmorphism background
- `var(--background-glass-hover)` - Hover state
- `var(--background-glass-active)` - Active state

**Text colors:**
- `var(--text-primary)` - Main text
- `var(--text-secondary)` - Secondary text
- `var(--text-disabled)` - Disabled text
- `var(--text-accent)` - Accent text

**Border colors:**
- `var(--border-light)` - Light borders
- `var(--border-medium)` - Medium borders
- `var(--border-dark)` - Dark borders
- `var(--border-glow)` - Glowing borders

**Shadows:**
- `var(--shadow-sm)` to `var(--shadow-xl)` - Elevation shadows
- `var(--shadow-glow)` - Glowing effect
- `var(--shadow-glow-strong)` - Strong glow

**Gradients:**
- `var(--gradient-primary)` - Primary gradient
- `var(--gradient-accent)` - Accent gradient
- `var(--gradient-glass)` - Glass gradient

### 4. Styling Best Practices

**DO:**
- Use CSS modules for component styles
- Import `main.scss` at the top of every `.module.scss` file
- Use mixins and variables from `main.scss`
- Use CSS variables from `colors.scss`
- Use animation mixins from `animations.scss`
- Use PascalCase for class names (e.g., `.CardTitle`)
- Use `@include media-down()` for responsive design
- Apply glassmorphism with `@include glass-card`

**DON'T:**
- Don't use inline styles unless absolutely necessary
- Don't hardcode colors - use CSS variables
- Don't hardcode spacing - use spacing variables
- Don't hardcode animations - use animation mixins
- Don't create global styles in component files
- Don't modify `colors.scss` or base `main.scss` mixins
- Don't define keyframes in component files - use `animations.scss`

---

## Step-by-Step Creation Process

### Creating a New Page

1. **Create folder structure:**
   ```bash
   mkdir -p src/pages/NewPage
   touch src/pages/NewPage/NewPage.jsx
   touch src/pages/NewPage/NewPage.module.scss
   touch src/pages/NewPage/useNewPage.js
   touch src/pages/NewPage/NewPageHandler.js
   ```

2. **Create API service** (if needed):
   ```bash
   touch src/api/newPageService.js
   ```
   - Follow API service pattern
   - Import `axiosInstance`
   - Define CRUD operations

3. **Create state hook** (`useNewPage.js`):
   - Copy template from existing hook
   - Define initial state
   - Create flexible setter

4. **Create handler** (`NewPageHandler.js`):
   - Import API service functions
   - Define data fetching logic
   - Define event handlers
   - Return handlers object

5. **Create main component** (`NewPage.jsx`):
   - Import hooks and handlers
   - Add useEffect for data fetching
   - Handle loading/error states
   - Render main UI

6. **Create styles** (`NewPage.module.scss`):
   - Import `main.scss`
   - Use mixins and variables
   - Follow BEM-like naming

7. **Add route to App.js:**
   ```javascript
   import NewPage from './pages/NewPage/NewPage';
   
   // In Routes:
   <Route path="/new-page" element={<NewPage />} />
   ```

8. **Add navigation link** (if needed):
   - Add to `Navbar.jsx`
   - Add to mobile menu
   - Add to banner titles (if applicable)

### Creating a New Component

1. **Create folder structure:**
   ```bash
   mkdir -p src/components/[domain]/NewComponent
   touch src/components/[domain]/NewComponent/NewComponent.jsx
   touch src/components/[domain]/NewComponent/NewComponent.module.scss
   ```

2. **Create component** (`NewComponent.jsx`):
   - Define props
   - Add local state (if needed)
   - Implement render logic

3. **Create styles** (`NewComponent.module.scss`):
   - Import `main.scss`
   - Use mixins and variables
   - Keep styles scoped

4. **Export from index** (if in common):
   ```javascript
   // src/components/common/index.js
   export { default as NewComponent } from './NewComponent/NewComponent';
   ```

---

## Examples

### Example 1: Simple Page (No Images)

**WarRoom.jsx:**
```jsx
import React, { useEffect } from 'react';
import useWarRoom from './useWarRoom';
import WarRoomHandler from './WarRoomHandler';
import { LoadingIndicator } from '../../components/common';
import styles from './WarRoom.module.scss';

export default function WarRoom() {
  const { stateWarRoom, setWarRoom } = useWarRoom();
  const handlers = WarRoomHandler(stateWarRoom, setWarRoom);

  useEffect(() => {
    handlers.fetchData();
  }, []);

  if (stateWarRoom.loading) return <LoadingIndicator message="Loading..." />;
  if (stateWarRoom.error) return <div>Error: {stateWarRoom.error}</div>;

  return (
    <div className={styles.Container}>
      <h1>War Room</h1>
      {/* Content */}
    </div>
  );
}
```

### Example 2: Page with Image Fetching

**Lessons.jsx pattern** (see full example in `/src/pages/Lessons/Lessons.jsx`)

### Example 3: Reusable Component with Props

**VideoModal.jsx:**
```jsx
import React from 'react';
import styles from './VideoModal.module.scss';

export default function VideoModal({ open, handleClose, videoLink }) {
  const [loading, setLoading] = React.useState(true);

  if (!open) return null;

  return (
    <div className={styles.Overlay} onClick={handleClose}>
      <div className={styles.Modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className={styles.CloseButton}>
          Close
        </button>
        {loading && <div className={styles.Loading}>Loading...</div>}
        <iframe
          src={videoLink}
          onLoad={() => setLoading(false)}
          style={{ display: loading ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
}
```

### Example 4: Component with Custom Hook

**Slide component** (see `/src/components/charities/Slide/`)

---

## Checklist for New Components/Pages

### Before Creating:
- [ ] Determine if it's a page (route) or component (reusable)
- [ ] Check if API service exists or needs creation
- [ ] Review similar existing components for patterns

### During Creation:
- [ ] Follow folder structure pattern
- [ ] Create all required files (jsx, scss, hook, handler)
- [ ] Import and use `main.scss` in style file
- [ ] Use CSS modules with PascalCase class names
- [ ] Implement loading and error states
- [ ] Add image error handling with fallbacks
- [ ] Cleanup resources (blob URLs) in useEffect return
- [ ] Use proper key props in lists
- [ ] Follow handler naming convention (handle*, fetch*)

### After Creation:
- [ ] Add route to App.js (if page)
- [ ] Add navigation link (if needed)
- [ ] Test loading state
- [ ] Test error state
- [ ] Test responsive design
- [ ] Verify glassmorphism effects
- [ ] Check console for errors/warnings

---

## Common Patterns Reference

### Pattern: Fetch Data on Mount
```javascript
useEffect(() => {
  handlers.fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### Pattern: Fetch Images with Cleanup
```javascript
useEffect(() => {
  const fetchImages = async () => {
    // Fetch logic
  };
  fetchImages();
  
  return () => {
    Object.values(imageUrls).forEach(url => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
  };
}, [dependency]);
```

### Pattern: Conditional Rendering
```javascript
if (state.loading) return <LoadingIndicator message="Loading..." />;
if (state.error) return <ErrorView />;
return <MainView />;
```

### Pattern: Map with Fallback
```javascript
{items.map((item, index) => (
  <div key={item.id || index}>
    {/* Content */}
  </div>
))}
```

### Pattern: Image with Error Handling
```jsx
<img
  src={imageUrl}
  alt={item.title}
  className={styles.Image}
  onError={(e) => {
    console.error('Image loading error:', e);
    e.target.src = '/images/fallback.jpg';
  }}
/>
```

### Pattern: Glassmorphism Card
```scss
.Card {
  @include glass-card;
  padding: $spacing-lg;
  
  &:hover {
    box-shadow: var(--shadow-glow-strong);
  }
}
```

### Pattern: Responsive Grid
```scss
.Grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: $spacing-lg;
  
  @include media-down($breakpoint-md) {
    grid-template-columns: 1fr;
  }
}
```

---

## Final Notes

- **Consistency is key** - Follow existing patterns exactly
- **Separation of concerns** - Keep UI, logic, and styles separate
- **Reusability** - Make components as reusable as possible
- **Accessibility** - Add aria-labels to interactive elements
- **Performance** - Cleanup resources, optimize re-renders
- **Error handling** - Always handle errors gracefully
- **Mobile-first** - Consider responsive design from the start

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-28  
**Maintainer:** WarRoom Development Team
