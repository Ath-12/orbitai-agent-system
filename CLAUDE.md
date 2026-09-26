# OrbitAI

Goal manager with an AI agent loop. The user sets a goal, the AI writes a task list, and on each run the agent observes the user's state, decides one action, performs it, and stores what it did. When a goal ends it moves to the goal history.

## About the owner

- Atharva works as a system architect and uses AI tools to write code. He is not a traditional developer.
- Explain every change in plain, simple words before making it: what the file does, what changes, and why.
- Give beginner-level, step-by-step instructions with exact commands. One small step at a time.
- Ask before anything destructive or hard to undo.

## Structure

```
backend/    Node.js + Express API on Render
  src/index.js, src/app.js        server start and route mounting
  src/routes/                     agentRoutes, taskRoutes, goalRoutes, notificationRoutes
  src/controllers/                agentController, notificationController
  src/middleware/                 requireUser (login token check), requireCronSecret
  src/agent/                      observe.js -> think.js -> act.js -> remember.js
  src/services/llm.js             every AI call goes through here (model choice + fallbacks)
  src/services/goalService.js     current goal, new goal, complete goal, progress, history
  src/services/                   supabaseClient, emailService (Resend), agentService
frontend/   Next.js App Router + TypeScript + Tailwind on Vercel
  app/dashboard/page.tsx          goal, progress bar, tasks, AI output, memory, reminders, goal history
  lib/api.ts                      axios client; attaches the Supabase login token
  lib/supabase.ts                 Supabase browser client (anon key, login only)
automation/n8n/                   local n8n (Docker) that calls the reminder endpoint on a schedule
```

## AI models

All calls go through `backend/src/services/llm.js`, which tries providers in order until one answers:

- tier "fast": Groq `openai/gpt-oss-20b` -> Groq `openai/gpt-oss-120b` -> Gemini
- tier "smart": Groq `openai/gpt-oss-120b` -> Groq `openai/gpt-oss-20b` -> Gemini

Use "smart" for content the user keeps (task lists for a goal). Use "fast" for decisions and short replies. Gemini is only the last backup. Groq uses strict JSON schema output; every answer is also checked in code before use.

## Goals

- A goal is open while `goals.ended_at` is empty. Each user has at most one open goal; a unique index in the database enforces this.
- When a goal ends, `ended_at` is set and `outcome` is `completed` or `replaced`. Ended goals are the history.
- Completing the last task completes the goal automatically. The user can also press "Complete goal", or "New goal" (the open one becomes `replaced`).
- Always find the open goal with `getActiveGoal()` in goalService. Never query goals by status alone.

## Database

- Supabase (PostgreSQL + Supabase Auth). Tables: `profiles`, `goals`, `tasks`, `reminders`, `agent_memory`, `agent_runs`.
- `tasks` has no `user_id`; ownership goes task -> goal -> `goals.user_id`.
- Task priority is text (`high`, `medium`, `low`). Sort it in code, never with `order("priority")`, which puts "medium" first.

## Security rules (do not break these)

- Row Level Security is ON for every table, with no policies. Only the backend's service key can read or write tables.
- The frontend must never query tables directly. It uses Supabase only for login. All data goes through the Express API.
- Every data endpoint uses the `requireUser` middleware and takes the user id from `req.userId`. Never trust a user id sent in the body, query or URL.
- Scheduler-only endpoints (like `/notifications/daily-reminders`) use `requireCronSecret`.
- Secret keys exist only in the backend environment (Render / `backend/.env`). Nothing secret goes in a `NEXT_PUBLIC_` variable.

## Environment variables (names only)

- Backend: `PORT`, `SUPABASE_URL`, `SUPABASE_KEY` (service role key), `GROQ_API_KEY`, `GEMINI_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`. Optional: `GROQ_FAST_MODEL`, `GROQ_SMART_MODEL`, `GEMINI_MODEL`.
- Backend, planned: `GMAIL_USER`, `GMAIL_APP_PASSWORD` - for sending emails from an OrbitAI Gmail account. Render's free plan blocks SMTP, so Gmail must be used through the Gmail API over HTTPS, not nodemailer/SMTP. The old Gmail code is kept on the local branch `backup/gmail-email`.
- Frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `emailService.js` creates the Resend client at startup, so the backend will not start without `RESEND_API_KEY`.

## Deploying

- Pushing to `main` deploys both sides: Render (backend, auto-deploy on) and Vercel (frontend).
- If Vercel marks a production deployment "Staged", it is not live. Promote it in Vercel > Deployments.
- Database changes (SQL) must be run in Supabase before pushing code that needs them.

## Git and secrets rules

- Never open, read, print or edit any `.env` or `.env.local` file.
- Work on a new branch for every change. Never commit directly to `main`.
- Never push without Atharva saying so explicitly in the current conversation.
- Never use `git add .` or `git add -A`. Add the specific files that belong to the change.
- Never commit anything under `automation/n8n/n8n-data/`, and never commit `frontend/.cursorrules` changes unless asked.
- Never force-push, rewrite history, or delete files without asking first.

## Running locally

- Backend: `cd backend`, `npm install`, `npm start` (port 4000).
- Frontend: `cd frontend`, `npm install`, `npm run dev` (port 3000).
- Health check: `GET /health` returns `{ "status": "ok" }`.