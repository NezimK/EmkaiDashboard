# Patterns d'Optimisation des Couleurs Dark/Light Mode

## Patterns à Appliquer Systématiquement

### Backgrounds
- `bg-white` → `bg-white dark:bg-dark-card`
- `bg-gray-50` → `bg-gray-50 dark:bg-gray-900/50`
- `bg-gray-100` → `bg-gray-100 dark:bg-gray-800`
- `bg-gray-200` → `bg-gray-200 dark:bg-gray-700`

### Borders
- `border-gray-200` → `border-gray-200 dark:border-gray-700`
- `border-gray-300` → `border-gray-300 dark:border-gray-600`
- `border` seul → `border border-gray-200 dark:border-gray-700`

### Text Colors
- `text-gray-600` → `text-gray-600 dark:text-gray-400`
- `text-gray-700` → `text-gray-700 dark:text-gray-300`
- `text-gray-800` → `text-gray-800 dark:text-gray-200`
- `text-gray-900` → `text-gray-900 dark:text-white`
- `text-gray-500` → `text-gray-500 dark:text-gray-400`

### Colored Backgrounds (Status, Badges)
- `bg-red-100` → `bg-red-100 dark:bg-red-900/40`
- `bg-orange-100` → `bg-orange-100 dark:bg-orange-900/40`
- `bg-blue-100` → `bg-blue-100 dark:bg-blue-900/40`
- `bg-green-100` → `bg-green-100 dark:bg-green-900/40`

### Colored Text
- `text-red-600` → `text-red-600 dark:text-red-400`
- `text-orange-600` → `text-orange-600 dark:text-orange-400`
- `text-blue-600` → `text-blue-600 dark:text-blue-400`
- `text-green-600` → `text-green-600 dark:text-green-400`

### Hover States
- `hover:bg-gray-100` → `hover:bg-gray-100 dark:hover:bg-gray-800`
- `hover:bg-gray-50` → `hover:bg-gray-50 dark:hover:bg-gray-900/50`
- `hover:shadow-lg` → `hover:shadow-lg dark:hover:shadow-accent/10`

### Focus States
- `focus:ring-blue-500` → `focus:ring-blue-500 dark:focus:ring-blue-400`
- `focus:border-blue-500` → `focus:border-blue-500 dark:focus:border-blue-400`

## Composants Déjà Optimisés
- ✅ KpiStats.jsx
- ✅ LeadCard.jsx
- ✅ Toast.jsx
- ✅ Sidebar.jsx

## Composants à Optimiser
- ⏳ LeadModal.jsx
- ⏳ ConversationModal.jsx
- ⏳ StatusSelector.jsx
- ⏳ FilterBar.jsx
- ⏳ VisitsCalendar.jsx
- ⏳ Login.jsx
- ⏳ Settings.jsx
- ⏳ Header.jsx
- ⏳ ManagerView.jsx
- ⏳ ConfirmDialog.jsx
- ⏳ AgentSelector.jsx
- ⏳ KPICard.jsx
