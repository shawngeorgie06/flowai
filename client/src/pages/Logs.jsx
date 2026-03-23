import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWorkflows, getWorkflowLogs } from '../lib/api.js';
import socket from '../lib/socket.js';

export default function Logs() {
  const { id } = useParams();
  const [workflow, setWorkflow] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const workflows = await getWorkflows();
      const found = workflows.find((w) => String(w.id) === String(id));
      setWorkflow(found || null);

      const fetchedLogs = await getWorkflowLogs(id);
      setLogs(fetchedLogs);

      setLoading(false);
    }

    init();

    socket.emit('join-workflow', id);

    socket.on('execution-log', (log) => {
      setLogs((prev) => [log, ...prev]);
    });

    return () => {
      socket.emit('leave-workflow', id);
      socket.off('execution-log');
    };
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto pt-8 px-6">
      {loading ? (
        <p className="text-sm text-gray-400 pt-12 text-center">Loading...</p>
      ) : (
        <>
          <Link to="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">
            ← Back to Dashboard
          </Link>

          {workflow && (
            <div className="pb-4 border-b border-gray-200 mt-4">
              <p className="text-base font-medium text-gray-900">
                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse" />
                {workflow.name}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                {workflow.cronExpression} · {logs.length} execution(s)
              </p>
            </div>
          )}

          {logs.length === 0 ? (
            <p className="text-sm text-gray-400 pt-12 text-center">
              No executions yet. This workflow will run on its next scheduled time.
            </p>
          ) : (
            <div className="mt-2">
              {logs.map((log, i) => (
                <div key={log.id ?? i} className="flex items-start py-2.5 border-b border-gray-50 gap-3">
                  <span
                    className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                      log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="font-mono text-xs text-gray-400 w-36 shrink-0">
                    {new Date(log.executedAt).toISOString().replace('T', ' ').slice(0, 19)}
                  </span>
                  <span
                    className={`text-xs font-medium w-14 shrink-0 ${
                      log.status === 'success' ? 'text-green-800' : 'text-red-600'
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="font-mono text-xs text-gray-500">
                    {log.output || log.error || ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
