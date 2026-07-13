# Deep Review & Optimize: Scholars-System (智策云端前端)

## GOAL
You are reviewing a production React + Vite frontend application that serves as a scholar database system.
Your goal is to deeply review and optimize the following areas, producing a prioritized action plan AND implementing safe improvements.

## REVIEW SCOPE

### 1. Data Service Architecture
- Review `src/services/scholarApi/` — the recently split API module structure
- Check if the barrel re-export pattern (`index.ts`) is leaking internal implementation
- Review type definitions in `types.ts` — are they complete? Any `any` types?
- Check if request utilities (cache, timeout, dedup) are properly applied across all API calls
- Look for API calls outside the scholarApi module (scattered fetch/axios calls)

### 2. Frontend Data Fetching & Rendering
- Review `src/hooks/` — are hooks properly memoized? Any unnecessary re-renders?
- Check pagination logic — server-side pagination correctness, edge cases (empty pages, last page)
- Look for components that fetch data on every render (missing dependency arrays)
- Review the Excel export function (`fetchAllScholars`) — is it safe after the optimization patches?
- Check if there are any remaining unbounded data fetches (fetching all records at once)

### 3. Performance & User Experience
- Check for large list rendering without virtualization
- Review image/avatar loading — lazy loading, fallback handling
- Look for expensive computations in render paths (sorting, filtering on large arrays)
- Check if route-level code splitting is properly configured
- Review the build output size and chunk strategy

### 4. API Integration & Error Handling
- Check if all API errors are properly caught and displayed to users
- Review loading states — skeleton/placeholder patterns
- Look for race conditions in concurrent API calls (old response overwriting new)
- Check if the base URL is properly configurable (env-based)
- Review retry logic — is it appropriate for each endpoint type?

### 5. Maintainability
- Check component size — any components over 300 lines that should be split?
- Review prop drilling vs context usage
- Look for duplicated UI patterns that could be extracted into shared components
- Check if TypeScript is used effectively (strict mode, proper typing)
- Review CSS/styling approach — consistency, no dead CSS

## CONSTRAINTS
- This is a PRODUCTION system. Do NOT make breaking changes.
- Do NOT delete or rewrite files unrelated to the review.
- Prefer adding over rewriting.
- After changes, verify with: `npm run build` (must succeed with exit code 0).
- Do NOT modify `deploy.sh` or build configuration.

## OUTPUT
1. Write a prioritized findings report to `DEEP_REVIEW_REPORT.md`
2. Implement safe improvements directly in the codebase
3. List all changes made with rationale in the report
