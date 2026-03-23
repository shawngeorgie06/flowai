import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`px-4 py-2.5 rounded text-sm shadow-lg ${
        type === 'success' ? 'bg-gray-900 text-white' :
        type === 'error' ? 'bg-red-600 text-white' :
        'bg-gray-900 text-white'
      }`}>
        {message}
      </div>
    </div>
  );
}
