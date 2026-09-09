# Image du site public R Start : build Astro puis service statique par nginx.
# Utilisée par le pipeline Azure (push sur ACR) et déployée sur l'App Service en conteneur.
# Build local : docker build -t r-start .   puis   docker run --rm -p 8080:80 r-start

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Valeurs de repli identiques à astro.config.mjs : l'image se construit sans configuration.
ARG PUBLIC_SITE_URL="https://r-start.com"
ARG PUBLIC_SUBSCRIBE_URL="https://www.corum.fr/?tunnel=r-start#placeholder"
ARG PUBLIC_GTM_ID=""
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
ENV PUBLIC_SUBSCRIBE_URL=$PUBLIC_SUBSCRIBE_URL
ENV PUBLIC_GTM_ID=$PUBLIC_GTM_ID

RUN pnpm build && pnpm test:html && pnpm test:compliance

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
