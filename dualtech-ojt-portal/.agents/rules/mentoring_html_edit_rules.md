# Mentoring.html - IDE Edit Guidelines & Lock/Unlock Rules

This document outlines the rules for editing the monolithic `mentoring.html` file. Since the application is contained within a single HTML file using Babel and React, it is crucial to separate the core infrastructure (Locked) from the feature components (Unlocked) to prevent breaking the application.

## 🔒 LOCKED CODES (Do Not Edit Unless Authorized)
These sections contain the core infrastructure, routing, authentication, and dependency configurations. Modifying these without caution can break the entire application.

1. **HTML `<head>` & Configuration**
   - CDN links, `importmap` configurations, and Babel standalone scripts.
   - Global Tailwind configuration (`tailwind.config`) and global CSS styles (`<style>`).

2. **Firebase Initialization & Core Services**
   - `firebaseConfig` object and Firebase app initialization.
   - Authentication and Firestore services (`auth`, `db`, `appId`).
   - Core system logging functions (e.g., `logSystemAction`).

3. **Authentication Component (`MentoringLogin`)**
   - The entire `MentoringLogin` React component.
   - Session handling, Admin checking, and login UI.

4. **Main Application Shell (`function App()`)**
   - The main `App` component that acts as the router and container.
   - Sidebar navigation logic and layout structure (unless you are specifically adding a **new** tab).
   - Core state hooks for user sessions (`user`, `adminData`, `activeTab`).
   - Global UI components like `NotificationDetailModal` and `ProfileModal` (unless UI updates are requested).

5. **Helper / Utility Skeletons**
   - `ListSkeleton` component used for loading states.

---

## 🔓 UNLOCKED CODES (Safe to Edit)
These sections contain the individual business logic, UI, and data fetching for specific tabs. The IDE is allowed to freely modify these parts to update features, fix bugs, or change the UI.

### 1. Dashboards & Analytics
- **`AstpSchoolingDashboard`**: The main dashboard showing active/completed trainees categorized by months, the main graphs, and the tabular data under it.

### 2. Schedule & Attendance Management
- **`CalendarTab`**: The schooling calendar UI, date additions/removals, and scheduling logic.
- **`SchoolingAttendanceTab`**: The main interface for viewing, verifying, and exporting attendance records.
- **`SchoolingAssignmentTab`**: Logic for assigning trainees to schooling venues and schedules.

### 3. Record Keeping & Submissions
- **`MentorClockRecordsTab`**: Viewing clock-in and clock-out records, location calculations, and mapping functionalities.
- **`OnlineSchoolingSubmissionsTab`**: Managing online schooling submissions, extended schooling requests, and credits.
- **`ImportRecordsTab`**: File upload components, CSV parsing, and data importing logic.
- **`AbsenceDisputesTab`**: The interface for managing and resolving trainee absence disputes.

### 4. UI/UX Tweaks within Tabs
- **Tailwind CSS classes** inside any of the unlocked components.
- **Table sorting logic**, search filtering, and pagination within the tabs.
- **Export to XLS/CSV** functions inside the respective tabs.

---

## 🛠️ General Best Practices for IDEs
- **Single Component Focus**: When instructed to modify a feature, the IDE should locate the specific `Tab` component (e.g., `CalendarTab`) and restrict changes to that scope.
- **State Management**: Do not lift state up to the `App` component unless necessary; keep local state within the specific `Tab` components.
- **Data Fetching**: Ensure Firestore queries inside unlocked components include error handling and loading states (`setLoading`).
