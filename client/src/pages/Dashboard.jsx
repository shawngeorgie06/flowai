import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWorkflows, toggleWorkflow, deleteWorkflow, runWorkflow } from '../lib/api';
import Toast from '../components/Toast';

export default function Dashboard() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getWorkflows().then((data) => {
      setWorkflows(data);
      setLoading(false);
    });
  }, []);

  async function handleToggle(id) {
    const current = workflows.find(w => w.id === id);
    await toggleWorkflow(id);
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    );
    setToast({ message: current?.active ? 'Workflow paused' : 'Workflow activated', type: 'success' });
  }

  async function handleRun(id) {
    setRunningId(id);
    try {
      const result = await runWorkflow(id);
      setToast({ message: result.status === 'success' ? 'Workflow executed successfully' : `Execution failed: ${result.error || 'unknown error'}`, type: result.status === 'success' ? 'success' : 'error' });
    } catch {
      setToast({ message: 'Failed to run workflow', type: 'error' });
    } finally {
      setRunningId(null);
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Delete this workflow?')) {
      await deleteWorkflow(id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      setToast({ message: 'Workflow deleted', type: 'success' });
    }
  }

  return (
    <div className="max-w-3xl mx-auto pt-8 px-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <span className="text-base font-medium text-gray-900">Workflows</span>
        <span className="text-sm text-gray-400">{workflows.length} total</span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 pt-12 text-center">Loading...</p>
      ) : workflows.length === 0 ? (
        <p className="text-sm text-gray-400 pt-12 text-center">
          No workflows yet.{' '}
          <Link to="/" className="underline">
            Create one
          </Link>
        </p>
      ) : (
        <div>
          {workflows.map((workflow, index) => (
            <div key={workflow.id}>
              <div className={`py-3 ${index < workflows.length - 1 || expandedId === workflow.id ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-center">
                  <span
                    className="font-medium text-sm text-gray-900 w-40 truncate cursor-pointer hover:underline flex-shrink-0"
                    onClick={() => setExpandedId(expandedId === workflow.id ? null : workflow.id)}
                  >
                    {workflow.name}
                  </span>
                  <span className="text-xs text-gray-500 flex-1 truncate hidden sm:block">
                    {workflow.description}
                  </span>
                  {workflow.triggerType === 'webhook' ? (
                    <span
                      className="font-mono text-xs text-gray-600 w-48 truncate text-center cursor-pointer hover:text-gray-900 hidden sm:block"
                      title="Click to copy webhook URL"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/hooks/${workflow.webhookToken}`);
                        setToast({ message: 'Webhook URL copied', type: 'success' });
                      }}
                    >
                      /hooks/{workflow.webhookToken?.slice(0, 8)}... <span className="text-gray-400">copy</span>
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-gray-600 w-24 text-center hidden sm:block">
                      {workflow.cronExpression}
                    </span>
                  )}
                  <div className="flex items-center gap-3 ml-auto">
                    <button
                      onClick={() => handleToggle(workflow.id)}
                      className={`w-8 h-[18px] rounded-full relative cursor-pointer flex-shrink-0 ${
                        workflow.active ? 'bg-gray-900' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute w-3.5 h-3.5 bg-white rounded-full top-[2px] transition-all ${
                          workflow.active ? 'left-[14px]' : 'left-[2px]'
                        }`}
                      />
                    </button>
                    {runningId === workflow.id ? (
                      <span className="text-xs text-gray-400">running...</span>
                    ) : (
                      <span
                        onClick={() => handleRun(workflow.id)}
                        className="text-xs text-gray-500 hover:text-gray-900 cursor-pointer"
                      >
                        run
                      </span>
                    )}
                    <Link
                      to={`/workflows/${workflow.id}/logs`}
                      className="text-xs text-gray-500 underline underline-offset-2"
                    >
                      logs
                    </Link>
                    <span
                      onClick={() => handleDelete(workflow.id)}
                      className="text-xs text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      delete
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate mt-1 sm:hidden">{workflow.description}</p>
              </div>
              {expandedId === workflow.id && (
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs">
                  <div className="grid grid-cols-2 gap-y-2 gap-x-8 max-w-lg">
                    <span className="text-gray-400">Type</span>
                    <span className="text-gray-700">{workflow.triggerType === 'webhook' ? 'Webhook trigger' : 'Scheduled (cron)'}</span>

                    {workflow.triggerType === 'cron' && (
                      <>
                        <span className="text-gray-400">Schedule</span>
                        <span className="text-gray-700 font-mono">{workflow.cronExpression}</span>
                      </>
                    )}

                    {workflow.triggerType === 'webhook' && (
                      <>
                        <span className="text-gray-400">Webhook URL</span>
                        <span className="text-gray-700 font-mono break-all">{window.location.origin}/hooks/{workflow.webhookToken}</span>
                      </>
                    )}

                    <span className="text-gray-400">Action</span>
                    <span className="text-gray-700">{workflow.parsedConfig?.action?.type || 'unknown'}</span>

                    <span className="text-gray-400">Created</span>
                    <span className="text-gray-700">{new Date(workflow.createdAt).toLocaleDateString()}</span>
                  </div>

                  <details className="mt-3">
                    <summary className="text-gray-400 cursor-pointer hover:text-gray-600">Raw config</summary>
                    <pre className="mt-2 p-3 bg-white rounded border border-gray-100 font-mono text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(workflow.parsedConfig, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
