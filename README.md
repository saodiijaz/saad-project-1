# SportMeet

App som samlar sportföreningar i Sverige. MVP börjar i Linköping.

## Stack
- Expo + React Native + TypeScript
- Supabase (kommer när nycklarna finns)
- pnpm + Turborepo monorepo

## Setup
1. `pnpm install`
2. (Valfritt) Kopiera `.env.example` till `apps/mobile/.env` och fyll i Supabase-värden
3. `pnpm dev`
4. Skanna QR-koden med Expo Go

## Demo-läge
Utan `.env` körs appen med mock-data. Gul banner visar "Demo-läge" högst upp.

## Struktur
- `apps/mobile` — Expo-appen
- `packages/shared` — delade typer
- `docs/briefs` — byggplan per brief
