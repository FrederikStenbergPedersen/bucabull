# Deploying Bucabull

Single VPS (the existing UpCloud server, already running Caddy + DNS for
bucabull.com), Docker Compose (app + queue worker + demo-queue worker +
scheduler + Postgres), GitHub Actions for deploy-on-push. Replaces the
earlier stratbook fork that was previously deployed here.

## Image

FrankenPHP (Laravel's current recommended lightweight production server —
not `php artisan serve`, which is dev-only). Multi-stage `Dockerfile`: a
Node stage builds the Vite bundle, a Composer stage installs PHP deps, the
final stage is the FrankenPHP runtime. `packages/ui` is inlined into the
Vite bundle at build time — the runtime image needs no Node.js.

Four services share one image (`app`, `queue`, `queue-demos`, `scheduler`),
differing only by `command:` in `docker-compose.prod.yml` — no separate
builds, no cron (Laravel's `schedule:work` runs the scheduler
continuously). `queue-demos` is a dedicated worker/queue for demo parsing
(see `config/demos.php`), kept separate so a long-running parse never
blocks `queue`'s other jobs (e.g. the 5-minute roster refresh).

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

3. **Create the storage directories the compose file bind-mounts**:

   ```bash
   mkdir -p /var/www/bucabull/storage/app/public /var/www/bucabull/storage/app/private
   ```

   Both must be writable by whatever user the containers run as (verify
   with `docker compose exec app id`) — a bind mount does NOT inherit the
   image's build-time `chown www-data storage`. `private` holds uploaded
   CS2 demos and their parsed output (never served directly — see
   `DemoController`); `queue-demos` reads/writes it too, unlike `public`.

4. **Create `/var/www/bucabull/.env`**:

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

5. **Point Caddy at it**:

   ```bash
   sudo cp Caddyfile /etc/caddy/Caddyfile
   sudo systemctl reload caddy
   ```

6. **Set up the deploy SSH key + GitHub secrets** (Settings → Secrets and
   variables → Actions on the new repo):

   ```bash
   ssh-keygen -t ed25519 -C "github-deploy-bucabull" -f ~/.ssh/bucabull_deploy -N ""
   ssh youruser@SERVER "echo '$(cat ~/.ssh/bucabull_deploy.pub)' >> ~/.ssh/authorized_keys"
   ```

   - `SSH_HOST` — server IP/hostname
   - `SSH_USER` — e.g. `root`
   - `SSH_PRIVATE_KEY` — contents of `~/.ssh/bucabull_deploy` (the private key)

   Once these exist, `git push` to `main` builds the image, pushes to
   GHCR, and deploys — including running `php artisan migrate --force` —
   automatically, every time.

7. **Backups** — self-hosted Postgres has no automatic backups. Also
   turn on your host's own server/disk-level backup or snapshot feature
   (most VPS providers have one) — `scripts/backup-postgres.sh` alone
   only protects the database, and still writes to the same disk unless
   you also configure off-box shipping below.

   ```bash
   mkdir -p /var/backups/bucabull
   crontab -e
   # add:
   0 3 * * * /var/www/bucabull/scripts/backup-postgres.sh >> /var/log/bucabull-backup.log 2>&1
   ```

   Optional but recommended — ship the dump off-box too, so a lost VPS
   doesn't take the backups with it. The script is provider-agnostic: it
   shells out to `rclone` against whatever remote you've configured, so
   any provider `rclone` supports (S3-compatible object storage, SFTP,
   B2, etc.) works without touching the script.

   ```bash
   # install rclone, then configure a remote interactively:
   rclone config
   # note the remote name you give it, e.g. "backups"

   # point the backup script at it:
   echo 'BACKUP_RCLONE_REMOTE="backups:bucabull"' | sudo tee /etc/bucabull-backup.env
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
- **Not yet verified**: large CS2 demo uploads (100s of MB) against a real
  deploy. `docker/php/uploads.ini` raises PHP's own limits, but FrankenPHP's
  own Caddy config baked into the base image (`/etc/frankenphp/Caddyfile`,
  distinct from this repo's root `Caddyfile`, which is the host reverse
  proxy) has its own request-body limit that could reject a large upload
  before PHP ever sees it. Test with a real multi-hundred-MB `.dem` file
  after this deploys, before relying on it.
