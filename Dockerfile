# syntax=docker/dockerfile:1

FROM node:22-alpine AS assets
WORKDIR /app
ARG VITE_APP_NAME=Bucabull
ENV VITE_APP_NAME=$VITE_APP_NAME
COPY package.json package-lock.json ./
COPY packages/ui/package.json packages/ui/package.json
COPY . .
RUN npm ci
RUN npm run build

FROM golang:1.27-bookworm AS gobuild
WORKDIR /build
COPY go/ .
# CGO_ENABLED=0: a static binary, no libc dependency to worry about when
# it's copied into the frankenphp image below (which has its own glibc,
# but this avoids caring whether it matches).
RUN CGO_ENABLED=0 go build -o /build/bin/democompact ./cmd/democompact

FROM dunglas/frankenphp:1-php8.4-bookworm AS vendor
WORKDIR /app
RUN install-php-extensions pdo_pgsql pgsql opcache intl zip bcmath
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist \
    --optimize-autoloader --no-scripts

FROM dunglas/frankenphp:1-php8.4-bookworm AS app
WORKDIR /app
RUN install-php-extensions pdo_pgsql pgsql opcache intl zip bcmath
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY --from=vendor /app/vendor ./vendor
COPY . .
COPY --from=assets /app/public/build ./public/build
# Raw CS2 demo uploads run several hundred MB — see the file's own
# comment for why stock PHP defaults don't fit.
COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini
# The demo parser CLI (go/), invoked as a subprocess by ParseDemoJob —
# config('demos.parser_binary_path') defaults to this same path. Baked
# into the one shared image so `queue-demos` (the only service that
# actually runs it) needs no separate build.
COPY --from=gobuild /build/bin/democompact /usr/local/bin/democompact
RUN composer dump-autoload --no-dev --optimize \
 && php artisan storage:link \
 && chown -R www-data:www-data storage bootstrap/cache

ENV SERVER_NAME=":8080"
EXPOSE 8080
CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]
