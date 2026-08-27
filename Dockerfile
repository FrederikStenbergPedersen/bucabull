# syntax=docker/dockerfile:1

FROM node:22-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ui/package.json packages/ui/package.json
COPY . .
RUN npm ci
RUN npm run build

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
RUN composer dump-autoload --no-dev --optimize \
 && chown -R www-data:www-data storage bootstrap/cache

ENV SERVER_NAME=":8080"
EXPOSE 8080
CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]
