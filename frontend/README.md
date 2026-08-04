# Elevate frontend

React and TypeScript client for uploading CVs, following analysis progress, and
restoring persisted results.

## Source structure

```text
src/
|-- api/                     # HTTP client and backend response contracts
|-- app/                     # Application composition and top-level state
|-- components/ui/           # Reusable, feature-agnostic UI primitives
|-- features/
|   |-- cv-analysis/         # Upload, preview, polling, and result screens
|   `-- history/             # Recent-analysis navigation and local storage
|-- lib/                     # Generic utilities
|-- styles/                  # Global styles and design tokens
|-- main.tsx                 # Browser entry point and global providers
`-- vite-env.d.ts            # Vite environment typings
```

## Dependency rules

- `app` may compose features, shared UI, and API modules.
- A feature owns its components, hooks, and feature-specific storage.
- Features import shared modules through the `@/` alias.
- `api`, `components/ui`, and `lib` must not import from features.
- Import concrete modules directly; avoid broad barrel exports.

## Development

```bash
npm install
npm run dev
```

Create a `.env` file with:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_KEY=the-same-value-as-the-backend-api-key
```

## Validation

```bash
npm run build
npm run lint
```
