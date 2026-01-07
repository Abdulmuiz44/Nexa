# Dashboard Pages - Before & After Examples

## Example 1: Metric Card (Dashboard Page)

### ❌ BEFORE
```tsx
<Card className="p-6">
  <div className="flex items-center justify-between mb-2">
    <div className="text-sm text-muted-foreground">Credits</div>
    <Zap className="h-4 w-4 text-yellow-500" />
  </div>
  <div className="text-3xl font-bold">{credits}</div>
  <div className="text-xs text-muted-foreground">Remaining this month</div>
</Card>
```

### ✅ AFTER
```tsx
<div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
  <div className="flex items-center justify-between mb-2">
    <div className="text-sm text-gray-600 dark:text-gray-400">Credits</div>
    <Zap className="h-4 w-4 text-yellow-500" />
  </div>
  <div className="text-3xl font-bold">{credits}</div>
  <div className="text-xs text-gray-600 dark:text-gray-400">Remaining this month</div>
</div>
```

**Changes:**
- `<Card>` → `<div>` with border classes
- `text-muted-foreground` → `text-gray-600 dark:text-gray-400` (×2)

---

## Example 2: Activity Section (Dashboard Page)

### ❌ BEFORE
```tsx
<Card className="p-6">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Activity className="h-5 w-5" /> Recent Activity
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      {logs.map((l) => (
        <div key={l.id} className="flex items-center justify-between border rounded-md p-3">
          <div>
            <div className="text-sm font-medium">{l.message}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(l.timestamp).toLocaleString()}
            </div>
          </div>
          <span className="text-xs bg-accent/40 px-2 py-1 rounded-full">
            {l.type}
          </span>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

### ✅ AFTER
```tsx
<div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
    <Activity className="h-5 w-5" /> Recent Activity
  </h3>
  <div className="space-y-3">
    {logs.map((l) => (
      <div key={l.id} className="flex items-center justify-between border border-gray-200 dark:border-gray-800 rounded-md p-3">
        <div>
          <div className="text-sm font-medium">{l.message}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {new Date(l.timestamp).toLocaleString()}
          </div>
        </div>
        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
          {l.type}
        </span>
      </div>
    ))}
  </div>
</div>
```

**Changes:**
- `<Card>` → `<div>` with border + hover classes
- `<CardHeader>` removed
- `<CardTitle>` → `<h3 className="text-lg font-semibold mb-4">`
- `<CardContent>` → `<div>`
- `text-muted-foreground` → `text-gray-600 dark:text-gray-400` (×2)
- Inner borders updated to match
- `bg-accent/40` → `bg-gray-100 dark:bg-gray-800`

---

## Example 3: Campaign Card (Campaigns Page)

### ❌ BEFORE
```tsx
<Card key={campaign.id} className="p-6 hover:shadow-md transition-shadow">
  <CardHeader className="pb-4">
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        {campaign.name}
      </CardTitle>
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(campaign.status)}>
          {campaign.status}
        </Badge>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    {campaign.description && (
      <p className="text-sm text-muted-foreground mb-4">
        {campaign.description}
      </p>
    )}
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Platforms:</span>
        {campaign.platforms.map((p) => (
          <Badge key={p} variant="secondary">{p}</Badge>
        ))}
      </div>
    </div>
  </CardContent>
</Card>
```

### ✅ AFTER
```tsx
<div key={campaign.id} className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
  <div className="pb-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        {campaign.name}
      </h3>
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(campaign.status)}>
          {campaign.status}
        </Badge>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
  <div>
    {campaign.description && (
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {campaign.description}
      </p>
    )}
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600 dark:text-gray-400">Platforms:</span>
        {campaign.platforms.map((p) => (
          <Badge key={p} variant="secondary">{p}</Badge>
        ))}
      </div>
    </div>
  </div>
</div>
```

**Changes:**
- `<Card>` → `<div>` with border + hover classes
- `hover:shadow-md` → border hover effect
- `<CardHeader>` → `<div>`
- `<CardTitle>` → `<h3 className="text-lg font-semibold">`
- `<CardContent>` → `<div>`
- `text-muted-foreground` → `text-gray-600 dark:text-gray-400` (×2)

---

## Example 4: Agent Card (Agents Page)

### ❌ BEFORE
```tsx
<Card key={agent.id} className={isActive ? '' : 'opacity-75'}>
  <CardHeader>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <IconComponent className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">{agent.name}</CardTitle>
          <CardDescription className="text-xs mt-1">
            {agent.status === 'Active' ? (
              <span className="inline-flex items-center gap-1 text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-600"></span>
                {agent.status}
              </span>
            ) : (
              <span className="text-muted-foreground">{agent.status}</span>
            )}
          </CardDescription>
        </div>
      </div>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    <p className="text-sm text-muted-foreground">{agent.description}</p>
    {/* ... capabilities ... */}
  </CardContent>
</Card>
```

### ✅ AFTER
```tsx
<div key={agent.id} className={`p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors ${isActive ? '' : 'opacity-75'}`}>
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
        <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">{agent.name}</h3>
        <div className="text-xs mt-1">
          {agent.status === 'Active' ? (
            <span className="inline-flex items-center gap-1 text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-600"></span>
              {agent.status}
            </span>
          ) : (
            <span className="text-gray-600 dark:text-gray-400">{agent.status}</span>
          )}
        </div>
      </div>
    </div>
  </div>
  <div className="space-y-4">
    <p className="text-sm text-gray-600 dark:text-gray-400">{agent.description}</p>
    {/* ... capabilities ... */}
  </div>
</div>
```

**Changes:**
- `<Card>` → `<div>` with border + hover classes
- `<CardHeader>` removed, `mb-4` added
- `<CardTitle>` → `<h3 className="text-lg font-semibold">`
- `<CardDescription>` → `<div>`
- `<CardContent>` → `<div>`
- `text-primary` → `text-blue-600 dark:text-blue-400`
- `bg-primary/10` → `bg-blue-100 dark:bg-blue-900/30`
- `text-muted-foreground` → `text-gray-600 dark:text-gray-400` (×2)

---

## Summary of Changes

| Element | Old | New |
|---------|-----|-----|
| Card wrapper | `<Card>` | `<div class="border border-gray-200 dark:border-gray-800 rounded-lg ...">` |
| Title | `<CardTitle>` | `<h3 class="text-lg font-semibold mb-4">` |
| Description | `<CardDescription>` | `<p class="text-sm text-gray-600 dark:text-gray-400">` |
| Content wrapper | `<CardContent>` | `<div>` |
| Muted text | `text-muted-foreground` | `text-gray-600 dark:text-gray-400` |
| Primary color | `text-primary` | `text-blue-600 dark:text-blue-400` |
| Primary background | `bg-primary/10` | `bg-blue-100 dark:bg-blue-900/30` |
| Muted background | `bg-muted` | `bg-gray-100 dark:bg-gray-800` |
| Accent background | `bg-accent` | `bg-gray-100 dark:bg-gray-800` |

---

## Key Principles

1. **Borders > Shadows**: Use border color changes instead of shadows for interactivity
2. **Explicit Colors**: Replace semantic colors with explicit gray scale
3. **Dark Mode**: Always provide dark mode variants for every color
4. **Consistency**: Every card and section should have the same border styling
5. **Hierarchy**: Use font sizes and weights for visual hierarchy, not colors
