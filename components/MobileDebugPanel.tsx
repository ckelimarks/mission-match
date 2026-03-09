'use client';

import { useState, useEffect } from 'react';
import { X, Bug } from 'lucide-react';

interface LogEntry {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: number;
}

export default function MobileDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});

  useEffect(() => {
    // Intercept console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const addLog = (type: LogEntry['type'], ...args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      setLogs(prev => [...prev.slice(-50), { type, message, timestamp: Date.now() }]);
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', ...args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', ...args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', ...args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', ...args);
    };

    // Self-test: Verify console interception is working
    console.log('[DEBUG-PANEL] Console interception active at', new Date().toLocaleTimeString());

    // Read localStorage
    const readLocalStorage = () => {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key) || '';
        }
      }
      setLocalStorageData(data);
    };

    readLocalStorage();
    const interval = setInterval(readLocalStorage, 1000);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      clearInterval(interval);
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center z-50"
        title="Open Debug Panel"
      >
        <Bug className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 text-white z-50 overflow-auto p-4 font-mono text-xs">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-black pb-2">
        <h2 className="text-sm font-bold text-purple-400">🐛 Debug Panel</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-purple-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* LocalStorage */}
      <div className="mb-6">
        <h3 className="text-purple-400 font-bold mb-2">📦 LocalStorage</h3>
        <div className="bg-gray-900 p-2 rounded space-y-1">
          {Object.keys(localStorageData).length === 0 ? (
            <div className="text-gray-500">Empty</div>
          ) : (
            Object.entries(localStorageData).map(([key, value]) => (
              <div key={key} className="border-b border-gray-800 pb-1">
                <span className="text-yellow-400">{key}:</span>
                <div className="text-green-400 ml-2 break-all">{value || 'null'}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Console Logs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-purple-400 font-bold">📝 Console ({logs.length})</h3>
          <button
            onClick={() => setLogs([])}
            className="text-xs text-gray-400 hover:text-white"
          >
            Clear
          </button>
        </div>
        <div className="bg-gray-900 p-2 rounded space-y-2 max-h-96 overflow-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet</div>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className={`p-1.5 rounded border-l-2 ${
                  log.type === 'error'
                    ? 'bg-red-950 border-red-500 text-red-200'
                    : log.type === 'warn'
                    ? 'bg-yellow-950 border-yellow-500 text-yellow-200'
                    : log.type === 'info'
                    ? 'bg-blue-950 border-blue-500 text-blue-200'
                    : 'bg-gray-800 border-gray-600 text-gray-200'
                }`}
              >
                <div className="text-[10px] text-gray-400 mb-1">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <pre className="whitespace-pre-wrap break-all">{log.message}</pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
