import { executeDiscord } from './discord.js';
import { executeEmail } from './email.js';
import { executeWebhook } from './webhook.js';

const executors = {
  discord: executeDiscord,
  email: executeEmail,
  webhook: executeWebhook,
};

export async function executeAction(action) {
  const executor = executors[action.type];

  if (!executor) {
    return {
      success: false,
      output: null,
      error: `Unknown action type: ${action.type}`,
    };
  }

  try {
    return await executor(action.config);
  } catch (err) {
    return {
      success: false,
      output: null,
      error: `Executor crashed: ${err.message}`,
    };
  }
}
