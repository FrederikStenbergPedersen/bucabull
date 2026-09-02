# bucabull

Independent commercial product — not a fork or derivative of any other
codebase. Laravel + Inertia.js + React (TypeScript) + Tailwind CSS +
PostgreSQL.

Bucabull eSports team platform (bucabull.com), eventually multi-team.
**Auth is Steam-only** — no email/password, no registration form. Logged
out, `/` shows the deployment's configured home team
(`config('app.home_team_slug')`, see `App\Models\Team::home()`); logged in,
it shows the viewer's own team instead — same page (`resources/js/pages/
home.tsx`), conditional data, not two pages. A logged-in user with no team
is redirected to `/team/join` to create or join one via invite code — teams
are self-service, never console-assigned.

Steam/Faceit data (online status, rank, playtime) is polled on a schedule
(`app/Jobs/RefreshRosterStatsJob.php`, `routes/console.php`) into
`player_stats`, never fetched live per-request.

Strats and the tactics board — the original stratbook-inspired feature
set — are intentionally not built yet. Don't add them unless asked. The
Grenades library (`app/Http/Controllers/GrenadeController.php`,
`resources/js/pages/team/grenades/`) is the first team tool built beyond
the roster/auth foundation: per-team lineups (setpos, side, throw button,
stance/movement/jump, type, up to 3 screenshots) organized by map. Maps
are a curated list in `config/maps.php` (append-only slugs — see the
comment there) plus a free-text "Other" fallback with no overview image.
Screenshot uploads go through the `public` disk; the production Docker
setup bind-mounts `storage/app/public` on the `app` service only (see
`docker-compose.prod.yml`).

The roster page (`home.tsx`) is wrapped in `TeamLayout`
(`packages/ui/src/patterns/TeamLayout.tsx`), which owns the whole page
frame — backdrop, header, nav tabs, content area — for both the
logged-out and logged-in views. The nav tab row only renders once there's
more than one entry, sourced from `useTeamNav()`
(`resources/js/hooks/use-team-nav.ts`). When a new team-facing tool is
added: put its page under `resources/js/pages/team/`, wrap it in
`<TeamLayout>`, and add one entry to `useTeamNav()`. Its controller stays
a flat file in `app/Http/Controllers/` unless/until that domain grows a
second controller (the only reason `Auth/` is a subnamespace today).

## Component library is the only door in

All UI must be built from `@bucabull/ui` (`packages/ui/`). Never write raw
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

## Working process

Feature requests, bugs, and other planned work are tracked as GitHub
issues on this repo, not in an external tool (Linear, Trello, etc.).
When asked to log, file, or track something, create/update a GitHub
issue (`gh issue create` / `gh issue list`) rather than a local doc or
TODO list. This also keeps the project in a state that's ready to go
open-source later without a tracker migration.

The codebase is licensed AGPL-3.0-only (see `LICENSE`): open to use,
forking, and contributions, but anyone running a modified version as a
network service must publish that version's source too — this is what
keeps someone from cloning bucabull, hosting it on another domain, and
selling it as a closed competing product. Paid features (planned: stat
calculation, AI features) are meant to live in a separate private
package once built, not in this repo — that's what actually protects
the revenue-bearing code, not the license terms.

## Stack notes

- Auth is `laravel/socialite` + `socialiteproviders/steam` (Steam uses
  OpenID 2.0, not OAuth2 — single verification round-trip, no token
  exchange). `SteamAuthController` handles redirect/callback;
  `AuthenticatedSessionController` only handles logout now.
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
- `composer run dev`'s dev server deliberately does **not** run `php artisan
  serve` — it invokes the same underlying router script directly
  (`vendor/laravel/framework/.../resources/server.php`) with `-d` flags
  raising `upload_max_filesize`/`post_max_size`/`memory_limit`, run from
  `public/` as `artisan serve` itself does internally. `-d` flags given to
  `php artisan serve` are silently ignored — it shells out to a hardcoded
  `php -S ... server.php` subprocess (see `ServeCommand::serverCommand()`)
  that doesn't inherit them, and neither does a `.user.ini` (not honored by
  PHP's built-in CLI server). Even with correct limits, PHP's built-in
  server is still inherently slow — closer to 1MB/s than any real
  network/disk speed, and worse than linear as the body grows — at
  buffering a large POST body (this is a `php -S` implementation
  limitation, not something any of the above fixes); a multi-hundred-MB
  `.dem` upload (see the demo viewer feature) will take several minutes
  locally even though production (FrankenPHP) doesn't have this problem.
  For a closer-to-production timing check, `docker compose --profile full
  up -d --build` runs the real image locally instead (see
  `docker-compose.yml`'s comment on that service).
