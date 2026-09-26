# OrbitAI

Goal manager with an AI agent loop. The user types a goal, the agent breaks it into tasks, and on each run it observes the user's state, decides one action, performs it, and stores what it did.

## About the owner

- Atharva works as a system architect and uses AI tools to write code. He is not a traditional developer.
- Explain every change in plain, simple words before making it: what the file does, what changes, and why.
- Give beginner-level, step-by-step instructions with exact commands. One small step at a time.
- Ask before anything destructive or hard to undo.

## Structure

```
backend/    Node.js + Express API, deployed on Render (auto-deploys from main)
  src/index.js, src/app.js        server start and route mounting
  src/routes/                     agentRoutes, taskRoutes, notificationRoutes
  src/controllers/                agentController, notificationController
  src/middleware/                 requireUser (login token check), requireCronSecret
  src/agent/                      observe.js -> think.js -> act.js -> remember.js
  src/services/                   supabaseClient, emailService (Resend), agentService
frontend/   Next.js App Router + TypeScript + Tailwind, deployed on Vercel (auto-deploys from main)
  lib/api.ts                      axios client; attaches the Supabase login token
  lib/supabase.ts                 Supabase browser client (anon key, login only)
  app/dashboard, app/login, app/signup, app/auth/callback
automation/n8n/                   local n8n (Docker) that calls the reminder endpoint on a schedule
```

## Stack

- Database and login: Supabase (PostgreSQL + Supabase Auth).
- LLM: Groq, models `openai/gpt-oss-120b` (primary) and `openai/gpt-oss-20b` (fallback), strict JSON schema output. Only `backend/src/agent/think.js` calls the model.
- Email: Resend.
- Tables: `profiles`, `goals`, `tasks`, `reminders`, `agent_memory`, `agent_runs`. `tasks` has no `user_id`; ownership goes task -> goal -> `goals.user_id`.

## Security rules (do not break these)

- Row Level Security is ON for every table, with no policies. Only the backend's service key can read or write tables.
- The frontend must never query tables directly. It uses Supabase only for login. All data goes through the Express API.
- Every data endpoint uses the `requireUser` middleware and takes the user id from `req.userId`. Never trust a user id sent in the body, query or URL.
- Scheduler-only endpoints (like `/notifications/daily-reminders`) use `requireCronSecret`.
- The service key, Groq key, Resend key and cron secret exist only in the backend environment (Render / `backend/.env`). Nothing secret goes in a `NEXT_PUBLIC_` variable.

## Environment variables (names only)

- Backend: `PORT`, `SUPABASE_URL`, `SUPABASE_KEY` (service role key), `GROQ_API_KEY`, `GROQ_MODEL` (optional), `GROQ_FALLBACK_MODEL` (optional), `RESEND_API_KEY`, `CRON_SECRET`.
- Backend, planned: `GMAIL_USER`, `GMAIL_APP_PASSWORD` - a Gmail account for sending reminder emails to users instead of Resend. Set on Render but not used by the current code; the earlier Gmail sending code was in a commit that was rolled back and never reached GitHub.
- Frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Git and secrets rules

- Never open, read, print or edit any `.env` or `.env.local` file.
- Work on a new branch for every change. Never commit directly to `main`.
- Never push without Atharva saying so explicitly in the current conversation. Pushing to `main` deploys to production.
- Never use `git add .` or `git add -A`. Add the specific files that belong to the change.
- Never commit anything under `automation/n8n/n8n-data/`, and never commit `frontend/.cursorrules` changes unless asked.
- Never force-push, rewrite history, or delete files without asking first.

## Running locally

- Backend: `cd backend`, `npm install`, `npm start` (port 4000).
- Frontend: `cd frontend`, `npm install`, `npm run dev` (port 3000).
- Health check: `GET /health` returns `{ "status": "ok" }`.