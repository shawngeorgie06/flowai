import { Router } from 'express';
import { executeWorkflowNow } from '../services/scheduler.js';

const router = Router();

// POST /hooks/:token — inbound webhook trigger
router.post('/:token', async (req, res) => {
  const prisma = req.app.get('prisma');
  const { token } = req.params;

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { webhookToken: token },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (!workflow.active) {
      return res.status(403).json({ error: 'Workflow is inactive' });
    }

    const log = await executeWorkflowNow(workflow, prisma);
    return res.json({ triggered: true, log });
  } catch (err) {
    console.error('Webhook trigger failed:', err);
    return res.status(500).json({ error: 'Failed to execute workflow' });
  }
});

export default router;
