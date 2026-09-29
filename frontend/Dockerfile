# Multi-stage build: compile the Vite/React app, then serve the static
# output with Nginx, which also reverse-proxies /api/ and /admin/ to the
# backend container so the browser only ever talks to one origin.

FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Baked into the JS bundle at build time (Vite convention) — override with
# --build-arg if the backend isn't reachable at /api on the deployed origin.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
