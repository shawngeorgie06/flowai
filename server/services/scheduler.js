import cron from 'node-cron';
import { executeAction } from '../executors/index.js';
import { emitLogEntry } from './socket.js';

// Map of workflowId -> cron task
const activeCronJobs = new Map();

export async function loadActiveWorkflows(prisma) {
  const workflows = await prisma.workflow.findMany({
    where: { active: true, triggerType: 'cron' },
  });

  console.log(`Loading ${workflows.length} active workflow(s)`);

  for (const workflow of workflows) {
    registerCronJob(workflow, prisma);
  }
}

export function registerCronJob(workflow, prisma) {
  if (!workflow.cronExpression) return;

  // Cancel existing job if re-registering
  cancelCronJob(workflow.id);

  if (!cron.validate(workflow.cronExpression)) {
    console.error(`Invalid cron expression for workflow ${workflow.id}: ${workflow.cronExpression}`);
    return;
  }

  const task = cron.schedule(workflow.cronExpression, async () => {
    await executeWorkflowNow(workflow, prisma);
  });

  activeCronJobs.set(workflow.id, task);
  console.log(`Registered cron job for "${workflow.name}" [${workflow.cronExpression}]`);
}

export async function executeWorkflowNow(workflow, prisma) {
  console.log(`Executing workflow: ${workflow.name} (${workflow.id})`);
  const config = workflow.parsedConfig;

  try {
    const result = await executeAction(config.action);

    const log = await prisma.executionLog.create({
      data: {
        workflowId: workflow.id,
        status: result.success ? 'success' : 'failure',
        output: result.output,
        error: result.error,
      },
    });

    emitLogEntry(workflow.id, log);
    return log;
  } catch (err) {
    const log = await prisma.executionLog.create({
      data: {
        workflowId: workflow.id,
        status: 'failure',
        error: err.message,
      },
    });

    emitLogEntry(workflow.id, log);
    return log;
  }
}

export function cancelCronJob(workflowId) {
  const existing = activeCronJobs.get(workflowId);
  if (existing) {
    existing.stop();
    activeCronJobs.delete(workflowId);
  }
}
