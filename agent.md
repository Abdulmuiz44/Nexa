# Autonomous AI Build Agent Specification

## Agent Identity

**Agent Name**: Nexa Build Agent  
**Version**: 1.0.0  
**Purpose**: Self-running AI build agent that automatically detects, fixes, and resolves all build errors in the Nexa codebase until production-ready

---

## 1. Purpose

The Nexa Build Agent is a fully autonomous AI agent designed to ensure continuous build integrity and production readiness. Whenever a new feature or change is made to the project, this agent must:

1. **Automatically run** `pnpm build`
2. **Capture all errors** including:
   - Build errors
   - TypeScript errors
   - Runtime errors
   - Lint errors (ESLint)
   - Type-checking errors
3. **Parse and structure** all errors with:
   - File path
   - Line number
   - Column number
   - Error message
   - Error code (TS/ESLint)
   - Context
4. **Fix errors automatically** by modifying the codebase directly
5. **Rebuild** and validate fixes
6. **Repeat the loop** until zero errors remain
7. **Commit changes** with clean commit message
8. **Prepare for deployment** ensuring Vercel compatibility
9. **Prevent permission/authority issues** on deployment platforms

---

## 2. Agent Execution Loop

### Core Loop Architecture

```
┌─────────────────────────────────────────────┐
│  START: Change Detection / Manual Trigger   │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  STEP 1: Run Build                          │
│  • Execute: pnpm build                      │
│  • Capture stdout and stderr                │
│  • Set timeout: 5 minutes                   │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  STEP 2: Parse Errors                       │
│  • Extract all error messages               │
│  • Categorize by type                       │
│  • Create structured error list             │
│  • Prioritize by severity                   │
└───────────────┬─────────────────────────────┘
                │
                ▼
         ┌──────┴──────┐
         │ Errors? │
         └──┬──────┬───┘
         Yes│      │No
            │      │
            ▼      ▼
      ┌─────────┐ ┌──────────────────────┐
      │Fix Errors│ │STEP 6: Commit Changes│
      └────┬────┘ └──────────┬───────────┘
           │                 │
           ▼                 ▼
      ┌─────────────┐  ┌─────────────────┐
      │STEP 4: Build│  │STEP 7: Prepare  │
      └──────┬──────┘  │for Deployment   │
             │         └─────────────────┘
             │                 │
             └────────┬────────┘
                      ▼
                ┌──────────┐
                │   END    │
                └──────────┘
```

### Detailed Step-by-Step Process

#### STEP 1: Run Build

**Command**: `pnpm build`

**Process**:
```bash
# Set environment
export NODE_ENV=production
export CI=true

# Execute build
pnpm build 2>&1 | tee build_output.txt

# Capture exit code
BUILD_EXIT_CODE=$?
```

**Capture Requirements**:
- Full stdout output
- Full stderr output
- Exit code
- Build duration
- Warning messages (non-blocking)

---

#### STEP 2: Parse Errors

**Error Detection Patterns**:

1. **TypeScript Errors**:
   ```regex
   Pattern: ^(.+?)\((\d+),(\d+)\): error TS(\d+): (.+)$
   Example: src/app/page.tsx(15,10): error TS2304: Cannot find name 'foo'.
   ```

2. **ESLint Errors**:
   ```regex
   Pattern: ^\s*(.+?):(\d+):(\d+): (.+?) \[(.+?)\]$
   Example:   app/layout.tsx:45:12: 'useState' is not defined  [no-undef]
   ```

3. **Next.js Build Errors**:
   ```regex
   Pattern: (Error|Failed to compile).*\n.*at (.+?) \((.+?):(\d+):(\d+)\)
   ```

4. **Import Errors**:
   ```regex
   Pattern: Module not found: Can't resolve '(.+?)' in '(.+?)'
   ```

**Structured Error Format**:
```typescript
interface BuildError {
  id: string;              // UUID for tracking
  file: string;            // Absolute file path
  line: number;            // Line number
  column: number;          // Column number
  message: string;         // Error message
  code: string;            // Error code (e.g., TS2304)
  severity: 'error' | 'warning';
  category: ErrorCategory;
  context: string;         // 3 lines before and after
  stackTrace?: string;
}

enum ErrorCategory {
  TYPESCRIPT = 'typescript',
  ESLINT = 'eslint',
  NEXTJS = 'nextjs',
  IMPORT = 'import',
  SYNTAX = 'syntax',
  RUNTIME = 'runtime',
  ENV = 'environment',
  DEPENDENCY = 'dependency'
}
```

**Prioritization Rules**:
1. **Critical** (blocking deployment):
   - TypeScript errors (TS*)
   - Syntax errors
   - Missing imports
   - Undefined variables/functions
2. **High** (should fix):
   - ESLint errors
   - Unused variables
   - Type mismatches
3. **Medium**:
   - Deprecation warnings
   - Code style issues
4. **Low**:
   - Informational messages

---

#### STEP 3: Fix Errors

**Auto-Fixing Strategy**:

##### 3.1 TypeScript Errors

**TS2304: Cannot find name**
```typescript
// Before
const result = undefinedVar;

// Fix: Add proper import or define
import { undefinedVar } from './module';
// OR
const undefinedVar = '';
```

**TS2322: Type mismatch**
```typescript
// Before
const count: number = "123";

// Fix: Correct type or cast
const count: number = 123;
// OR
const count: string = "123";
```

**TS2307: Cannot find module**
```typescript
// Before
import { Component } from './missing';

// Fix: Create module or fix path
// Check if file exists with different extension
// Check relative path accuracy
import { Component } from './Component';
```

**TS2345: Argument type mismatch**
```typescript
// Before
function greet(name: string) { }
greet(123);

// Fix: Convert or fix type
greet(String(123));
// OR fix function signature
```

**TS2305: Module has no exported member**
```typescript
// Before
import { MissingExport } from './module';

// Fix: Check and fix import
import { CorrectExport } from './module';
// OR add export to target module
export { MissingExport };
```

**TS7006: Parameter implicitly has 'any' type**
```typescript
// Before
function process(item) { }

// Fix: Add explicit type
function process(item: any) { }
// OR infer better type
function process(item: string) { }
```

##### 3.2 ESLint Errors

**no-unused-vars**
```typescript
// Before
import { unused, used } from './module';

// Fix: Remove unused imports
import { used } from './module';
```

**no-undef**
```typescript
// Before
console.log(undefinedVariable);

// Fix: Define or import
const undefinedVariable = '';
// OR
import { undefinedVariable } from './config';
```

**react-hooks/exhaustive-deps**
```typescript
// Before
useEffect(() => {
  doSomething(value);
}, []);

// Fix: Add dependencies
useEffect(() => {
  doSomething(value);
}, [value]);
```

**@next/next/no-img-element**
```typescript
// Before
<img src="/logo.png" alt="Logo" />

// Fix: Use Next.js Image component
import Image from 'next/image';
<Image src="/logo.png" alt="Logo" width={100} height={100} />
```

##### 3.3 Next.js Specific Errors

**Server/Client Component Conflicts**
```typescript
// Before (Server component using useState)
export default function Page() {
  const [state, setState] = useState('');
}

// Fix: Add 'use client' directive
'use client';
export default function Page() {
  const [state, setState] = useState('');
}
```

**Missing Metadata in App Router**
```typescript
// Before
export default function Page() { }

// Fix: Add metadata export
export const metadata = {
  title: 'Page Title',
  description: 'Page description'
};
export default function Page() { }
```

**Dynamic Routes Not Found**
```typescript
// Before: Missing generateStaticParams
export default function Page({ params }) { }

// Fix: Add static params generation
export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }];
}
export default function Page({ params }) { }
```

##### 3.4 Import Errors

**Module Resolution Issues**
```typescript
// Check and fix:
// 1. File extension (.ts, .tsx, .js)
// 2. Index file (./module/index.ts)
// 3. Path alias (@/* mapping)
// 4. Case sensitivity
// 5. node_modules existence

// Before
import { Component } from '@/Component';

// Fix: Verify path alias
import { Component } from '@/components/Component';
```

##### 3.5 Environment Variable Errors

**Missing Environment Variables**
```typescript
// Before
const apiUrl = process.env.API_URL;

// Fix: Add to .env.local and next.config.mjs
// .env.local
API_URL=https://api.example.com

// next.config.mjs
env: {
  API_URL: process.env.API_URL,
}
```

##### 3.6 Dependency Errors

**Version Conflicts**
```bash
# Check pnpm-lock.yaml for conflicts
# Update conflicting packages
pnpm update <package-name>
```

**Missing Dependencies**
```bash
# Auto-detect and install
pnpm add <missing-package>
```

---

#### STEP 4: Rebuild

**Post-Fix Build**:
```bash
# Clean previous build
rm -rf .next

# Rebuild
pnpm build 2>&1 | tee build_output_after_fix.txt

# Type check
pnpm type-check

# Lint check (optional, warnings allowed)
pnpm lint
```

**Validation**:
- Exit code must be 0
- No error messages in output
- All pages must compile
- No missing exports

---

#### STEP 5: Continue Until Clean

**Loop Conditions**:
```typescript
while (buildErrors.length > 0 && iterations < MAX_ITERATIONS) {
  // Parse errors
  const errors = parseErrors(buildOutput);
  
  // Fix errors
  for (const error of errors) {
    await fixError(error);
  }
  
  // Rebuild
  const newBuildOutput = await runBuild();
  
  // Check for new errors
  buildErrors = parseErrors(newBuildOutput);
  iterations++;
}

// MAX_ITERATIONS = 10 (safety limit)
```

**Success Criteria**:
- Zero TypeScript errors
- Zero blocking ESLint errors
- Clean build exit code (0)
- All routes compile successfully
- No missing dependencies

**Failure Handling**:
- If MAX_ITERATIONS reached → Report remaining errors
- If same error persists → Mark as unfixable, document
- If build time exceeds 10 minutes → Abort, report

---

#### STEP 6: Commit Results

**Commit Strategy**:

```bash
# Stage all changes
git add .

# Create detailed commit message
git commit -m "fix: auto-resolved build errors

- Fixed ${TS_ERROR_COUNT} TypeScript errors
- Resolved ${ESLINT_ERROR_COUNT} ESLint issues
- Updated ${IMPORT_ERROR_COUNT} import statements
- Added missing type definitions
- Ensured Next.js 15 compatibility

Build Status: ✅ CLEAN
Type Check: ✅ PASSED
Lint: ✅ PASSED

Resolved Issues:
${ERROR_SUMMARY}

Agent: Nexa Build Agent v1.0.0
Timestamp: ${TIMESTAMP}
"
```

**Commit Rules**:
- Only commit if build is clean
- Include detailed error summary
- Use conventional commit format
- Reference issue numbers if applicable
- Do not commit node_modules, .next, or .env files

---

#### STEP 7: Prepare for Vercel Deployment

**Pre-Deployment Checklist**:

##### 7.1 Environment Variables
```bash
# Verify all required env vars exist
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ DATABASE_URL
✓ NEXTAUTH_SECRET
✓ NEXTAUTH_URL

# Ensure .env.example is up to date
# Ensure vercel.json has correct environment config
```

##### 7.2 Build Configuration
```javascript
// next.config.mjs validation
✓ No development-only configs in production
✓ Image optimization configured
✓ Environment variables exposed correctly
✓ No ignoreBuildErrors: true (unless intentional)
✓ Proper output configuration for Vercel
```

##### 7.3 TypeScript Configuration
```json
// tsconfig.json validation
✓ "strict": true
✓ "noEmit": true
✓ All paths resolved correctly
✓ No @ts-ignore comments (or justified)
```

##### 7.4 Route Validation
```bash
# Verify all routes compile
✓ app/* pages exist
✓ app/api/* routes exist
✓ No dynamic imports without fallback
✓ Metadata exports present
```

##### 7.5 Dependency Audit
```bash
# Security check
pnpm audit --production

# Fix vulnerabilities
pnpm audit fix

# Verify no deprecated packages
```

##### 7.6 Performance Checks
```bash
✓ Bundle size within limits
✓ No circular dependencies
✓ Tree-shaking enabled
✓ Code splitting optimized
```

##### 7.7 Vercel-Specific Issues

**Authority Limits / Permission Errors**:
```bash
# Common causes and fixes:

# 1. File system access
# Fix: Use serverless-friendly alternatives
# Avoid: fs.writeFileSync in API routes
# Use: Database or external storage

# 2. Build timeout
# Fix: Optimize build process
# Current limit: 15 minutes (free tier)
# Split large builds into multiple steps

# 3. Memory limits
# Fix: Optimize bundle size
# Current limit: 1024 MB (hobby), 3008 MB (pro)
# Use dynamic imports for large dependencies

# 4. Function size limits
# Fix: Code splitting
# Current limit: 50 MB (compressed)

# 5. Missing build command
# Fix: Ensure package.json has "build" script
"scripts": {
  "build": "next build"
}

# 6. Node version mismatch
# Fix: Specify in package.json
"engines": {
  "node": ">=18.0.0"
}
```

**Vercel Environment Configuration**:
```json
// vercel.json (create if missing)
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 3. Error Categories the Agent Must Handle

### 3.1 TypeScript Errors

| Code | Description | Fix Strategy |
|------|-------------|--------------|
| TS2304 | Cannot find name | Import or define variable |
| TS2307 | Cannot find module | Fix import path or install dependency |
| TS2322 | Type not assignable | Fix type or add type assertion |
| TS2345 | Argument type mismatch | Convert type or fix signature |
| TS2339 | Property does not exist | Add property or fix access |
| TS2341 | Private property access | Change visibility or use public API |
| TS2554 | Expected N arguments | Add missing arguments or fix signature |
| TS2556 | Expected 0 arguments | Remove extra arguments |
| TS2571 | Object is of type 'unknown' | Add type guard or assertion |
| TS7006 | Parameter implicitly 'any' | Add explicit type annotation |
| TS7016 | Could not find declaration | Install @types package or declare module |
| TS7031 | Binding element implicitly 'any' | Add type to destructured parameter |

### 3.2 Next.js Build Errors

- **Build Failed to Compile**: Check for syntax errors, missing semicolons
- **Invalid Page Configuration**: Verify export types and naming
- **Server/Client Component Mismatch**: Add proper directives
- **Missing Layout Files**: Create required layout.tsx files
- **Improper Metadata Export**: Add or fix metadata objects
- **Dynamic Route Errors**: Fix params, add generateStaticParams
- **API Route Errors**: Verify request/response types
- **Image Optimization Errors**: Use proper Image component props
- **Font Loading Errors**: Check next/font imports
- **Middleware Errors**: Validate middleware.ts configuration

### 3.3 Missing Imports / Wrong Imports

- **Module Not Found**: Install package or fix path
- **Named Import Not Found**: Check export name, use default import
- **Default Export Missing**: Change to named import or add default export
- **Circular Dependencies**: Refactor imports to break cycle
- **Case Sensitivity**: Fix import path casing
- **Extension Issues**: Add or remove file extension
- **Alias Resolution**: Verify tsconfig paths match import
- **Index File Ambiguity**: Specify exact file or use index

### 3.4 Strict Mode Violations

- **Implicit Any**: Add explicit type annotations
- **Null/Undefined Issues**: Add null checks or optional chaining
- **Unused Variables**: Remove or prefix with underscore
- **No Implicit Returns**: Add explicit return statement
- **Strict Null Checks**: Add null/undefined handling
- **No Implicit This**: Bind context or use arrow functions

### 3.5 Unused Variables / Unreachable Code

- **Unused Imports**: Remove from import statement
- **Unused Variables**: Remove declaration or add usage
- **Unreachable Code**: Remove or fix control flow
- **Dead Code Elimination**: Remove unused functions/components

### 3.6 ESLint Problems

- **no-unused-vars**: Remove unused variables
- **no-undef**: Define or import undefined variables
- **no-console**: Remove console.log or add eslint-disable
- **react-hooks/rules-of-hooks**: Move hooks to component level
- **react-hooks/exhaustive-deps**: Add missing dependencies
- **@next/next/no-img-element**: Replace with next/image
- **prefer-const**: Change let to const for non-reassigned variables
- **no-explicit-any**: Replace 'any' with proper type

### 3.7 API Route Errors

- **Invalid Request Handler**: Fix function signature
- **Missing Response**: Add res.json() or res.status()
- **Incorrect HTTP Method**: Verify request.method check
- **CORS Issues**: Add proper headers or middleware
- **JSON Parsing Errors**: Add try-catch and validation
- **Route Parameter Mismatch**: Fix dynamic segment naming

### 3.8 React Server/Client Component Conflicts

- **useState in Server Component**: Add 'use client' directive
- **useEffect in Server Component**: Add 'use client' directive
- **Event Handlers in Server Component**: Add 'use client' directive
- **Browser APIs in Server Component**: Move to client component
- **Async Server Components**: Ensure proper async/await usage
- **Props Serialization**: Ensure props are JSON-serializable

### 3.9 Missing Environment Variables

- **Undefined process.env**: Add to .env.local
- **Next.js Env Exposure**: Add to next.config.mjs
- **Build-time vs Runtime**: Use NEXT_PUBLIC_ prefix correctly
- **Missing .env.example**: Create template file
- **Vercel Env Setup**: Document required variables

### 3.10 Mismatched Dependency Versions

- **Peer Dependency Warnings**: Update to compatible versions
- **Breaking Changes**: Update code to new API
- **React Version Mismatch**: Align react and react-dom versions
- **Next.js Compatibility**: Check Next.js version requirements
- **TypeScript Version Issues**: Update TS or fix code

### 3.11 Duplicate Default Exports

- **Multiple export default**: Keep one, convert others to named
- **Conflicting Exports**: Rename or consolidate

### 3.12 Undefined Functions or Props

- **Function Not Defined**: Import or implement function
- **Props Not Passed**: Add props or make optional
- **Component Props Mismatch**: Fix prop types or values

### 3.13 Zod Validation Issues

- **Invalid Schema**: Fix Zod schema definition
- **Validation Errors**: Adjust schema or input data
- **Type Inference**: Ensure z.infer<> used correctly

### 3.14 Other Compile-Time Errors

- **Syntax Errors**: Fix JavaScript/TypeScript syntax
- **JSON Parsing**: Fix malformed JSON files
- **Configuration Errors**: Fix config files (tsconfig, next.config)
- **Build Tool Errors**: Fix webpack/turbopack configuration

---

## 4. Auto-Fixing Rules

### 4.1 Core Principles

1. **Safety First**: Never break working functionality
2. **Minimal Changes**: Make the smallest possible fix
3. **Preserve Logic**: Keep original business logic intact
4. **Type Safety**: Prefer type-safe solutions
5. **No Shortcuts**: Don't comment out code to bypass errors
6. **Documentation**: Add comments for complex fixes
7. **Reversibility**: Changes should be easy to review and revert
8. **Testing**: Verify fix doesn't introduce new errors

### 4.2 Fixing Priority

**Order of Operations**:
1. Fix syntax errors (blocking all else)
2. Fix missing imports (required for type checking)
3. Fix type errors (required for compilation)
4. Fix ESLint errors (code quality)
5. Remove dead code (optimization)
6. Fix warnings (nice to have)

### 4.3 Safe Fixing Strategies

**DO**:
- ✅ Add missing type annotations
- ✅ Import missing dependencies
- ✅ Fix typos in variable names
- ✅ Add null checks and type guards
- ✅ Convert deprecated APIs to current ones
- ✅ Remove unused variables and imports
- ✅ Add 'use client' directives where needed
- ✅ Fix incorrect prop types
- ✅ Add missing function parameters
- ✅ Replace 'any' with proper types
- ✅ Fix file path case sensitivity
- ✅ Add missing return statements
- ✅ Fix async/await usage

**DON'T**:
- ❌ Comment out entire functions to fix errors
- ❌ Use @ts-ignore without justification
- ❌ Remove error handling code
- ❌ Change API contracts without checking usage
- ❌ Delete files to fix import errors
- ❌ Use 'any' as a quick fix
- ❌ Remove type checking entirely
- ❌ Ignore security vulnerabilities
- ❌ Break existing tests
- ❌ Remove functionality to "fix" errors

### 4.4 Type Fixing Rules

**When to Use Type Assertion**:
```typescript
// Safe: Known type from external library
const element = document.getElementById('app') as HTMLDivElement;

// Unsafe: Bypassing type check
const data = unknownData as MyType; // Avoid unless verified
```

**When to Use Type Guards**:
```typescript
// Prefer type guards over assertions
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

if (isString(data)) {
  // TypeScript knows data is string here
  console.log(data.toUpperCase());
}
```

**When to Widen Types**:
```typescript
// Widen when strict type is too restrictive
// Before: type Status = 'active';
// After: type Status = 'active' | 'inactive' | 'pending';
```

### 4.5 Code Transformation Rules

**Deprecated API Migrations**:
```typescript
// React 18: Children type
// Before
type Props = {
  children: React.ReactNode;
};

// Next.js 15: Metadata
// Before: Head component
// After: metadata export
export const metadata = {
  title: 'Title',
};

// Next.js 15: Image component
// Before: layout prop
// After: explicit width/height or fill
<Image src="..." fill alt="..." />
```

### 4.6 Dead Code Removal

**Safe to Remove**:
- Unused imports
- Unreferenced variables
- Commented-out code (after verification)
- Duplicate functions
- Unreachable code blocks

**Requires Review**:
- Exported but unused (might be used externally)
- Functions called only in comments
- Development/debug code

---

## 5. Production-Ready Rules

### 5.1 TypeScript Strict Mode Requirements

```typescript
// tsconfig.json must have:
{
  "compilerOptions": {
    "strict": true,                 // All strict checks enabled
    "noImplicitAny": true,          // No implicit any types
    "strictNullChecks": true,       // Proper null handling
    "strictFunctionTypes": true,    // Strict function types
    "strictBindCallApply": true,    // Strict bind/call/apply
    "strictPropertyInitialization": true,
    "noImplicitThis": true,         // No implicit this
    "alwaysStrict": true,           // Use strict mode
    "noUnusedLocals": true,         // No unused variables
    "noUnusedParameters": true,     // No unused params
    "noImplicitReturns": true,      // Explicit returns
    "noFallthroughCasesInSwitch": true
  }
}
```

**Validation**:
- All files pass `pnpm type-check`
- No `@ts-ignore` or `@ts-expect-error` (or documented)
- No `any` types (or explicitly justified)
- All functions have return types
- All parameters have types

### 5.2 Vercel Build Requirements

**Must Pass**:
```bash
✓ Build completes in < 15 minutes
✓ Zero TypeScript errors
✓ Zero build errors
✓ All pages render
✓ All API routes functional
✓ All dynamic routes have data
✓ No missing environment variables
✓ No forbidden file system access
✓ Bundle size within limits
✓ Memory usage within limits
```

**Vercel Deployment Checklist**:
- [ ] Build command defined: `"build": "next build"`
- [ ] All env vars documented in .env.example
- [ ] No hardcoded secrets in code
- [ ] Node version specified in package.json
- [ ] Dependencies locked (pnpm-lock.yaml committed)
- [ ] No dev dependencies in runtime code
- [ ] API routes use serverless patterns
- [ ] No file system writes in serverless functions
- [ ] Images optimized (next/image used)
- [ ] Static assets in public/ directory

### 5.3 Route Compilation

**Every Route Must**:
- Export proper page/layout components
- Have valid metadata
- Compile without errors
- Not use server-only code in client components
- Not use client-only code in server components
- Handle all dynamic parameters
- Return valid JSX/Response

**API Routes Must**:
- Export named functions (GET, POST, etc.)
- Return Response objects
- Handle errors with try-catch
- Validate input data
- Set proper status codes
- Use proper Content-Type headers

### 5.4 Export Validation

**Required Exports**:
- Pages: default export (component)
- Layouts: default export (component)
- API routes: named exports (GET, POST, etc.)
- Metadata: metadata constant or generateMetadata function
- Dynamic routes: generateStaticParams (if static)

**No Missing Exports**:
```bash
# Validate all exports exist
pnpm build --dry-run

# Check for missing exports
grep -r "export" app/ components/
```

### 5.5 Critical Flow Testing

**After Fixing, Validate**:
1. **Homepage loads**: Visit /
2. **Authentication works**: Login/logout
3. **API routes respond**: Test key endpoints
4. **Dynamic routes work**: Navigate to dynamic pages
5. **Forms submit**: Test form functionality
6. **Data fetches**: Verify data loading
7. **Error pages work**: Test 404, 500
8. **Redirects function**: Test navigation

**Automated Checks**:
```bash
# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Type check
pnpm type-check

# Lint
pnpm lint
```

### 5.6 Import Optimization

**Tree-Shaking**:
```typescript
// Before: Import entire library
import _ from 'lodash';

// After: Import specific functions
import { map, filter } from 'lodash';

// Better: Use native methods when possible
array.map(x => x * 2);
```

**Code Splitting**:
```typescript
// Dynamic imports for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false
});
```

**Bundle Analysis**:
```bash
# Analyze bundle size
pnpm build --analyze

# Check for large dependencies
npx webpack-bundle-analyzer .next/analyze/client.json
```

---

## 6. Final Pre-Commit Checklist

### 6.1 Build Validation

```bash
# Clean build
✓ rm -rf .next && pnpm build

# Build exit code
✓ Exit code: 0

# Build output
✓ No errors in output
✓ No "Failed to compile" messages
✓ All pages compiled successfully
✓ All API routes compiled successfully

# Build artifacts
✓ .next/ directory created
✓ .next/standalone/ exists (if using output: 'standalone')
✓ .next/static/ contains assets
```

### 6.2 Type Safety

```bash
# Type check
✓ pnpm type-check
✓ Exit code: 0
✓ Zero TypeScript errors

# Strict mode compliance
✓ tsconfig.json has "strict": true
✓ No @ts-ignore without justification
✓ No any types without justification
```

### 6.3 Code Quality

```bash
# Linting
✓ pnpm lint
✓ Zero critical ESLint errors
✓ Warnings documented if present

# Code formatting
✓ pnpm format:check
✓ All files formatted consistently
```

### 6.4 Testing

```bash
# Unit tests
✓ pnpm test
✓ All tests pass
✓ No skipped tests (or documented)

# E2E tests (if applicable)
✓ pnpm test:e2e
✓ Critical paths tested
```

### 6.5 Dependencies

```bash
# Security audit
✓ pnpm audit --production
✓ Zero critical vulnerabilities
✓ High vulnerabilities addressed or documented

# Dependency validation
✓ All dependencies installed
✓ No missing peer dependencies
✓ pnpm-lock.yaml up to date
```

### 6.6 Environment

```bash
# Environment variables
✓ All required vars in .env.example
✓ No secrets in code
✓ Vercel env vars documented
✓ Build-time vs runtime vars correct (NEXT_PUBLIC_)

# Configuration files
✓ next.config.mjs valid
✓ tsconfig.json valid
✓ package.json scripts defined
✓ No development configs in production
```

### 6.7 Vercel Readiness

```bash
# Deployment checks
✓ Build command: "pnpm build"
✓ Start command: "pnpm start"
✓ Node version specified
✓ Output directory: .next
✓ No file system writes in serverless functions
✓ No missing environment variables
✓ API routes use serverless patterns
✓ No authority/permission issues

# Performance
✓ Bundle size < 1 MB (per route)
✓ Build time < 10 minutes
✓ Memory usage reasonable
✓ No circular dependencies

# Route validation
✓ All pages accessible
✓ All API routes respond
✓ Dynamic routes render
✓ Error pages work (404, 500)
```

### 6.8 Code Review

```bash
# Changed files review
✓ git diff --stat
✓ Only necessary files modified
✓ No unintended changes
✓ No debug code left behind

# Git status
✓ git status
✓ No untracked files (or intentional)
✓ No uncommitted changes after commit
```

---

## 7. Agent Result Guarantee

### 7.1 Build Status Confirmation

Upon completion, the agent guarantees:

```
✅ BUILD SUCCESSFUL
   - Zero TypeScript errors
   - Zero blocking build errors
   - Zero critical ESLint errors
   - All pages compile successfully
   - All API routes functional
   - All tests passing

✅ TYPE SAFETY VERIFIED
   - Strict mode enabled
   - All types defined
   - No implicit any
   - No unsafe type assertions

✅ CODE QUALITY ASSURED
   - ESLint rules satisfied
   - Code formatted consistently
   - No dead code
   - Imports optimized

✅ PRODUCTION READY
   - Vercel deployment compatible
   - No authority/permission issues
   - Environment variables documented
   - Security vulnerabilities addressed
   - Performance optimized

✅ VERSION CONTROL READY
   - Changes committed with descriptive message
   - No unintended files committed
   - Git history clean
```

### 7.2 Deployment Success Guarantee

**The agent certifies that**:

1. ✅ **Vercel Build Will Succeed**
   - Build command executes successfully
   - No build-time errors
   - All dependencies resolve
   - Environment variables available
   - Build completes within time limits

2. ✅ **No Authority/Permission Errors**
   - No file system access violations
   - No unauthorized API calls
   - No missing credentials
   - Serverless constraints respected
   - Memory limits observed

3. ✅ **Runtime Stability**
   - All routes accessible
   - No runtime errors in SSR
   - API routes respond correctly
   - Database connections functional
   - External APIs reachable

4. ✅ **Production Performance**
   - Bundle size optimized
   - Code splitting effective
   - Images optimized
   - Fonts loaded efficiently
   - No performance bottlenecks

### 7.3 Error Recovery Plan

**If Issues Arise Post-Deployment**:

1. **Automatic Rollback Trigger**
   - Monitor deployment status
   - Check error rates
   - Verify core functionality
   - Rollback if critical errors detected

2. **Issue Investigation**
   - Collect deployment logs
   - Analyze error messages
   - Identify root cause
   - Document findings

3. **Rapid Fix Cycle**
   - Apply targeted fix
   - Test locally
   - Re-run agent
   - Redeploy

4. **Prevention**
   - Add test case for issue
   - Update agent logic
   - Document in runbook

---

## 8. Agent Execution Command

To run this agent manually or trigger automatically:

```bash
# Manual execution
./agent-runner.sh

# Triggered by git hook (on commit/push)
# .husky/pre-commit
# .husky/pre-push

# CI/CD integration
# .github/workflows/build-agent.yml
```

**Expected Output**:
```
🤖 Nexa Build Agent v1.0.0 Starting...

📦 Step 1: Running build...
   ⏱  Build completed in 45s

🔍 Step 2: Parsing errors...
   ❌ Found 8 errors
   📄 4 TypeScript errors
   📄 3 ESLint errors
   📄 1 Import error

🔧 Step 3: Fixing errors...
   ✅ Fixed TS2304 in app/page.tsx
   ✅ Fixed TS2307 in lib/utils.ts
   ✅ Fixed no-unused-vars in components/Button.tsx
   ✅ Fixed import in api/route.ts
   ... (all fixes listed)

🔨 Step 4: Rebuilding...
   ⏱  Build completed in 42s
   ✅ Zero errors!

✅ Step 5: Build clean!

💾 Step 6: Committing changes...
   ✅ Committed: "fix: auto-resolved 8 build errors"

🚀 Step 7: Vercel deployment ready
   ✅ All pre-deployment checks passed

🎉 Agent completed successfully!
   Build: CLEAN ✅
   Type Check: PASSED ✅
   Lint: PASSED ✅
   Tests: PASSED ✅
   Deployment: READY ✅
```

---

## 9. Continuous Improvement

The agent learns and improves through:

1. **Error Pattern Recognition**: Track common errors and their fixes
2. **Fix Success Rate**: Monitor which fixes work consistently
3. **Build Time Optimization**: Improve efficiency over time
4. **False Positive Reduction**: Refine error detection
5. **Auto-Fix Library**: Expand fix strategies

**Feedback Loop**:
```
Error Detected → Fix Applied → Outcome Recorded → Pattern Learned → Strategy Updated
```

---

## 10. Summary

The Nexa Build Agent is a comprehensive, autonomous system that ensures:

- **Zero-error builds** through continuous detection and fixing
- **Production readiness** via strict validation and testing
- **Vercel compatibility** with proper configuration and permissions
- **Type safety** through TypeScript strict mode
- **Code quality** via ESLint and formatting standards
- **Deployment success** with pre-flight checks and validation

**Agent Philosophy**: *"Every commit is production-ready. Every build is deployable. Every deployment succeeds."*

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-16  
**Status**: Active  
**Maintainer**: Nexa Development Team
