# 🪐 OrbitAI: Autonomous Productivity Agent

OrbitAI is an intelligent, closed-loop productivity management system. Unlike traditional, static to-do lists, OrbitAI uses an autonomous AI agent to actively manage your goals, break down tasks, and track your progress in real-time. 

> **Current Status: Stable MVP v1.0** > This version prioritizes high stability and deterministic UI updates. Task completions are handled via a dedicated, blazing-fast API endpoint (`/tasks/complete`) to ensure the frontend stays perfectly in sync with the database, while the AI Agent processes heavier cognitive tasks in the background.

## 🚀 Key Features

* **Autonomous Agent Loop:** Powered by a custom `Observe -> Think -> Act -> Remember` architecture.
* **Dynamic Goal Management:** The AI interprets user intent to create goals and automatically generates prioritized task lists.
* **Deterministic UI Updates:** Fast, optimistic UI updates that won't glitch or revert, backed by solid REST endpoints.
* **Contextual Memory:** Uses Supabase to maintain long-term memory (`agent_memory`) of your completed tasks and active goals.
* **Automated Workflows (n8n):** Uses n8n for reliable scheduling, webhooks, and third-party integrations (like sending automated email reminders).
* **Real-Time Dashboard:** Built with Next.js, featuring visual progress bars and instant state syncing.

## 💻 Tech Stack

**Frontend (User Interface):**
* Next.js 16.1+ (App Router)
* TypeScript / TSX
* Tailwind CSS
* Deployed on Vercel

**Backend (The Brain):**
* Node.js & Express.js
* Google Gemini API (`gemini-1.5-flash`)
* Deployed on Render

**Database & Auth:**
* Supabase (PostgreSQL)

**Automation & Integrations:**
* **n8n:** Acts as the "hands and heartbeat" of the system, handling CRON job scheduling, webhook reception, and outbound email notifications.

## 🏗️ Architecture: How It Works

OrbitAI separates fast UI actions from deep AI thinking to maintain stability:
1. **Instant Actions:** When a user clicks a task circle, the frontend hits a dedicated Express endpoint. The database updates instantly, and the UI responds immediately.
2. **The Agent Loop:** For complex requests (like "Plan my week" or background processing), the system triggers the AI:
   * **Observe:** Fetches user state, active goals, and pending tasks from Supabase.
   * **Think:** Feeds the state to Gemini with strict JSON schemas to determine the next logical action.
   * **Act:** Executes database mutations or triggers n8n webhooks.
   * **Remember:** Logs the action into `agent_memory` for future context.

## ⚙️ Prerequisites

Before you begin, ensure you have the following:
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Git](https://git-scm.com/)
* A [Supabase](https://supabase.com/) account and project.
* A [Google Gemini API Key](https://aistudio.google.com/app/apikey).
* An instance of [n8n](https://n8n.io/) (Cloud or Self-hosted) for workflow automation.

## 🛠️ Local Installation & Setup

**1. Clone the repository**
```bash
git clone [https://github.com/yourusername/orbitai-agent-system.git](https://github.com/yourusername/orbitai-agent-system.git)
cd orbitai-agent-system
```
**2. Setup the Backend**
```
Bash
cd backend
npm install
```
**Create a .env file in the backend directory:**
Code snippet
* **PORT**=4000
* **SUPABASE_URL**=your_supabase_project_url
* **SUPABASE_SERVICE_KEY**=your_supabase_service_role_key
* **GEMINI_API_KEY**=your_gemini_api_key
* **N8N_WEBHOOK_URL**=your_n8n_webhook_url_for_emails

**Start the backend server:**
```Bash
npm start
```
# Server should run on http://localhost:4000
**3. Setup the Frontend**

Open a new terminal window and navigate to the frontend directory:

```Bash
cd frontend
npm install
```
**Create a .env.local file in the frontend directory:**
Code snippet:
* **NEXT_PUBLIC_API_URL**=http://localhost:4000
* **NEXT_PUBLIC_SUPABASE_URL**=your_supabase_project_url
* **NEXT_PUBLIC_SUPABASE_ANON_KEY**=your_supabase_anon_key

**Start the Next.js development server:**

```Bash
npm run dev
```
# Frontend should run on http://localhost:3000
