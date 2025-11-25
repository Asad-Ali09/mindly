'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Volume2, FileText, Link as LinkIcon, Pause, Play } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: {
    type: 'link' | 'document' | 'audio';
    url?: string;
    title?: string;
    audioUrl?: string;
  }[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI learning assistant. How can I help you today?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a simulated response. The AI will provide helpful information based on your question.',
        timestamp: new Date(),
        attachments: [
          {
            type: 'link',
            url: 'https://example.com',
            title: 'Related Resource'
          },
          {
            type: 'document',
            url: 'https://example.com/doc.pdf',
            title: 'Study Guide.pdf'
          },
          {
            type: 'audio',
            audioUrl: '/audio/sample.mp3',
            title: 'Audio Explanation'
          }
        ]
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleAudio = (audioUrl: string, messageId: string) => {
    if (playingAudio === messageId) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      setPlayingAudio(messageId);
      audioRef.current.onended = () => setPlayingAudio(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--night)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--rust)]">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Chat Assistant</h1>
          <p className="text-sm text-gray-400">Ask me anything about your learning journey</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'user' ? (
                <div className="max-w-[80%] rounded-2xl px-6 py-4 bg-[var(--rust)] text-white">
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs mt-2 text-gray-200">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ) : (
                <div className="max-w-[80%] space-y-3">
                  {/* Message Content - No box */}
                  <div className="whitespace-pre-wrap break-words text-gray-100">
                    {message.content}
                  </div>

                  {/* Attachments - With boxes */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="space-y-2">
                      {message.attachments.map((attachment, idx) => (
                        <div key={idx}>
                          {attachment.type === 'link' && (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-[var(--darker)] hover:bg-gray-800 rounded-lg transition-colors group border border-gray-800"
                            >
                              <LinkIcon className="w-4 h-4 text-[var(--rust)] flex-shrink-0" />
                              <span className="text-sm text-gray-300 group-hover:text-white truncate">
                                {attachment.title}
                              </span>
                            </a>
                          )}

                          {attachment.type === 'document' && (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-[var(--darker)] hover:bg-gray-800 rounded-lg transition-colors group border border-gray-800"
                            >
                              <FileText className="w-4 h-4 text-[var(--rust)] flex-shrink-0" />
                              <span className="text-sm text-gray-300 group-hover:text-white truncate">
                                {attachment.title}
                              </span>
                            </a>
                          )}

                          {attachment.type === 'audio' && (
                            <button
                              onClick={() => toggleAudio(attachment.audioUrl!, message.id)}
                              className="flex items-center gap-2 p-3 bg-[var(--darker)] hover:bg-gray-800 rounded-lg transition-colors group w-full border border-gray-800"
                            >
                              {playingAudio === message.id ? (
                                <Pause className="w-4 h-4 text-[var(--rust)] flex-shrink-0" />
                              ) : (
                                <Play className="w-4 h-4 text-[var(--rust)] flex-shrink-0" />
                              )}
                              <Volume2 className="w-4 h-4 text-[var(--rust)] flex-shrink-0" />
                              <span className="text-sm text-gray-300 group-hover:text-white">
                                {attachment.title}
                              </span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[var(--darker)] border border-gray-800 rounded-2xl px-6 py-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-[var(--darker)] px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            {/* Attachment Button */}
            <button
              className="p-3 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:border-[var(--rust)] focus:outline-none resize-none max-h-32 min-h-[48px] scrollbar-hide overflow-y-auto"
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '48px',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-3 bg-[var(--rust)] hover:bg-[#a33209] disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Helper Text */}
          <div className="mt-2 text-center text-xs text-gray-500">
            Press Enter to send, Shift + Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
