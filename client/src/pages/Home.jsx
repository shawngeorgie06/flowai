import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseWorkflow, confirmWorkflow } from '../lib/api.js';
import Toast from '../components/Toast';

export default function Home() {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setParsed(null);
    try {
      const data = await parseWorkflow(input);
      if (data.error) {
        setError(data.error);
      } else if (data.parsed) {
        setParsed(data.parsed);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    const result = await confirmWorkflow(input);
    if (result.triggerType === 'webhook') {
      setCreated(result);
    } else {
      navigate('/dashboard');
    }
  }

  function handleCancel() {
    setParsed(null);
  }

  function formatSummary(parsed) {
    if (!parsed) return '';

    const trigger = parsed.trigger === 'webhook'
      ? 'When webhook is received'
      : parsed.cron ? `Schedule: ${parsed.cron}` : 'On schedule';

    const actionType = parsed.action?.type || 'unknown';
    let actionDesc = '';

    if (actionType === 'discord') {
      actionDesc = `Send Discord message: "${parsed.action.config?.message || '...'}"`;
    } else if (actionType === 'email') {
      const to = parsed.action.config?.to || '...';
      const subject = parsed.action.config?.subject || '...';
      actionDesc = `Email ${to} — "${subject}"`;
    } else if (actionType === 'webhook') {
      const method = parsed.action.config?.method || 'POST';
      const url = parsed.action.config?.url || '...';
      actionDesc = `${method} ${url}`;
    }

    return `${trigger} → ${actionDesc}`;
  }

  return (
    <div className="max-w-2xl mx-auto pt-12 px-6">
      <h1 className="text-lg font-medium text-gray-900">Create an automation</h1>
      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
        Describe what you want to happen and when. FlowAI will parse your intent and set it up automatically.
      </p>

      <div className="flex gap-3 mt-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2]" />
          Discord
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-900" />
          Email
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          Webhook
        </div>
      </div>

      <textarea
        className="w-full mt-4 p-3.5 border border-gray-200 rounded text-sm text-gray-900 resize-none"
        rows={3}
        placeholder="e.g. every morning at 9am send a Discord message to my server saying good morning"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        className="mt-3 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading || input.trim() === ''}
      >
        {loading ? 'Parsing...' : 'Build Automation'}
      </button>

      {!parsed && !created && (
        <div className="mt-6">
          <p className="text-xs text-gray-400 mb-2">Or try a template:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'Every morning at 9am send a Discord message saying good morning team',
              'Every hour POST to https://example.com/health-check',
              'Every Monday at 8am email team@company.com with subject Weekly Standup Reminder',
              'When a webhook is received, send a Discord alert with the payload',
              'Every day at 6pm email me@example.com with subject Daily Summary',
            ].map((template) => (
              <button
                key={template}
                onClick={() => setInput(template)}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors"
              >
                {template.length > 50 ? template.slice(0, 50) + '...' : template}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {!created && parsed !== null && (
        <div className="mt-6 border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-500">Parsed config</span>
            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">Valid</span>
          </div>
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-900">{formatSummary(parsed)}</p>
          </div>
          <pre className="p-4 font-mono text-xs text-gray-700 whitespace-pre bg-white">
            {JSON.stringify(parsed, null, 2)}
          </pre>
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex gap-2">
            <button
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800"
              onClick={handleConfirm}
            >
              Confirm &amp; Create
            </button>
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {created && (
        <div className="mt-6 border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-500">Workflow created</span>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-700">Your webhook URL:</p>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 p-3 bg-gray-50 rounded font-mono text-xs text-gray-900 break-all">
                {window.location.origin}/hooks/{created.webhookToken}
              </code>
              <button
                className="px-3 py-2 text-xs border border-gray-200 rounded text-gray-500 hover:text-gray-900 hover:border-gray-400 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/hooks/${created.webhookToken}`);
                  setToast({ message: 'Copied to clipboard', type: 'success' });
                }}
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">POST to this URL to trigger your workflow.</p>
            <button
              className="mt-3 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
