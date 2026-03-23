export async function executeDiscord(config) {
  const { message } = config;
  const webhook_url = config.webhook_url && config.webhook_url !== 'NEEDS_CONFIG'
    ? config.webhook_url
    : process.env.DISCORD_TEST_WEBHOOK;

  if (!webhook_url) {
    return {
      success: false,
      output: null,
      error: 'Discord webhook URL not configured. Set DISCORD_TEST_WEBHOOK in .env or provide a URL in the prompt.',
    };
  }

  const response = await fetch(webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message }),
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      success: false,
      output: null,
      error: `Discord API error (${response.status}): ${body}`,
    };
  }

  return {
    success: true,
    output: `Message sent: "${message}"`,
    error: null,
  };
}
