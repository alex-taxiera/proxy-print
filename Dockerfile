# Use an official Node 24 image as the dependency installer
FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
# Create public directory for postinstall script
RUN mkdir -p public
RUN npm ci --ignore-scripts

# Builder image
FROM node:24-alpine AS builder

ARG SENTRY_ENV="production"
ARG SENTRY_AUTH_TOKEN=""

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV VITE_SENTRY_ENV=${SENTRY_ENV}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

RUN npm run prepare
RUN npm run build

# Production image
FROM nginx:alpine AS runner

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist .
# Remove default nginx static assets config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

