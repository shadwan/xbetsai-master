# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (port 3000)
- `npm run build` — Production build
- `npm start` — Start production server
- `npm run lint` — Run ESLint

## Architecture

- **Next.js 16** with App Router (`app/` directory) and TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 via PostCSS
- **Data fetching**: @tanstack/react-query (installed, not yet wired up)
- **Fonts**: Geist and Geist Mono loaded via `next/font/google` in `app/layout.tsx`
- **Path alias**: `@/*` maps to the project root

## Project State

This is a freshly scaffolded Create Next App. The `app/` directory contains the root layout, a single home page, and global styles. No custom features have been implemented yet.
