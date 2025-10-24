'use client';

import { useSocket } from './useSocket';
import { useState } from 'react';

/**
 * Example component demonstrating how to use the socket service
 * for text-to-speech functionality
 */
export default function TextToSpeechExample() {
  const [text, setText] = useState('');
  const { isConnected, isLoading, error, connect, disconnect, sendTextToSpeech, clearError } = useSocket({
    autoConnect: false, // Manual connection
    autoPlayAudio: true // Auto-play audio when received
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      sendTextToSpeech(text);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Text to Speech</h2>
      
      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Connection Controls */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={connect}
          disabled={isConnected}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Connect
        </button>
        <button
          onClick={disconnect}
          disabled={!isConnected}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Disconnect
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex justify-between items-start">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-700 font-bold ml-2">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Text Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="text" className="block text-sm font-medium mb-2">
            Enter text to convert to speech:
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            disabled={!isConnected}
          />
        </div>

        <button
          type="submit"
          disabled={!isConnected || isLoading || !text.trim()}
          className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Converting...
            </span>
          ) : (
            '🔊 Convert to Speech'
          )}
        </button>
      </form>

      {/* Usage Instructions */}
      <div className="mt-6 text-xs text-gray-600">
        <p className="mb-2">💡 <strong>How to use:</strong></p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Click "Connect" to connect to the socket server</li>
          <li>Type your text in the input field</li>
          <li>Click "Convert to Speech" to hear your text</li>
          <li>Audio will play automatically when ready</li>
        </ol>
      </div>
    </div>
  );
}
