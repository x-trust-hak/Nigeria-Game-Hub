---
name: Play9ja package sub-path exports
description: api-client-react needs explicit exports in package.json for Vite to resolve deep imports like /src/custom-fetch and /src/generated/api.schemas
---

The `@workspace/api-client-react` package.json needs explicit exports for every sub-path imported by the frontend:

```json
"exports": {
  ".": "./src/index.ts",
  "./src/custom-fetch": "./src/custom-fetch.ts",
  "./src/generated/api.schemas": "./src/generated/api.schemas.ts"
}
```

**Why:** Vite resolves package imports via the `exports` map in package.json. Without an explicit entry, importing `@workspace/api-client-react/src/custom-fetch` throws "Missing specifier" at dev time. This is required for `setAuthTokenGetter` (used in AuthContext) and schema types.

**How to apply:** Any time a workspace library adds a new sub-path import, add the matching entry to its package.json `exports` map.
