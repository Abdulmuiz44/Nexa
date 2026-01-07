# Dashboard Styling Alignment Status

## Overview
Updating all dashboard pages to match the homepage's clean, minimal design with consistent borders and gray colors.

## Completed Pages ✅
- ✅ `app/dashboard/page.tsx` - Main dashboard overview
- ✅ `app/dashboard/analytics/page.tsx` - Full analytics with charts
- ✅ `app/dashboard/agents/page.tsx` - Agent cards and quick start
- ✅ `app/dashboard/campaigns/page.tsx` - Campaign grid and studio
- ✅ `app/dashboard/connections/page.tsx` - Social media connections

## Partially Completed Pages 🟡
- 🟡 `app/dashboard/approvals/page.tsx` - Header and empty state done
- 🟡 `app/dashboard/billing/page.tsx` - Header done, remaining Card sections need fixing

## Remaining Pages to Fix 📋
- `app/dashboard/agent-demo/page.tsx`
- `app/dashboard/approvals/page.tsx` (complete remaining fixes)
- `app/dashboard/billing/page.tsx` (complete remaining fixes)
- `app/dashboard/campaigns/[id]/edit/page.tsx`
- `app/dashboard/campaigns/new/page.tsx`
- `app/dashboard/content-hub/page.tsx`
- `app/dashboard/engage/page.tsx`
- `app/dashboard/experiments/page.tsx`
- `app/dashboard/logs/page.tsx`
- `app/dashboard/notifications/page.tsx`
- `app/dashboard/performance/page.tsx`
- `app/dashboard/repurpose/page.tsx`
- `app/dashboard/reports/page.tsx`
- `app/dashboard/scheduled/page.tsx`
- `app/dashboard/settings/page.tsx`
- `app/dashboard/workflow-demo/page.tsx`

## Styling Pattern

All dashboard pages should follow this pattern from the homepage:

### Colors
- **Background**: `bg-white dark:bg-black`
- **Text**: `text-black dark:text-white`
- **Borders**: `border border-gray-200 dark:border-gray-800`
- **Borders (hover)**: `hover:border-gray-400 dark:hover:border-gray-600`
- **Muted text**: `text-gray-600 dark:text-gray-400`
- **Background sections**: `bg-gray-100 dark:bg-gray-800`

### Card Replacement
Replace:
```tsx
<Card className="p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

With:
```tsx
<div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
  <h3 className="text-lg font-semibold mb-4">Title</h3>
  <div>
    Content
  </div>
</div>
```

### Text Color Replacement
- Replace all `className="text-muted-foreground"` with `className="text-gray-600 dark:text-gray-400"`
- Replace all `text-primary` with `text-blue-600 dark:text-blue-400`
- Replace all `bg-primary/10` with `bg-blue-100 dark:bg-blue-900/30`
- Replace all `bg-muted` with `bg-gray-100 dark:bg-gray-800`
- Replace all `bg-accent` with `bg-gray-100 dark:bg-gray-800`

## Quick Fix Commands
For remaining pages, apply these global replacements:
1. `text-muted-foreground` → `text-gray-600 dark:text-gray-400`
2. `text-primary` → `text-blue-600 dark:text-blue-400`
3. `bg-primary/10` → `bg-blue-100 dark:bg-blue-900/30`
4. `bg-muted` → `bg-gray-100 dark:bg-gray-800`
5. `bg-accent` → `bg-gray-100 dark:bg-gray-800`
