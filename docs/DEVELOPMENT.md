# Open Charity - Development Guide

## 1. Prerequisites

Before starting development, make sure you have installed:

- Node.js 20+,
- Docker 20.10+,
- Docker Compose V2

## 2. First-Time Setup

1. Clone repository

```bash
git clone https://github.com/creativiso/open-charity.git
cd open-charity
```

2. Copy .env.example to .env and configure

```bash
copy .env.example .env
```

After doing this, make sure you fill in JWT secret, database passwords and session secret

3. Install dependencies

```bash
yarn install
```

4. Start services (Docker containers)

```bash
npm run services:start
```

5. Setup database

```bash
yarn setup
```

## 3. Daily Development Workflow

Start services

```bash
yarn services:start
```

Start dev server

```bash
yarn workspace server dev
```

Stop services

```bash
yarn services:stop
```

## 4. Common Tasks:

Running migrations

```bash
yarn db:migrate
```

Rollback last migration

```bash
yarn db:migrate:undo
```

Seeding data

```bash
yarn db:seed
```

Running tests

```bash
yarn test
```

Linting and formatting

```bash
yarn lint
```

```bash
yarn lint:fix
```

```bash
yarn format
```

Viewing logs

```bash
yarn docker:logs
```

```bash
yarn docker:logs:mysql
```

```bash
yarn docker:logs:redis
```

## 5. Troubleshooting:

- Port conflicts

Make sure these port numbers are free:
port 3000 - Node
port 3306 - MySql
port 6379 - Redis

- Database connection issues

Check . env configuration file and run

```bash
yarn wait-for-db
```

- Docker permission problems

Ensure you can run Docker commands (ex. docker ps works)

- Service startup failures

Check logs with yarn docker:logs.

## 6. Docker Commands Reference

## 7. NPM Scripts Reference
