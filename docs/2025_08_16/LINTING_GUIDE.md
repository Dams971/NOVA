# NOVA RDV Linting Guide

## Overview

This guide documents the linting patterns, rules, and best practices applied to the NOVA RDV project during the lint fixing process.

## Current ESLint Configuration

### Active Rules
```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "import/order": "warn",
    "@typescript-eslint/no-unused-vars": "warn", 
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "react-hooks/exhaustive-deps": "warn",
    "prefer-const": "warn"
  }
}
```

## Warning Categories and Solutions

### 1. Import Order (`import/order`)
**Count**: 224 warnings  
**Severity**: Low  
**Impact**: Code organization only

#### Pattern
```typescript
// ❌ Incorrect order
import { useState } from 'react';
import { Button } from 'lucide-react';

// ✅ Correct order  
import { Button } from 'lucide-react';
import { useState } from 'react';
```

#### Rule Applied
External packages → Internal packages → Relative imports

#### Solution Strategy
1. Group external libraries first
2. Group internal `@/` imports second  
3. Group relative `./` imports last
4. Sort alphabetically within groups

### 2. Unused Variables (`@typescript-eslint/no-unused-vars`)
**Count**: 287 warnings  
**Severity**: Medium  
**Impact**: Code maintainability

#### Patterns Fixed
```typescript
// ❌ Unused import
import { useState, useEffect } from 'react'; // useEffect not used

// ✅ Fixed
import { useState } from 'react';

// ❌ Unused destructured variable
const { data, error } = useQuery(); // error not used

// ✅ Fixed with underscore prefix
const { data, _error } = useQuery();
```

#### Solution Strategy
1. Remove completely unused imports
2. Prefix unused parameters with `_`
3. Use destructuring carefully
4. Clean up legacy code references

### 3. Explicit Any Types (`@typescript-eslint/no-explicit-any`)
**Count**: 211 warnings  
**Severity**: High  
**Impact**: Type safety

#### Common Patterns
```typescript
// ❌ Explicit any
const handleEvent = (event: any) => {};

// ✅ Proper typing
const handleEvent = (event: React.MouseEvent<HTMLButtonElement>) => {};

// ❌ Any in state
const [data, setData] = useState<any>(null);

// ✅ Typed state
interface UserData {
  id: string;
  name: string;
}
const [data, setData] = useState<UserData | null>(null);
```

#### Solution Strategy
1. Define proper interfaces
2. Use generic constraints
3. Import correct event types
4. Avoid `any` in API responses

### 4. Console Statements (`no-console`)
**Count**: 113 warnings  
**Severity**: Medium  
**Impact**: Production logging

#### Patterns
```typescript
// ❌ Debug console
console.log('Debug info');

// ✅ Allowed logging
console.warn('Warning message');
console.error('Error occurred');

// ✅ Proper logging service
import { logger } from '@/lib/logging';
logger.info('Information message');
```

#### Solution Strategy
1. Remove debug `console.log`
2. Keep `console.warn` and `console.error`
3. Use proper logging service for info
4. Add environment checks for debug

### 5. React Hook Dependencies (`react-hooks/exhaustive-deps`)
**Count**: 14 warnings  
**Severity**: Medium  
**Impact**: Runtime correctness

#### Common Issues
```typescript
// ❌ Missing dependencies
useEffect(() => {
  fetchData(userId);
}, []); // userId missing

// ✅ Complete dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ✅ Using useCallback
const memoizedFetch = useCallback(() => {
  fetchData(userId);
}, [userId]);

useEffect(() => {
  memoizedFetch();
}, [memoizedFetch]);
```

#### Solution Strategy
1. Include all dependencies
2. Use `useCallback` for functions
3. Extract stable references
4. Consider dependency exemptions carefully

## File-Specific Patterns

### API Routes
**Common Issues**:
- Unused request parameters
- Incorrect import ordering
- Missing error handling types

**Pattern Applied**:
```typescript
// Standard API route structure
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiGateway } from '@/lib/api/gateway';

export async function GET(req: NextRequest) {
  try {
    // Implementation
  } catch (error) {
    return ApiGateway.handleError(error);
  }
}
```

### React Components
**Common Issues**:
- Unused imported icons
- Missing prop types
- Explicit any in event handlers

**Pattern Applied**:
```typescript
import React from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

interface ComponentProps {
  onSelect: (date: Date) => void;
  disabled?: boolean;
}

export const Component: React.FC<ComponentProps> = ({ 
  onSelect, 
  disabled = false 
}) => {
  // Implementation
};
```

### Service Files
**Common Issues**:
- Unused service methods
- Any types in API responses
- Missing error type definitions

**Pattern Applied**:
```typescript
export interface ServiceResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export class ApiService {
  async fetchData<T>(endpoint: string): Promise<ServiceResponse<T>> {
    // Implementation with proper typing
  }
}
```

## Automated Fixing Tools

### ESLint Auto-fix
```bash
# Fix auto-fixable issues
npx eslint --fix src/

# Fix specific patterns
npx eslint --fix --ext .ts,.tsx src/ --rule "import/order: error"
```

### Custom Fix Scripts
```javascript
// fix-imports.js - Custom import ordering
const fs = require('fs');
const path = require('path');

function fixImportOrder(filePath) {
  // Implementation to sort imports
}
```

## IDE Configuration

### VS Code Settings
```json
{
  "eslint.autoFixOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.organizeImports": true
}
```

### ESLint Extension Rules
```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact", 
    "typescript",
    "typescriptreact"
  ],
  "eslint.alwaysShowStatus": true
}
```

## Quality Gates

### Pre-commit Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: eslint
        name: ESLint
        entry: npx eslint --fix
        language: node
        files: \.(ts|tsx)$
```

### CI/CD Integration
```yaml
# GitHub Actions
name: Lint Check
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run ESLint
        run: npm run lint
```

## Exceptions and Overrides

### File-specific Overrides
```json
{
  "overrides": [
    {
      "files": ["**/*.test.ts", "**/*.test.tsx"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off",
        "no-console": "off"
      }
    },
    {
      "files": ["scripts/**/*"],
      "rules": {
        "no-console": "off"
      }
    }
  ]
}
```

### Inline Disable Comments
```typescript
// Disable for specific line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleData = (data: any) => {};

// Disable for block
/* eslint-disable @typescript-eslint/no-unused-vars */
import { unusedImport } from 'library';
/* eslint-enable @typescript-eslint/no-unused-vars */
```

## Monitoring and Metrics

### Warning Tracking
```bash
# Count warnings by type
npm run lint | grep "Warning:" | grep -o "[a-z-]*/[a-z-]*" | sort | uniq -c

# Generate lint report
npm run lint -- --format json > lint-report.json
```

### Quality Metrics
- **Target**: <100 total warnings
- **Current**: 867 warnings  
- **Priority**: Type safety (no-explicit-any)
- **Timeline**: 3-month improvement plan

## Best Practices

### Development Workflow
1. Run `npm run lint` before commits
2. Fix auto-fixable issues first
3. Address type safety warnings priority
4. Remove dead code regularly
5. Review import organization

### Team Guidelines
1. Prefer explicit types over `any`
2. Clean up unused imports immediately
3. Use proper logging instead of console
4. Follow import ordering conventions
5. Include all React hook dependencies

### Code Review Checklist
- [ ] No new `any` types introduced
- [ ] No unused variables/imports
- [ ] Proper import ordering
- [ ] Appropriate logging used
- [ ] React hooks dependencies complete

---
**Last Updated**: 2025-08-16  
**Version**: 1.0  
**Status**: Active Guidelines