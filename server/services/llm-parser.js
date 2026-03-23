const SYSTEM_PROMPT = `You are a workflow automation parser. Given a plain English description, return ONLY valid JSON with this exact shape:

{
  "name": "string, short workflow name",
  "trigger": "cron" or "webhook",
  "cron": "valid cron expression or null if trigger is webhook",
  "action": {
    "type": "discord" | "email" | "webhook",
    "config": {
      // For discord: { "webhook_url": "string", "message": "string" }
      // For email: { "to": "string", "subject": "string", "body": "string" }
      // For webhook: { "url": "string", "method": "string", "payload": {} }
    }
  }
}

Rules:
- Return ONLY valid JSON, no markdown, no explanation, no code fences.
- If the user says "when I hit a webhook", "when something POSTs to a URL", "on incoming request", or similar event-driven language, set trigger to "webhook" and cron to null.
- If the user mentions a schedule or time (every hour, daily, at 9am, etc.), set trigger to "cron" and provide a valid cron expression.
- If the user mentions Discord, use action type "discord". If email/mail, use type "email". If outbound webhook/HTTP/API, use type "webhook".
- For discord, if no webhook_url is provided, set webhook_url to "NEEDS_CONFIG".
- For email, if SMTP details are missing, still return the config with what's available.
- For outbound webhook, default method to "POST" if not specified.
- Parse time expressions into valid cron expressions (e.g., "every morning at 9am" = "0 9 * * *").
- If the input is too ambiguous to parse, return: { "error": "description of what clarification is needed" }
- Never return anything outside of JSON.`;

async function parseWithGitHubModels(plainText) {
  const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: plainText },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub Models API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content.trim();
  return JSON.parse(raw);
}

async function parseWithGemini(plainText) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser input: ${plainText}` }] }],
        generationConfig: { temperature: 0.1 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const raw = data.candidates[0].content.parts[0].text.trim();
  // Strip markdown code fences if Gemini wraps them
  const cleaned = raw.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '');
  return JSON.parse(cleaned);
}

export async function parseWorkflowInput(plainText) {
  try {
    return await parseWithGitHubModels(plainText);
  } catch (err) {
    console.warn('GitHub Models failed, falling back to Gemini:', err.message);

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Primary LLM failed and no Gemini fallback configured');
    }

    return await parseWithGemini(plainText);
  }
}
