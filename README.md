# AnchoredNews Pre-Alpha

AnchoredNews Pre-Alpha is a portfolio-grade rebuild of a global news and events dashboard focused on interactive exploration of article activity across geography, time, and topic. The project preserves the original product concept and visible UX while significantly improving the codebase architecture, maintainability, and article data scalability.

This version was rebuilt by Sophia Herman as a clean React implementation and then upgraded from local full-dataset article processing to a PostgreSQL-backed query pipeline suitable for hosted deployment.

## Live Project

- Production app: [https://anchorednews-pre-alpha.vercel.app](https://anchorednews-pre-alpha.vercel.app)

## Portfolio Summary

This project showcases:

- frontend reconstruction from an exported design implementation
- architectural cleanup without changing the product itself
- migration from client-heavy article processing to server-side SQL querying
- deployment of a React + TypeScript + PostgreSQL app to Vercel
- parity-focused engineering, where feature behavior was preserved while the internals were improved

The goal was not to invent a new app idea. The goal was to faithfully recreate and stabilize an existing global news dashboard, then make its article system scalable enough for future portfolio deployment and larger datasets.

## What The App Does

AnchoredNews provides a dashboard experience for exploring a corpus of global news articles through multiple coordinated views:

- an interactive world map with country-level article counts
- a trends view for topic, sentiment, entity, and country analysis over time
- a timeline control for filtering by date range and time granularity
- a left-side article rail with search, topic filters, country filters, and date filters
- an article detail modal for reading metadata and opening the original source
- an AI insights panel summarizing topic frequency, sentiment distribution, and key entities
- accessibility controls for contrast, font size, spacing, and target sizing

## Engineering Goals

The project had two major phases:

1. Rebuild the UI architecture while preserving the original product.
2. Replace inefficient article handling with a PostgreSQL-backed query pipeline.

The most important constraint throughout the work was parity. The visible design, information architecture, product concept, and feature set were preserved while the code structure and data flow were modernized.

## Key Improvements

### 1. UI Rebuild With Cleaner Architecture

The original exported implementation concentrated too much UI logic and derived state in oversized files. This rebuild split responsibilities into focused feature areas, including:

- `dashboard` for top-level state orchestration
- `filters` for article drawer and filter controls
- `map` for country-based interaction
- `trends` for aggregated chart views
- `timeline` for date-range interaction
- `insights` for AI summary rendering
- `shared` for types, utilities, and domain contracts

### 2. Migration From Local Dataset Processing To PostgreSQL

The original article flow relied on loading and processing the full article corpus in the browser. That approach does not scale well once the article count grows.

This version moves article-heavy work to PostgreSQL:

- article storage now lives in a relational table
- filtering happens server-side
- article pagination happens server-side
- trend aggregation happens server-side
- country counts happen server-side
- AI insight summary inputs are computed server-side

The browser now requests only the data it needs for the current view.

### 3. Deployment-Ready API Design

The project supports both:

- local development with an Express API under `server/`
- deployed Vercel serverless routes under `api/`

Both entrypoints reuse the same query and filter logic, which keeps local and deployed behavior aligned.

## Why PostgreSQL Was Added

PostgreSQL was introduced specifically to solve article scalability and article rendering performance.

The priorities for the migration were:

- avoid loading the full article corpus into the browser
- reduce lag in article list rendering and filtering
- support significantly larger future article datasets
- keep the current UI and feature behavior consistent
- establish a durable SQL foundation for deployment

The PostgreSQL layer uses:

- paginated article queries
- server-side date/topic/country/search filtering
- aggregated trend queries
- country count aggregation
- persistent ordering via `sort_order` to preserve original article behavior
- trigram-backed search text indexing for more efficient article search

## Architecture Overview

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- feature-oriented folder structure

The frontend is responsible for:

- rendering the dashboard UI
- managing shared UI state with a reducer
- requesting filtered and paginated data from the API
- coordinating views such as map, trends, article panel, timeline, and modal

### Backend

- Express for local API development
- PostgreSQL via `pg`
- shared SQL repository layer
- Vercel Functions for deployed API routes

The backend is responsible for:

- query parsing
- article pagination
- summary aggregation
- trend aggregation
- country-level article counts
- preserving parity with the original dataset behavior

### Database

The article table stores:

- article identity and metadata
- country and topic fields
- dates and sentiment fields
- entity and keyword arrays
- `search_text` for search indexing
- `sort_order` for stable original ordering

This allows the app to remain visually consistent while becoming much more scalable internally.

## Project Structure

```text
api/                         Vercel serverless API entrypoints
server/                      Local Express API and PostgreSQL query layer
src/                         Frontend application
src/features/                Feature-based UI modules
src/shared/                  Shared types and utilities
src/data/                    Preserved source data used for seeding/reference
```

Important areas:

- `src/features/dashboard/DashboardApp.tsx`
  Top-level dashboard composition and data-loading orchestration
- `server/articles/repository.ts`
  Core PostgreSQL query logic for articles, summaries, and trends
- `server/articles/filters.ts`
  Shared filter parsing and SQL condition building
- `server/scripts/setupDatabase.ts`
  Database creation and seed script
- `api/`
  Vercel-compatible deployed routes

## Data Flow

At runtime, the deployed app works like this:

1. The frontend loads bootstrap metadata such as topics, countries, and date bounds.
2. The user changes filters, search terms, countries, time range, or trend granularity.
3. The frontend sends those filters to the API.
4. PostgreSQL returns:
   - a paginated article page
   - article counts by country
   - AI summary inputs
   - trend aggregates
5. The frontend renders only the requested slice of data instead of the full corpus.

This architecture keeps the UI responsive while preserving the original interactions.

## Local Development

### Prerequisites

- Node.js
- npm
- PostgreSQL-compatible connection string
- Supabase Session Pooler or another hosted PostgreSQL instance

### Environment Variables

Create a local `.env` file based on `.env.example`.

Expected variables:

```env
DATABASE_URL=postgresql://username:password@your-session-pooler-host:5432/postgres?sslmode=require
API_PORT=3001
PGSSL=true
PGPOOLMAX=1
```

Notes:

- `DATABASE_URL` should point to the hosted PostgreSQL database.
- `PGSSL=true` is expected for hosted databases such as Supabase.
- `PGPOOLMAX=1` is intentionally conservative for session-pooled hosted environments.

### Install

```bash
npm install
```

### Seed The Database

```bash
npm run db:setup
```

### Verify The Database

```bash
npm run db:verify
```

### Start Local Development

```bash
npm run dev
```

Frontend:

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

Useful API checks:

- [http://127.0.0.1:3001/api/health](http://127.0.0.1:3001/api/health)
- [http://127.0.0.1:3001/api/dashboard/bootstrap](http://127.0.0.1:3001/api/dashboard/bootstrap)

## Available Scripts

- `npm run dev`
  Starts the local frontend and Express API together
- `npm run dev:client`
  Starts the Vite frontend only
- `npm run dev:server`
  Starts the local Express API only
- `npm run build`
  Builds the frontend and server TypeScript outputs
- `npm run test`
  Runs the test suite
- `npm run db:setup`
  Creates/seeds the PostgreSQL article table
- `npm run db:verify`
  Verifies that required article data exists in the database

## Deployment Notes

The project is deployed on Vercel and uses serverless functions under `api/` for production.

Production environment variables required in Vercel:

- `DATABASE_URL`
- `PGSSL=true`
- `PGPOOLMAX=1`

Because article data is served by PostgreSQL-backed API routes, the deployed dashboard continues to render live article content instead of falling back to a static local dataset.

## Validation And Testing

This project includes parity and regression validation in several areas:

- reducer tests for dashboard state behavior
- selector tests for preserved local derivation behavior
- repository parity tests comparing PostgreSQL results to the original selector-based expectations
- database verification for article count and required fields
- production build verification

These checks were used to confirm that the migration away from browser-side article processing did not silently change user-facing behavior.

## Challenges Solved

Some of the most meaningful technical problems addressed in this project were:

- preserving article ordering after moving from local arrays to SQL queries
- preserving filter and trend behavior while changing the data layer completely
- handling hosted PostgreSQL session pool limits during tests and deployment
- rebuilding the app into maintainable feature boundaries without redesigning the product
- supporting both local Express development and deployed Vercel serverless execution

## Future Expansion Opportunities

This pre-alpha version is already deployment-ready, but it also creates room for future work such as:

- broader article ingestion pipelines beyond the preserved seed dataset
- admin/content import tooling
- richer full-text search strategies
- more automated integration testing
- additional observability around deployed API performance

## Attribution

Rebuilt and engineered by Sophia Herman.

This repository represents portfolio work focused on frontend reconstruction, scalable article architecture, PostgreSQL integration, and deployment-ready product engineering.
