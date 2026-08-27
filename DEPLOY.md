# Deploying Bucabull

Single VPS (the existing UpCloud server, already running Caddy + DNS for
bucabull.com), Docker Compose (app + queue worker + scheduler + Postgres),
GitHub Actions for deploy-on-push. Replaces the earlier stratbook fork that
was previously deployed here.

## Image

FrankenPHP (Laravel's current recommended lightweight production server —
not `php artisan serve`, which is dev-only). Multi-stage `Dockerfile`: a
Node stage builds the Vite bundle, a Composer stage installs PHP deps, the
final stage is the FrankenPHP runtime. `packages/ui` is inlined into the
Vite bundle at build time — the runtime image needs no Node.js.

Three services share one image (`app`, `queue`, `scheduler`), differing
only by `command:` in `docker-compose.prod.yml` — no separate builds, no
cron (Laravel's `schedule:work` runs the scheduler continuously).

## One-time server setup

1. **Retire the old deployment**:

   ```bash
   cd /var/www/csgo-stratbook
   docker compose -f docker-compose.prod.yml down
   ```

   (Leaves the old Mongo volume in place, just stops serving it.)

2. **Clone this repo**:

   ```bash
   sudo mkdir -p /var/www/bucabull
   sudo chown $USER:$USER /var/www/bucabull
   git clone https://github.com/FrederikStenbergPedersen/bucabull.git /var/www/bucabull
   cd /var/www/bucabull
   ```

3. **Create `/var/www/bucabull/.env`**:

   ```env
   APP_NAME=Bucabull
   APP_ENV=production
   APP_KEY=                          # generate: openssl rand -base64 32, prefix with base64:
   APP_DEBUG=false
   APP_URL=https://bucabull.com

   APP_DOMAIN=bucabull.com
   HOME_TEAM_SLUG=bucabull

   STEAM_CLIENT_SECRET=              # Steam Web API key
   STEAM_REDIRECT_URI=https://bucabull.com/auth/steam/callback
   FACEIT_API_KEY=                   # Faceit Developer Portal key

   # postgres = the compose service name, resolved on the compose network
   # — NOT 127.0.0.1, that's only correct for local dev outside Docker
   DB_CONNECTION=pgsql
   DB_HOST=postgres
   DB_PORT=5432
   DB_DATABASE=bucabull
   DB_USERNAME=bucabull
   DB_PASSWORD=                      # generate: openssl rand -hex 24

   SESSION_DRIVER=database
   SESSION_DOMAIN=bucabull.com
   CACHE_STORE=database
   QUEUE_CONNECTION=database

   LOG_CHANNEL=stack
   LOG_LEVEL=error
   ```

4. **Point Caddy at it**:

   ```bash
   sudo cp Caddyfile /etc/caddy/Caddyfile
   sudo systemctl reload caddy
   ```

5. **Set up the deploy SSH key + GitHub secrets** (Settings → Secrets and
   variables → Actions on the new repo):

   ```bash
   ssh-keygen -t ed25519 -C "github-deploy-bucabull" -f ~/.ssh/bucabull_deploy -N ""
   ssh youruser@SERVER "echo '$(cat ~/.ssh/bucabull_deploy.pub)' >> ~/.ssh/authorized_keys"
   ```

   - `SSH_HOST` — server IP/hostname
   - `SSH_USER` — e.g. `root`
   - `SSH_PRIVATE_KEY` — contents of `~/.ssh/bucabull_deploy` (the private key)

   Once these exist, `git push` to `master` builds the image, pushes to
   GHCR, and deploys — including running `php artisan migrate --force` —
   automatically, every time.

6. **Backups** — self-hosted Postgres has no automatic backups:

   ```bash
   crontab -e
   # add:
   0 3 * * * /var/www/bucabull/scripts/backup-postgres.sh >> /var/log/bucabull-backup.log 2>&1
   ```

## Creating the real roster

Don't run the `DatabaseSeeder` in production — it creates fake factory
users. The real team comes from actual Steam logins:

1. Whoever logs in first goes to `/team/join` and creates a team.
   **It must be named exactly `Bucabull`** — `TeamController::store()`
   derives the URL slug from the name via `Str::slug()`, and it has to come
   out to exactly `bucabull` to match `HOME_TEAM_SLUG`, or the public page
   404s (nothing matches `Team::home()`). If it comes out wrong, fix it via
   `docker compose exec app php artisan tinker`.
2. Everyone else logs in and joins using that team's invite code (visible
   to the owner — there's no dedicated UI to view it yet beyond querying
   the DB directly; a "team settings" page showing it is a natural next
   feature, not built yet).

## Verifying the roster data pipeline

`RefreshRosterStatsJob` polls Steam + Faceit every 5 minutes once real
`steam_id`s exist. To check it immediately rather than waiting:

```bash
docker compose -f docker-compose.prod.yml exec app php artisan tinker
>>> (new App\Jobs\RefreshRosterStatsJob)->handle();
```

Then check `player_stats` populated and the roster page reflects it. This
is also the point where the Faceit key gets a real test — it returned a
Cloudflare bot-challenge from the sandboxed dev environment this was built
in (likely IP-reputation based, not a bad key), so this is the first real
chance to confirm it actually works.

## Notes

- `docker-compose.yml` (no suffix) is the local-dev-only Postgres compose
  file — unrelated to this production setup.
- `TrustProxies` is configured (`bootstrap/app.php`) since Caddy sits in
  front as a reverse proxy — required for Socialite's Steam OpenID
  `return_to` URL to correctly resolve as `https://`, not `http://`.
- Verified locally: built the image, ran it against local Postgres,
  confirmed FrankenPHP serves the real seeded team data correctly.
