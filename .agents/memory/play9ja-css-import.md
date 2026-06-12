---
name: Play9ja CSS @import ordering
description: Google Fonts @import url() must come before Tailwind @import in index.css to avoid PostCSS errors
---

In `artifacts/play9ja/src/index.css`, the Google Fonts `@import url(...)` must be the **first line**, before `@import "tailwindcss"` and `@import "tw-animate-css"`.

```css
/* CORRECT ORDER */
@import url('https://fonts.googleapis.com/css2?...');
@import "tailwindcss";
@import "tw-animate-css";
```

**Why:** PostCSS/Tailwind enforces that `@import` statements must precede all other statements. Placing the `@import url()` after the Tailwind imports causes: `@import must precede all other statements (besides @charset or empty @layer)`.

**How to apply:** When adding Google Fonts or any external @import in a Tailwind v4 project, always put it first.
