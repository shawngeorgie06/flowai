export async function executeWebhook(config) {
  const { url, method = 'POST', payload = {} } = config;

  if (!url) {
    return {
      success: false,
      output: null,
      error: 'Webhook URL not provided',
    };
  }

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(url, options);
  const body = await response.text();

  if (!response.ok) {
    return {
      success: false,
      output: null,
      error: `Webhook returned ${response.status}: ${body.slice(0, 500)}`,
    };
  }

  return {
    success: true,
    output: `Webhook ${method} ${url} → ${response.status}: ${body.slice(0, 500)}`,
    error: null,
  };
}
