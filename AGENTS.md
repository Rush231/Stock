# AGENTS.md

## Project overview

This repository is a React + TypeScript single-page application for an inventory and retail operations dashboard called OmniStock Nexus.

- App entry: `src/App.tsx`
- UI components: `src/components/`
- Domain types: `src/types/`
- Mock dataset and defaults: `src/data/mockData.ts`
- Persistence and business logic: `src/services/storageService.ts`
- Styling is handled by Vite + Tailwind via `vite.config.ts` and the app CSS in `src/index.css`

The app is largely state-driven and persists inventory, lots, suppliers, ecommerce integrations, movements, audit logs, and user session data in `localStorage` using `StorageService`.

## Working conventions

- Prefer the existing architecture: domain logic in `StorageService`, UI behavior in components, and data contracts in `src/types/*`.
- Keep changes consistent with the current patterns in the codebase rather than introducing broader abstractions.
- Preserve the Spanish retail terminology used throughout the app (for example: sucursal, lote, orden de compra, transferencia, sincronización omnicanal).
- If a feature modifies persisted state, update the relevant `StorageService` accessors and the corresponding `useEffect` sync in `src/App.tsx`.
- Favor small, focused edits that fit the existing component structure instead of large rewrites.
- Use TypeScript types from `src/types` where applicable; avoid loosening types unless the existing code already does so.
- The project uses relative imports in most places, though Vite alias `@` is configured in `tsconfig.json` and `vite.config.ts`.

## Commands

Run these from the repository root:

- `npm install` — install dependencies
- `npm run dev` — start the Vite dev server on port 3000
- `npm run build` — production build
- `npm run lint` — TypeScript check via `tsc --noEmit`

## Common pitfalls

- This app relies on browser `localStorage`; do not assume a server-backed API exists.
- Some features are intentionally demo-like and use mock data rather than real external integrations.
- If you add or rename persisted keys, keep backward compatibility in mind or update the migration logic when relevant.
- Avoid breaking the app’s current single-screen dashboard structure unless the task specifically requires a larger refactor.

## Good targets for exploration

When working on a change, inspect these in order:

1. `src/App.tsx` — main state orchestration and business actions
2. `src/services/storageService.ts` — persistence and domain logic
3. `src/components/<Feature>View.tsx` — UI for the relevant domain
4. `src/types/*.ts` — shape of the data being edited
5. `src/data/mockData.ts` — baseline records and seed data

## Guidance for AI agents

- Make the smallest possible change that solves the task.
- Preserve existing behavior unless the request clearly requires changing it.
- Prefer reusing existing helper methods and state patterns instead of creating parallel implementations.
- If you add a new feature, wire it through the app state persisted in `localStorage` and ensure the dashboard reflects the updated data immediately.
- Keep UI and behavior consistent with the product’s existing inventory / omnichannel operations theme.
