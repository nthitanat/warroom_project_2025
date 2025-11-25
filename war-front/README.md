# War Room Project - React Frontend

React-based frontend for the War Room Community Analytics Platform.

## Features

- React 18 with React Router
- Custom SCSS styling system (no Material UI)
- Component architecture: Component + Handler + SCSS pattern
- Centralized API service layer with Axios
- MapLibre GL for analytics visualization
- Drag-and-drop layer management
- JWT authentication with protected routes

## Project Structure

```
war-front/
├── public/                  # Static assets
│   ├── analytics/          # Analytics data and tiles
│   ├── charities/          # Charity images and data
│   ├── lesson/             # Lesson content
│   └── warroom/            # War room data
├── src/
│   ├── api/                # API service layer
│   │   ├── axiosInstance.js
│   │   ├── authService.js
│   │   ├── charitiesService.js
│   │   ├── lessonsService.js
│   │   ├── warroomService.js
│   │   └── analyticsService.js
│   ├── components/          # React components
│   │   ├── analytics/      # Analytics map components
│   │   └── common/         # Shared components
│   ├── context/            # React Context (Auth)
│   ├── pages/              # Page components
│   ├── styles/             # Global SCSS system
│   │   ├── main.scss       # Main styles and mixins
│   │   └── colors.scss     # Color variables
│   ├── App.js
│   └── index.js
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the war-front directory:
```bash
cd war-front
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_MAPTILER_API_KEY=your_maptiler_api_key
```

### Running the Application

Development mode:
```bash
npm start
```

Build for production:
```bash
npm run build
```

The application will open at `http://localhost:3000`

## Component Architecture

Each component follows a 4-file pattern:

```
ComponentName/
├── ComponentName.jsx          # React component (presentation)
├── ComponentName.module.scss  # Component styles
├── useComponentName.js        # Custom hook for state management
└── ComponentNameHandler.js    # Business logic and event handlers
```

### Example: AnalyticMaps Component

```jsx
// AnalyticMaps.jsx - Presentation
import React from 'react';
import useAnalyticMaps from './useAnalyticMaps';
import AnalyticMapsHandler from './AnalyticMapsHandler';
import styles from './AnalyticMaps.module.scss';

export default function AnalyticMaps({ provinces }) {
  const { stateAnalyticMaps, setAnalyticMaps } = useAnalyticMaps();
  const handlers = AnalyticMapsHandler(stateAnalyticMaps, setAnalyticMaps);
  
  return (
    <div className={styles.Container}>
      {/* Component JSX */}
    </div>
  );
}
```

## SCSS System

### Color Variables

All colors are defined in `src/styles/colors.scss`:
- Primary colors: `--primary-50` to `--primary-900`
- Secondary colors: `--secondary-50` to `--secondary-900`
- Semantic colors: `--success`, `--warning`, `--error`, `--info`
- Theme colors: `--background-default`, `--text-primary`, etc.

### Using SCSS

Import main.scss in every component SCSS file:

```scss
@import '../../styles/main.scss';

.Container {
  @include flex-column;
  padding: $spacing-lg;
  background: var(--background-default);
  color: var(--text-primary);
}
```

## API Integration

All API calls use the centralized axios instance:

```javascript
// In a handler file
import { getCharities } from '../../api/charitiesService';

const handleFetchCharities = async () => {
  try {
    setComponent('loading', true);
    const response = await getCharities({ page: 1, limit: 10 });
    setComponent('charities', response.data.charities);
  } catch (error) {
    setComponent('error', error.message);
  } finally {
    setComponent('loading', false);
  }
};
```

## Authentication

The app uses JWT authentication with protected routes:

- Public routes: `/`, `/signin`, `/signup`
- Protected routes: `/analytics`, `/charities`, `/lessons`, etc.
- Admin routes: `/admin-dashboard`

Authentication state is managed via React Context (`src/context/AuthContext.js`).

## Analytics Map Features

The analytics page includes:
- MapLibre GL integration for map rendering
- Multiple layer types (contours, streams, drainage, villages)
- Drag-and-drop layer ordering
- Layer visibility toggle
- Province search
- Street/Satellite map styles
- Interactive popups with village information

## Available Scripts

- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - War Room Project
