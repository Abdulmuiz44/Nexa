# Dashboard Styling - Quick Reference Card

## Color Mapping (Find & Replace All)

```
❌ OLD                           ✅ NEW
text-muted-foreground      →     text-gray-600 dark:text-gray-400
text-primary               →     text-blue-600 dark:text-blue-400
bg-primary/10              →     bg-blue-100 dark:bg-blue-900/30
bg-muted                   →     bg-gray-100 dark:bg-gray-800
bg-accent                  →     bg-gray-100 dark:bg-gray-800
text-accent                →     text-gray-700 dark:text-gray-300
```

## Card Component Conversion

### Before
```tsx
<Card className="p-6">
  <CardHeader>
    <CardTitle>My Title</CardTitle>
    <CardDescription>My description</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {content}
  </CardContent>
</Card>
```

### After
```tsx
<div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
  <h3 className="text-lg font-semibold mb-4">My Title</h3>
  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">My description</p>
  <div className="space-y-4">
    {content}
  </div>
</div>
```

## Standard Classes for Reuse

### Container/Card
```tsx
className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
```

### Section Title
```tsx
className="text-lg font-semibold mb-4"
```

### Subtitle/Description
```tsx
className="text-sm text-gray-600 dark:text-gray-400"
```

### Muted Text (paragraphs)
```tsx
className="text-gray-600 dark:text-gray-400"
```

### Icon Colors
```tsx
// Primary/Blue
className="text-blue-600 dark:text-blue-400"

// Neutral/Gray
className="text-gray-400 dark:text-gray-600"

// Success/Green
className="text-green-600"

// Error/Red
className="text-red-600"
```

## Quick Checklist Per Page

- [ ] Update page title/description colors
- [ ] Convert Card components to divs
- [ ] Update all `text-muted-foreground` references
- [ ] Update all `text-primary` references
- [ ] Update all `bg-primary` references
- [ ] Update all `bg-muted` references
- [ ] Update all `bg-accent` references
- [ ] Test light mode
- [ ] Test dark mode
- [ ] Verify hover states on cards/buttons

## Common Patterns

### Empty State
```tsx
<div className="text-center py-12">
  <IconComponent className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
  <h3 className="text-xl font-semibold mb-2">No items yet</h3>
  <p className="text-gray-600 dark:text-gray-400 mb-4">Description</p>
  <Button onClick={handleAction}>Action</Button>
</div>
```

### Loading State
```tsx
<div className="text-center py-12">
  <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
  <p className="text-gray-600 dark:text-gray-400">Loading...</p>
</div>
```

### Header Section
```tsx
<div className="mb-6">
  <h1 className="text-3xl font-bold">Page Title</h1>
  <p className="text-gray-600 dark:text-gray-400 mt-2">Description text</p>
</div>
```

### Grid Container
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <div key={item.id} className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
      {/* content */}
    </div>
  ))}
</div>
```

## Files to Apply These Changes To

1. agent-demo/page.tsx
2. approvals/page.tsx (complete)
3. billing/page.tsx (complete)
4. campaigns/[id]/edit/page.tsx
5. campaigns/new/page.tsx
6. content-hub/page.tsx
7. engage/page.tsx
8. experiments/page.tsx
9. logs/page.tsx
10. notifications/page.tsx
11. performance/page.tsx
12. repurpose/page.tsx
13. reports/page.tsx
14. scheduled/page.tsx
15. settings/page.tsx (complete)
16. workflow-demo/page.tsx
