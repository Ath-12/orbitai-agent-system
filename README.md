# OrbitAI

OrbitAI is a goal manager with an AI agent built in. You type a goal, the AI writes a short task list for it, and the dashboard tracks your progress until the goal is done. Each time you run the agent, it looks at where you stand, picks one useful action (suggest the next task, reschedule, set a reminder, add more tasks), carries it out, and remembers what it did.

**Live app:** https://orbitai-agent-system-ath12.vercel.app

## Features

- **Goals with auto-generated task lists.** Type a goal and the AI writes 3–7 concrete tasks for it, marked high, medium or low priority.
- **Progress bar.** Shows how many of the goal's tasks are done ("3 of 5 tasks done – 60%").
- **Complete goal / New goal.** Finish a goal yourself at any time, or start a new one (the current goal is saved as "replaced"). Completing the last task completes the goal automatically.
- **Goal history.** Finished and replaced goals are listed with their date and how many tasks were done.
- **Agent actions.** Type a message or press **Run Agent**, and the agent chooses one action:
  - **Next task:** recommends the highest-priority pending task.
  - **Reschedule:** "I can't do this today" moves the top task to tomorrow and adds a small 5-minute review task.
  - **Reminders:** "Remind me to …" saves a reminder, shown under *Upcoming Reminders*.
  - **More tasks:** writes additional tasks for the current goal.
  - It politely declines requests to write code and off-topic messages.
- **Daily reminder emails.** Once a day, each user with pending tasks gets an email with how many tasks are waiting.
- **Focus / All view** for tasks, a **memory stream** of recent agent notes, and a **light/dark theme**.
- **Sign up and log in** with email and password (with email confirmation).

## How the agent works

Each run follows four steps (`backend/src/agent/`):

1. **Observe** (`observe.js`): loads the open goal, its pending tasks (sorted high → medium → low), progress, upcoming reminders, and recent memory notes from this goal.
2. **Think** (`think.js`): sends your latest message and that context to an AI model, which must answer in a fixed JSON format with exactly one action. If the action is "create tasks", a second, stronger model writes the task list.
3. **Act** (`act.js`): performs the action in the database, such as picking the next task, rescheduling, saving a reminder or inserting new tasks.
4. **Remember** (`remember.js`): logs the run in `agent_runs` and saves a short note in `agent_memory`, which later runs use as context.

## AI models

All AI calls go through one file, `backend/src/services/llm.js`, which tries models in order until one answers:

| Used for | 1st choice | 2nd choice | Last fallback |
|---|---|---|---|
| Decisions (which action to take) | Groq `openai/gpt-oss-20b` | Groq `openai/gpt-oss-120b` | Gemini |
| Task lists (what you keep) | Groq `openai/gpt-oss-120b` | Groq `openai/gpt-oss-20b` | Gemini |

Groq answers are forced into a strict JSON schema, and every answer is also checked in code before it is used. If a provider's API key is missing, that provider is skipped.

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS, deployed on Vercel
- **Backend:** Node.js + Express, deployed on Render
- **Database and login:** Supabase (PostgreSQL + Supabase Auth)
- **AI:** Groq (main), Google Gemini (fallback)
- **Email:** Resend

## Security

- **Row Level Security** is on for every table. Only the backend, using the Supabase service key, can read or write data. The frontend uses Supabase only for login.
- **Every data request is checked.** The frontend sends the user's Supabase login token, and the backend verifies it (`middleware/requireUser.js`). The user id always comes from the verified token, never from the request.
- **The scheduler endpoint is protected.** `POST /notifications/daily-reminders` only runs when the request carries the correct `x-cron-secret` header (`middleware/requireCronSecret.js`).
- Secret keys live only in the backend environment. Nothing secret is sent to the browser.

## API endpoints

| Method | Path | Access | What it does |
|---|---|---|---|
| GET | `/health` | public | Returns `{ "status": "ok" }` |
| GET | `/agent/state/:userId` | login token | Goal, tasks, progress, reminders, memory (the id comes from the token) |
| POST | `/agent/run` | login token | Runs the agent; with no open goal, the message becomes a new goal |
| POST | `/goals` | login token | Starts a new goal and writes its tasks |
| POST | `/goals/current/complete` | login token | Completes the open goal |
| GET | `/goals/history` | login token | Lists ended goals |
| POST | `/tasks/:taskId/complete` | login token | Marks a task done; completes the goal if it was the last one |
| POST | `/notifications/daily-reminders` | `x-cron-secret` header | Sends the daily reminder emails |

## Project structure

```
backend/
  src/index.js, src/app.js   server start and routes
  src/routes/                agent, goal, task and notification endpoints
  src/controllers/           agent and notification logic
  src/middleware/            requireUser (login check), requireCronSecret
  src/agent/                 observe -> think -> act -> remember
  src/services/              llm (AI calls), goalService, emailService, supabaseClient, agentService
frontend/
  app/                       landing page, login, signup, auth callback, dashboard
  lib/api.ts                 backend client (attaches the login token)
  lib/supabase.ts            Supabase client (login only)
```

## Local setup

You need Node.js, Git, a Supabase project, a Resend account, and a Groq and/or Gemini API key.

The Supabase tables (`profiles`, `goals`, `tasks`, `reminders`, `agent_memory`, `agent_runs`) must already exist. The database schema is not included in this repository.

**1. Clone the repository**

```bash
git clone https://github.com/Ath-12/orbitai-agent-system.git
cd orbitai-agent-system
```

**2. Backend**

Create `backend/.env` with these variables (see `.env.example`):

- `PORT` (default 4000)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`: the service role (secret) key
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`: required, the backend will not start without it
- `CRON_SECRET`: a long random string
- Optional: `GROQ_FAST_MODEL`, `GROQ_SMART_MODEL`, `GEMINI_MODEL`

Then:

```bash
cd backend
npm install
npm start
```

The backend runs on http://localhost:4000. Check it at http://localhost:4000/health.

**3. Frontend**

In a second terminal, create `frontend/.env.local` with:

- `NEXT_PUBLIC_API_URL` (for local use: `http://localhost:4000`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the public anon key only

Then:

```bash
cd frontend
npm install
npm run dev
```

The app runs on http://localhost:3000.

**4. Scheduled reminders**

Daily reminder emails are triggered by an external cron service that calls `POST /notifications/daily-reminders` with the header `x-cron-secret` set to your `CRON_SECRET`.
