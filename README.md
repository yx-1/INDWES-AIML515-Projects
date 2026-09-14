# PermitLens AI

PermitLens AI is a residential permit research assistant for contractors working in **Los Angeles**, **Austin**, and **Seattle**. It returns document checklists, municipal thresholds, and source references for common residential permit categories.

This project was imported from Google AI Studio and is intended as a course MVP. It is **not** an official permitting authority.

## Features

- Search permit requirements by city and category
- Suggested contractor questions for each jurisdiction
- Document checklist with source links
- Local search history that survives a page refresh
- Optional Google sign-in and Firestore history when Firebase is available
- Verified fallback answers when a Gemini API key is not configured

## Tech stack

- React 19 and TypeScript
- Vite 6
- Express (API + development server)
- Tailwind CSS 4
- Firebase Authentication and Firestore (optional at runtime)
- Google Gemini (`@google/genai`) for generated answers when `GEMINI_API_KEY` is set

## Project structure

```text
src/
  App.tsx                     Application shell and search workflow
  main.tsx                    React entry point
  types.ts                    Shared TypeScript types
  components/                 Screen-level UI
    common/                   Reusable banners, icons, and spinners
  data/                       Jurisdiction constants and demo records
  lib/                        Firebase, validation, storage, and error helpers
server.ts                     Express API and Vite middleware
firebase-applet-config.json   Firebase client configuration from AI Studio
.env.example                  Environment variable template
```

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env   # if .env does not already exist
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The development script starts Express with Vite middleware. A Gemini key is **not** required for the app to load; searches fall back to verified municipal reference data when the key is missing or invalid.

## Environment variables

| Variable | Required to run | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Enables live Gemini answers. Leave the placeholder to use verified fallback data. |
| `APP_URL` | No | Hosted URL used in AI Studio / Cloud Run. |
| `PORT` | No | Server port. Defaults to `3000`. |

Firebase web configuration is already stored in `firebase-applet-config.json`. No additional Firebase env vars are required for local use. Google sign-in may prompt you to allow `localhost` in the Firebase Auth authorized domains list; the rest of the app still works without signing in.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local app at http://localhost:3000 |
| `npm run build` | Production client and server build |
| `npm start` | Run the production server from `dist/` |
| `npm run lint` | Typecheck with `tsc --noEmit` |

## Local persistence

Guest sessions store non-sensitive data in the browser:

- Search history and the last selected city/category
- The last permit question
- Checklist completion for each answer

API keys, passwords, and Firebase credentials are not stored in `localStorage`. Signed-in history continues to use Firestore when that connection succeeds.

## Disclaimer

PermitLens AI provides preliminary research guidance based on published municipal documents. Always verify requirements with the local building department before submitting a permit application.
