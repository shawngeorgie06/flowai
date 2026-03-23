# FlowAI Frontend Design Spec

## Overview

Three-view React + Vite + Tailwind frontend for FlowAI. Utilitarian style: black, white, gray. Color only for functional status (green/red). No gradients, no decorative elements.

## Stack

- React 18 + Vite
- Tailwind CSS
- React Router (3 routes)
- Socket.io client (real-time logs)

## Views

### Home (`/`)

Single-purpose: user types plain English, gets parsed JSON back, confirms or cancels.

- **Nav bar**: logo left ("FlowAI", text only), three links right (Home, Dashboard, Logs). Active link is bold black, others gray.
- **Heading**: "New automation" — 18px, medium weight.
- **Subtext**: "Describe what should happen, in plain English." — 13px gray.
- **Input**: Large textarea-style input. White background, 1px gray border, generous padding (14px). Placeholder text shows an example.
- **Button**: "Build Automation" — black background, white text, below the input.
- **Parsed result** (shown after LLM responds):
  - Box with light gray header ("Parsed config") and a "Valid" or "Error" tag.
  - Monospace JSON body.
  - Footer with "Confirm & Create" (black) and "Cancel" (outlined) buttons.
- **Loading state**: Button text changes to "Parsing..." and disables during LLM call.
- **Error state**: If LLM returns `{ error }`, show the error message in red text below the input. No parsed box.

### Dashboard (`/dashboard`)

List of all workflows with toggle control.

- **Header row**: "Workflows" left, count right (e.g. "3 total").
- **Workflow rows**: Each row shows:
  - Name (bold, 13px)
  - Description (gray, 11px, truncated)
  - Cron expression (monospace, fixed width)
  - Toggle switch (black = on, gray = off)
  - "logs" link → navigates to `/workflows/:id/logs`
- **Empty state**: "No workflows yet. Create one from the Home page." with a link.
- **Delete**: Small trash icon or "delete" text link on each row. Confirms with browser `confirm()` dialog.

### Logs (`/workflows/:id/logs`)

Per-workflow execution log stream.

- **Header**: Workflow name with green pulsing dot (indicates live connection). Cron expression and execution count below.
- **Log rows**: Each row shows:
  - Status dot (green circle = success, red = failure)
  - Timestamp (monospace, `YYYY-MM-DD HH:mm:ss`)
  - Status text ("success" in green, "failure" in red)
  - Output message (monospace, gray)
- **Real-time**: New logs prepend to the top via Socket.io. Join room `workflow:{id}` on mount, leave on unmount.
- **Empty state**: "No executions yet. This workflow will run on its next scheduled time."

## API Integration

All calls to `http://localhost:3000/api/workflows` (configurable via env var).

- `POST /api/workflows` with `{ input }` → parse step (returns `{ parsed, confirmed: false }`)
- `POST /api/workflows` with `{ input, confirm: true }` → create step
- `GET /api/workflows` → dashboard list
- `PATCH /api/workflows/:id/toggle` → toggle active
- `DELETE /api/workflows/:id` → delete
- `GET /api/workflows/:id/logs` → initial log load

## Socket.io

- Connect on app mount
- Logs page: `emit('join-workflow', id)` on mount, `emit('leave-workflow', id)` on unmount
- Listen for `execution-log` event, prepend to log list

## Design Tokens (Tailwind)

- Background: `white` / `gray-50` for subtle sections
- Text primary: `gray-900`
- Text secondary: `gray-500`
- Borders: `gray-200`
- Success: `green-500` (dots), `green-800` (text)
- Failure: `red-500` (dots), `red-600` (text)
- Buttons: `bg-gray-900 text-white` (primary), `border border-gray-300 text-gray-700` (secondary)
- Font: system font stack, monospace for code/cron/logs
- No border-radius larger than 6px. Mostly 4px.

## File Structure

```
client/
  src/
    components/
      Navbar.jsx
    pages/
      Home.jsx
      Dashboard.jsx
      Logs.jsx
    lib/
      api.js
      socket.js
    App.jsx
    main.jsx
  index.html
  vite.config.js
  tailwind.config.js
  postcss.config.js
```
