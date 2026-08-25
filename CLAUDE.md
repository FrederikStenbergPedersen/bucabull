# newapp

Independent commercial product — not a fork or derivative of any other
codebase. Laravel + Inertia.js + React (TypeScript) + Tailwind CSS +
PostgreSQL.

## Component library is the only door in

All UI must be built from `@newapp/ui` (`packages/ui/`). Never write raw
Tailwind-styled JSX directly in `resources/js/pages/**` (or anywhere else in
`resources/js`) for anything the library could reasonably provide.

If a screen needs a component, variant, or pattern the library doesn't have
yet:
1. Add it to `packages/ui/src/{primitives,patterns}` first, built from the
   existing design tokens (`packages/ui/src/tokens/*.ts` and
   `packages/ui/src/theme.css` — don't invent new colors/spacing ad hoc).
2. Give it a Storybook story (`*.stories.tsx` next to the component).
3. Export it from `packages/ui/src/index.ts`.
4. Only then consume it from the page.

This is deliberate: the point is a coherent, deliberately-designed product
that never drifts into generic shadcn/AI-generated-looking UI one page at a
time.

## Stack notes

- Auth backend (routes, controllers under `app/Http/Controllers/Auth`) is
  Laravel's own plain controllers, not Fortify — this version of the
  starter kit doesn't use Fortify. Leave it as-is; only the React page/layout
  layer gets rebuilt on `@newapp/ui`.
- Tailwind v4 is CSS-first — there is no `tailwind.config.js`. Theme lives in
  `packages/ui/src/theme.css`, imported by both `resources/css/app.css` and
  Storybook's `packages/ui/.storybook/preview.tsx`. Never define colors
  directly in `resources/css/app.css` — it should only ever import the
  library's theme.
- `packages/ui` is consumed as raw TypeScript source via an npm workspace, no
  build step. If you add Tailwind classes inside `packages/ui/src` that don't
  already appear anywhere in `resources/js`, double check they survive a
  production build (`npm run build`) — Tailwind's content scanning is told
  about the workspace package via the `@source` directive in
  `resources/css/app.css`; if that directive ever gets removed, classes used
  only inside the library get silently purged with no build error.
- Local Postgres: `docker compose up -d` (root `docker-compose.yml`).
