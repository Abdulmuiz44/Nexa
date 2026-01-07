# Dashboard UI Styling Alignment Guide

## What Was Fixed

The main dashboard pages have been updated to match the homepage's clean, minimal design system. This ensures visual consistency across the entire application.

### Completed Major Pages

#### 1. Dashboard Page (`/dashboard`)
- ✅ Metric cards replaced from `<Card>` to custom styled divs with borders
- ✅ Recent Activity card updated
- ✅ Connected Accounts card updated
- ✅ All text colors updated to use `text-gray-600 dark:text-gray-400`

#### 2. Analytics Page (`/dashboard/analytics`)
- ✅ Key metrics (4 stat cards) updated
- ✅ Platform performance section updated
- ✅ AI Learning Insights section redesigned
- ✅ Recent Posts Performance section updated
- ✅ Advanced Analytics (Predictive Insights, Competitor Analysis, ROI, Recommendations)

#### 3. Agents Page (`/dashboard/agents`)
- ✅ Agent grid cards updated with new border styling
- ✅ Quick Start section updated
- ✅ Status badges and capabilities refactored

#### 4. Campaigns Page (`/dashboard/campaigns`)
- ✅ Campaign grid cards updated
- ✅ Create campaign card redesigned
- ✅ Empty state icons and text updated

#### 5. Connections Page (`/dashboard/connections`)
- ✅ Connected accounts cards updated
- ✅ Platform connection cards updated
- ✅ Loading and empty states refactored

## Styling Pattern Applied

### Color Scheme
```
Light Mode:
- Background: white
- Text: black
- Borders: gray-200
- Hover borders: gray-400
- Muted text: gray-600
- Light backgrounds: gray-100

Dark Mode:
- Background: black
- Text: white
- Borders: gray-800
- Hover borders: gray-600
- Muted text: gray-400
- Light backgrounds: gray-800
```

### Card Component Replacement

**Old Pattern:**
```tsx
<Card className="p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

**New Pattern:**
```tsx
<div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
  <h3 className="text-lg font-semibold mb-4">Title</h3>
  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Description</p>
  <div>
    Content here
  </div>
</div>
```

### Typography Replacements

| Old | New |
|-----|-----|
| `text-muted-foreground` | `text-gray-600 dark:text-gray-400` |
| `text-primary` | `text-blue-600 dark:text-blue-400` |
| `bg-primary/10` | `bg-blue-100 dark:bg-blue-900/30` |
| `bg-muted` | `bg-gray-100 dark:bg-gray-800` |
| `bg-accent` | `bg-gray-100 dark:bg-gray-800` |
| `text-accent` | `text-gray-700 dark:text-gray-300` |

## Remaining Pages to Update

The following pages should be updated using the same pattern:

### High Priority
- `agent-demo/page.tsx`
- `logs/page.tsx`
- `scheduled/page.tsx`
- `content-hub/page.tsx`
- `settings/page.tsx` (header done, cards need updating)

### Medium Priority
- `engage/page.tsx`
- `performance/page.tsx`
- `reports/page.tsx`
- `experiments/page.tsx`
- `notifications/page.tsx`

### Lower Priority (Form Pages)
- `campaigns/new/page.tsx`
- `campaigns/[id]/edit/page.tsx`
- `repurpose/page.tsx`

### Already Fixed
- `billing/page.tsx` (header done, remaining fixes in progress)
- `approvals/page.tsx` (header done, remaining fixes in progress)

## Quick Implementation Checklist

For each remaining page:

1. **Header Section**
   ```tsx
   // Update description text
   <p className="text-gray-600 dark:text-gray-400">...</p>
   ```

2. **Card Replacements**
   - Replace all `<Card>` with styled `<div>`
   - Add border: `border border-gray-200 dark:border-gray-800`
   - Add hover state: `hover:border-gray-400 dark:hover:border-gray-600`
   - Add transition: `transition-colors`

3. **Text Color Updates**
   - Replace `text-muted-foreground` everywhere
   - Replace `text-primary` with `text-blue-600 dark:text-blue-400`
   - Replace `bg-muted` and `bg-accent`

4. **CardHeader/CardTitle/CardContent**
   - Convert to semantic HTML and divs
   - Use `<h3 className="text-lg font-semibold mb-4">` for titles
   - Use `<p className="text-sm text-gray-600 dark:text-gray-400">` for descriptions

## Testing

After updates, verify:
- ✅ Light mode colors match homepage design
- ✅ Dark mode colors are properly inverted
- ✅ Borders appear on hover
- ✅ Text contrast meets accessibility standards
- ✅ Icons maintain proper colors
- ✅ Empty states are styled consistently

## Homepage Reference

The homepage design (white bg, gray borders, gray text) is the definitive style guide:
- Location: `/app/page.tsx`
- Key sections to reference:
  - Features grid (lines 37-79)
  - Pricing cards (lines 82-147)
  - FAQ section (lines 149-180)
