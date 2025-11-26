'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, FileText, Download, AlertCircle } from 'lucide-react';
import { agentApi, ConversationMessage, FileAttachment } from '@/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: FileAttachment[];
  error?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI learning assistant. I can help you with your Google Classroom assignments, course materials, and more. Try asking me:\n• "What assignments do I have due tomorrow?"\n• "Show me the slides from my recent lecture"\n• "What\'s going on in my ICC Classroom?"',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Create a placeholder AI message for streaming
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
      // Build conversation history for context
      const history: ConversationMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      let streamedContent = '';
      let streamedFiles: FileAttachment[] = [];

      console.log('Starting stream with query:', input.trim());

      // Call the streaming agent API
      await agentApi.processQueryStream(
        {
          query: input.trim(),
          history,
        },
        (chunk) => {
          console.log('Received chunk:', chunk);
          
          if (chunk.type === 'content') {
            // Append new content
            streamedContent += chunk.content;
            setMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: streamedContent }
                  : msg
              )
            );
          } else if (chunk.type === 'files' && chunk.files) {
            // Add files to the message
            streamedFiles = chunk.files;
            setMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, files: streamedFiles }
                  : msg
              )
            );
          } else if (chunk.type === 'thinking') {
            // Optionally handle thinking indicator
            // You could show "Thinking..." or tool being used
            console.log('Agent thinking:', chunk.action);
          } else if (chunk.type === 'error') {
            throw new Error(chunk.error || 'Unknown error');
          }
        }
      );

      console.log('Stream completed. Content length:', streamedContent.length);

      // If no content was streamed, show error
      if (!streamedContent) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { 
                  ...msg, 
                  content: 'Sorry, I encountered an error processing your request. Please try again.',
                  error: true 
                }
              : msg
          )
        );
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error.message || 'Sorry, I couldn\'t connect to the server. Please make sure you\'re logged in and try again.';
      
      console.log('Setting error message:', errorMessage);
      
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { 
                ...msg, 
                content: errorMessage,
                error: true 
              }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileDownload = async (file: FileAttachment) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please log in to download files');
        return;
      }

      // Fetch the file with authentication
      const response = await fetch(file.downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      // Get the blob and create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--night)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--rust)]">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Chat Assistant</h1>
          <p className="text-sm text-gray-400">Powered by Google Gemini with Google Classroom integration</p>
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
                  {/* Message Content */}
                  {message.error && (
                    <div className="flex items-center gap-2 mb-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-semibold">Error</span>
                    </div>
                  )}
                  <div className={`prose prose-invert prose-sm max-w-none ${message.error ? 'text-red-400' : 'text-gray-100'}`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Style links
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            className="text-[var(--rust)] hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                        // Style code blocks
                        code: ({ node, inline, ...props }: any) =>
                          inline ? (
                            <code
                              {...props}
                              className="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-gray-200"
                            />
                          ) : (
                            <code
                              {...props}
                              className="block bg-gray-800 p-3 rounded-lg text-sm text-gray-200 overflow-x-auto"
                            />
                          ),
                        // Style lists
                        ul: ({ node, ...props }) => (
                          <ul {...props} className="list-disc list-inside space-y-1 my-2" />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol {...props} className="list-decimal list-inside space-y-1 my-2" />
                        ),
                        li: ({ node, ...props }) => (
                          <li {...props} className="ml-0" />
                        ),
                        // Style headings
                        h1: ({ node, ...props }) => (
                          <h1 {...props} className="text-xl font-bold mt-4 mb-2 text-white" />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 {...props} className="text-lg font-bold mt-3 mb-2 text-white" />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 {...props} className="text-base font-bold mt-2 mb-1 text-white" />
                        ),
                        // Style paragraphs
                        p: ({ node, ...props }) => (
                          <p {...props} className="mb-3 leading-relaxed" />
                        ),
                        // Style blockquotes
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            {...props}
                            className="border-l-4 border-[var(--rust)] pl-4 italic my-2 text-gray-300"
                          />
                        ),
                        // Style tables
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3">
                            <table {...props} className="min-w-full divide-y divide-gray-700 border border-gray-700 rounded" />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead {...props} className="bg-gray-800" />
                        ),
                        tbody: ({ node, ...props }) => (
                          <tbody {...props} className="divide-y divide-gray-700 bg-gray-900" />
                        ),
                        tr: ({ node, ...props }) => (
                          <tr {...props} className="hover:bg-gray-800/50" />
                        ),
                        th: ({ node, ...props }) => (
                          <th {...props} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300" />
                        ),
                        td: ({ node, ...props }) => (
                          <td {...props} className="px-4 py-2 text-sm" />
                        ),
                        // Style horizontal rules
                        hr: ({ node, ...props }) => (
                          <hr {...props} className="my-4 border-gray-700" />
                        ),
                        // Style strong/bold
                        strong: ({ node, ...props }) => (
                          <strong {...props} className="font-bold text-white" />
                        ),
                        // Style emphasis/italic
                        em: ({ node, ...props }) => (
                          <em {...props} className="italic" />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>

                  {/* File Attachments */}
                  {message.files && message.files.length > 0 && (
                    <div className="space-y-2">
                      {message.files.map((file, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleFileDownload(file)}
                          className="flex items-center gap-3 p-3 bg-[var(--darker)] hover:bg-gray-800 rounded-lg transition-colors group border border-gray-800 w-full text-left"
                        >
                          <FileText className="w-5 h-5 text-[var(--rust)] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-300 group-hover:text-white truncate">
                              {file.name}
                            </div>
                            {file.size && (
                              <div className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(2)} KB
                              </div>
                            )}
                          </div>
                          <Download className="w-4 h-4 text-gray-400 group-hover:text-[var(--rust)] flex-shrink-0" />
                        </button>
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
