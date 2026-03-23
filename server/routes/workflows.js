import { Router } from 'express';
import { parseWorkflowInput } from '../services/llm-parser.js';
import { registerCronJob, cancelCronJob, executeWorkflowNow } from '../services/scheduler.js';

const router = Router();

// POST /api/workflows — parse with LLM, save to DB, register with scheduler
router.post('/', async (req, res) => {
  const prisma = req.app.get('prisma');
  const { input } = req.body;

  if (!input || typeof input !== 'string' || !input.trim()) {
    return res.status(400).json({ error: 'input is required' });
  }

  try {
    const parsed = await parseWorkflowInput(input.trim());

    if (parsed.error) {
      return res.status(422).json({ error: parsed.error, needsClarification: true });
    }

    // Return parsed config for user confirmation if confirm flag not set
    if (!req.body.confirm) {
      return res.json({ parsed, confirmed: false });
    }

    const isWebhookTrigger = parsed.trigger === 'webhook';
    const webhookToken = isWebhookTrigger ? crypto.randomUUID() : null;

    const workflow = await prisma.workflow.create({
      data: {
        name: parsed.name,
        description: input.trim(),
        plainTextInput: input.trim(),
        parsedConfig: parsed,
        cronExpression: parsed.cron || '',
        triggerType: isWebhookTrigger ? 'webhook' : 'cron',
        webhookToken,
        active: true,
      },
    });

    if (!isWebhookTrigger) {
      registerCronJob(workflow, prisma);
    }

    return res.status(201).json(workflow);
  } catch (err) {
    console.error('Failed to create workflow:', err);
    return res.status(500).json({ error: 'Failed to parse or create workflow' });
  }
});

// GET /api/workflows — return all workflows
router.get('/', async (req, res) => {
  const prisma = req.app.get('prisma');

  try {
    const workflows = await prisma.workflow.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(workflows);
  } catch (err) {
    console.error('Failed to fetch workflows:', err);
    return res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// PATCH /api/workflows/:id/toggle — activate or deactivate
router.patch('/:id/toggle', async (req, res) => {
  const prisma = req.app.get('prisma');
  const { id } = req.params;

  try {
    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const updated = await prisma.workflow.update({
      where: { id },
      data: { active: !workflow.active },
    });

    if (updated.active) {
      registerCronJob(updated, prisma);
    } else {
      cancelCronJob(id);
    }

    return res.json(updated);
  } catch (err) {
    console.error('Failed to toggle workflow:', err);
    return res.status(500).json({ error: 'Failed to toggle workflow' });
  }
});

// DELETE /api/workflows/:id — remove workflow and cancel cron job
router.delete('/:id', async (req, res) => {
  const prisma = req.app.get('prisma');
  const { id } = req.params;

  try {
    cancelCronJob(id);
    await prisma.workflow.delete({ where: { id } });
    return res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    console.error('Failed to delete workflow:', err);
    return res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// POST /api/workflows/:id/run — execute workflow immediately
router.post('/:id/run', async (req, res) => {
  const prisma = req.app.get('prisma');
  const { id } = req.params;

  try {
    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const log = await executeWorkflowNow(workflow, prisma);
    return res.json(log);
  } catch (err) {
    console.error('Failed to run workflow:', err);
    return res.status(500).json({ error: 'Failed to execute workflow' });
  }
});

// GET /api/workflows/:id/logs — return execution logs
router.get('/:id/logs', async (req, res) => {
  const prisma = req.app.get('prisma');
  const { id } = req.params;

  try {
    const logs = await prisma.executionLog.findMany({
      where: { workflowId: id },
      orderBy: { executedAt: 'desc' },
    });
    return res.json(logs);
  } catch (err) {
    console.error('Failed to fetch logs:', err);
    return res.status(500).json({ error: 'Failed to fetch execution logs' });
  }
});

export default router;
