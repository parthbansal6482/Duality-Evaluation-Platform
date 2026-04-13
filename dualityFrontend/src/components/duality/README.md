# Duality - Individual Evaluation & Assignments

## Overview

Duality is a dedicated evaluation and assignments platform integrated into the Duality Evaluation system. It provides a LeetCode-style environment where students can solve assignments anytime, track their progress, and build their technical profile.

## Features

### 1. **Platform Selection Landing**
- Clean landing page with two options:
  - **Duality**: Individual Evaluation & Assignments
  - **Duality Extended**: Professional Competition Platform
- Consistent dark theme (black/grey/zinc) across both platforms

### 2. **Google Authentication**
- Single sign-in using Google OAuth (via DualityAuth)
- Automatic role detection (Admin vs Student) from database
- Secure authentication flow via backend evaluation
- Clean, modern auth interface

### 3. **Student Dashboard**
- **Problem List**: Browse all available DSA problems
- **Filtering**: Filter by difficulty (Easy/Medium/Hard) and category
- **Stats Overview**: Track solved problems with visual progress bars
- **Profile Tab**: View detailed statistics, achievements, and activity
- **Navigation**: Seamless switching between Problems and Profile views

### 4. **Admin Dashboard**
- **Question Management**: Add, edit, and delete DSA questions
- **Category Organization**: Organize questions by topic
- **Difficulty Assignment**: Set difficulty levels for each problem
- **Test Case Management**: Define number of test cases per question
- **Statistics**: View question distribution by difficulty

### 5. **Problem Solving Interface**
- **Split View**: Problem description on left, code editor on right
- **Multi-Language Support**: Python, JavaScript, C++, Java
- **Live Code Editor**: Full-featured textarea for code editing
- **Test Execution**: Run code against test cases
- **Results Display**: Visual feedback on test case pass/fail
- **Code Submission**: Submit solutions for evaluation
- **Reset Functionality**: Reset to starter code template

### 6. **Profile & Progress Tracking**
- **User Stats**: Total solved, by difficulty breakdown
- **Activity Timeline**: Recent problem-solving activity
- **Achievements System**: Unlock badges and milestones
- **Streak Tracking**: Daily coding streaks
- **Rank Display**: User ranking based on performance
- **Progress Visualization**: Charts and progress bars

## Component Structure

```
/components/duality//
├── Landing.tsx              # Platform selection page
├── DualityAuth.tsx           # Real Google authentication component
├── StudentDashboard.tsx     # Main student interface
├── AdminDashboard.tsx       # Admin question management
├── ProblemSolve.tsx         # Problem-solving interface
├── Profile.tsx              # User profile and statistics
└── README.md               # This file
```

## Theme Consistency

All Duality components follow the same design language as Duality Extended:

- **Background**: Pure black (#000000)
- **Cards/Panels**: Zinc-900 with zinc-800 borders
- **Text**: White primary, gray-400/gray-500 secondary
- **Accents**: 
  - Green for Easy difficulty
  - Yellow for Medium difficulty
  - Red for Hard difficulty
- **Interactive Elements**: White buttons, zinc-800 hover states

## User Flows

### Student Flow
1. Land on platform selection
2. Choose "Duality"
3. Sign in with Google
4. View dashboard with problems
5. Filter/browse problems
6. Click to solve a problem
7. Write and test code
8. Submit solution
9. Return to dashboard
10. View progress in Profile tab

### Admin Flow
1. Land on platform selection
2. Choose "Duality"
3. Sign in with Google (admin account)
4. Access admin dashboard
5. Add/edit/delete questions
6. Manage test cases
7. View statistics

## Integration with Duality Extended

The Duality platform is completely separate from Duality Extended but shares:
- Same theme and design system
- Same landing page for platform selection
- Consistent navigation patterns
- Shared component library (UI components)

Users can easily switch between:
- **Duality**: For individual evaluation and assignments
- **Duality Extended**: For team competitions with tactical features

## Data Integration

The platform is fully integrated with a real backend:
- **Problems**: Fetched dynamically from the database
- **User Stats**: Real-time progress tracking and profile statistics
- **Real-time Sync**: Dashboards update instantly via WebSockets (Socket.IO)
- **Submissions**: Evaluated by a real code execution engine (Docker)
- **Authentication**: Real Google Identity Services integration

## Future Enhancements

Potential features for future development:
- Discussion forums for each problem
- Editorial solutions and explanations
- Video tutorials
- Community solutions
- Contest mode within Duality
- Peer comparison and friend leaderboards
- Email notifications for streaks
- Mobile responsive optimization
- Code snippet sharing
- Problem recommendations based on weak areas

## Technical Notes

- Built with React and TypeScript
- Uses Tailwind CSS for styling
- Lucide React for icons
- State management via React hooks
- No external routing library (managed via state)
- Fully responsive design
- Accessible components

## Usage Example

```tsx
import { Landing } from './components/duality/Landing';
import { DualityAuth } from './components/duality/DualityAuth';
import { StudentDashboard } from './components/duality/StudentDashboard';

// In App.tsx
<Landing 
  onSelectDuality={handleSelectDuality}
  onSelectDualityExtended={handleSelectDualityExtended}
/>

// After Google login
<StudentDashboard 
  userName={userName}
  onLogout={handleLogout}
  onSolveProblem={handleSolveProblem}
/>
```

## Contributing

When adding new features to Duality:
1. Maintain the dark theme consistency
2. Follow the existing component patterns
3. Use TypeScript for type safety
4. Keep components modular and reusable
5. Document any new features in this README
