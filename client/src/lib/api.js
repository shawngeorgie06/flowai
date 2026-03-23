const BASE = '/api/workflows';

export async function parseWorkflow(input) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  return res.json();
}

export async function confirmWorkflow(input) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, confirm: true }),
  });
  return res.json();
}

export async function getWorkflows() {
  const res = await fetch(BASE);
  return res.json();
}

export async function toggleWorkflow(id) {
  const res = await fetch(`${BASE}/${id}/toggle`, { method: 'PATCH' });
  return res.json();
}

export async function deleteWorkflow(id) {
  await fetch(`${BASE}/${id}`, { method: 'DELETE' });
}

export async function getWorkflowLogs(id) {
  const res = await fetch(`${BASE}/${id}/logs`);
  return res.json();
}

export async function runWorkflow(id) {
  const res = await fetch(`${BASE}/${id}/run`, { method: 'POST' });
  return res.json();
}
