# FlowAI

A workflow automation platform where you describe automations in plain English and an LLM schedules and executes them for you.

---

## How It Works

1. **Describe** — Type something like "every morning at 9am send a Discord message saying good morning"
2. **Parse** — GPT-4o (via GitHub Models) reads your input and generates a structured workflow config with a cron expression, action type, and action parameters
3. **Confirm** — Review the parsed config before saving
4. **Schedule** — The workflow is saved to PostgreSQL and picked up by the cron scheduler (or waits for an inbound webhook event)
5. **Execute** — At the scheduled time, the appropriate executor runs (Discord, Email, or HTTP webhook)
6. **Log** — Results stream back to the UI in real time via Socket.io

---

## Architecture

```
flowai/
├── server/
│   ├── index.js                  # Express app entry point
│   ├── prisma/
│   │   └── schema.prisma         # workflows + execution_logs tables
│   ├── routes/
│   │   ├── workflows.js          # CRUD, toggle, run now
│   │   └── hooks.js              # Inbound webhook triggers
│   ├── services/
│   │   ├── llm-parser.js         # GPT-4o / Gemini intent parsing
│   │   ├── scheduler.js          # node-cron job management
│   │   └── socket.js             # Socket.io real-time log emission
│   └── executors/
│       ├── discord.js            # Discord webhook POST
│       ├── email.js              # SMTP / Gmail send
│       └── webhook.js            # Generic HTTP POST
└── client/
    └── src/
        ├── pages/
        │   ├── Home.tsx          # Input → parse → confirm flow
        │   ├── Dashboard.tsx     # Workflow list, toggle, run, detail
        │   └── Logs.tsx          # Real-time execution log stream
        └── ...
```

### Request flow

```
User input (plain English)
        |
        v
POST /api/workflows
        |
        v
llm-parser.js  -->  GPT-4o (GitHub Models)
                         |
                    [fallback] Gemini
        |
        v
Parsed config saved to PostgreSQL
        |
        +-----> cron trigger: node-cron schedules job
        |
        +-----> webhook trigger: waits for POST /hooks/:token
        |
        v
Executor runs (discord / email / webhook)
        |
        v
Result written to execution_logs
        |
        v
Socket.io emits log to connected clients
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| Database | PostgreSQL, Prisma ORM |
| Frontend | React, Vite, Tailwind CSS |
| LLM (primary) | GPT-4o via GitHub Models API |
| LLM (fallback) | Google Gemini |
| Scheduling | node-cron |
| Real-time | Socket.io |
| Deployment | Render |

---

## Action Types

- **Discord** — POST to a Discord webhook URL with a message body
- **Email** — Send via SMTP (Gmail or any SMTP server)
- **Webhook** — HTTP POST to any URL with a custom payload

## Trigger Types

- **Cron schedule** — Time-based, e.g. `0 9 * * *` for every day at 9am
- **Inbound webhook** — Event-driven; a unique URL (`/hooks/:token`) triggers the workflow on demand

---

## API Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/workflows` | Parse input with LLM and save workflow |
| `GET` | `/api/workflows` | List all workflows |
| `PATCH` | `/api/workflows/:id/toggle` | Activate or deactivate a workflow |
| `POST` | `/api/workflows/:id/run` | Execute a workflow immediately |
| `DELETE` | `/api/workflows/:id` | Delete a workflow |
| `GET` | `/api/workflows/:id/logs` | Fetch execution history for a workflow |
| `POST` | `/hooks/:token` | Inbound webhook trigger |

---

## Setup

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL) or an existing PostgreSQL instance
- A GitHub personal access token with access to GitHub Models
- (Optional) A Google Gemini API key

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/flowai.git
   cd flowai
   ```

2. Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example server/.env
   ```

3. Start PostgreSQL:
   ```bash
   docker compose up -d
   ```

4. Install backend dependencies and push the database schema:
   ```bash
   cd server
   npm install
   npx prisma db push
   ```

5. Install frontend dependencies:
   ```bash
   cd ../client
   npm install
   ```

6. Start the backend:
   ```bash
   cd ../server
   node index.js
   ```

7. Start the frontend (in a separate terminal):
   ```bash
   cd client
   npm run dev
   ```

8. Open [http://localhost:5173](http://localhost:5173)

### Environment Variables

Create `server/.env` with the following:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/flowai

# GitHub personal access token (for GitHub Models / GPT-4o)
GITHUB_TOKEN=your_github_pat

# Google Gemini API key (optional, used as LLM fallback)
GEMINI_API_KEY=your_gemini_api_key

# Default Discord webhook URL for testing
DISCORD_TEST_WEBHOOK=https://discord.com/api/webhooks/...

# SMTP configuration for email actions
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## Deploy to Render

1. Push the repository to GitHub.
2. Create a new project on [Render](https://render.com) and connect your repository.
3. Render will detect the `render.yaml` blueprint and auto-configure the web service and a managed PostgreSQL instance.
4. Set your secret environment variables (`GITHUB_TOKEN`, `GEMINI_API_KEY`, `DISCORD_TEST_WEBHOOK`, SMTP credentials) in the Render dashboard under **Environment**.
5. Deploy.

---

## License

MIT
