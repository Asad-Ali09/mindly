'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Download, AlertCircle } from 'lucide-react';
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
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    resizeTextarea();
  }, [input]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInput(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
  };

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

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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

    // Create abort controller for this stream
    abortControllerRef.current = new AbortController();

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
      
      // Check if error is from abort
      if (error.name === 'AbortError' || abortControllerRef.current === null) {
        console.log('Stream was aborted by user');
        // Don't show error message for user-initiated abort
        return;
      }
      
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
      abortControllerRef.current = null;
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
    <div className="relative h-screen bg-[var(--night)] overflow-hidden">
      {/* Header - Fixed at top */}
      <header className="hero-header" style={{ background: 'transparent', borderBottom: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <Link href="/" className="hero-brand">
          <span>Mindly</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/learn">
            <button className="hero-cta" type="button">
              Start Learning
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="hero-cta" type="button">
              Dashboard
            </button>
          </Link>
        </div>
      </header>

      {/* Messages Container - Scrollable with full height */}
      <div className="absolute inset-0 overflow-y-auto px-4" style={{ paddingTop: '100px', paddingBottom: '120px' }}>
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


                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center px-6 py-4">
                <div 
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  style={{
                    animation: 'breathe 1.5s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Composer - Floating at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4" style={{ zIndex: 20, background: 'transparent' }}>
        <div className="max-w-4xl mx-auto">
          {/* Capsule Container - Stateful Composer */}
          <div 
            className="flex items-center transition-all"
            style={{
              backgroundColor: isFocused || input ? '#323232' : '#2a2a2a',
              borderRadius: (isFocused || input) ? '24px' : '9999px',
              paddingLeft: '20px',
              paddingRight: '20px',
              paddingTop: (isFocused || input) ? '14px' : '12px',
              paddingBottom: (isFocused || input) ? '14px' : '12px',
              minHeight: (isFocused || input) ? '60px' : '52px',
              gap: '14px',
              boxShadow: 'none',
              transition: 'all 0.18s ease-out',
            }}
          >
            {/* Left Action: File Attachment */}
            <button
              disabled={isTyping}
              className="flex-shrink-0 flex items-center justify-center rounded-lg transition-all hover:bg-white/5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                width: '40px',
                height: '40px',
                padding: 0,
                margin: 0,
              }}
              aria-label="Attach file"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400 transition-colors"
              >
                <line x1="10" y1="5" x2="10" y2="15" />
                <line x1="5" y1="10" x2="15" y2="10" />
              </svg>
            </button>

            {/* Center: Multiline Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              disabled={isTyping}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything"
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none border-none resize-none overflow-y-auto scrollbar-hide disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                fontSize: '15px',
                lineHeight: '22px',
                minHeight: '22px',
                maxHeight: '120px',
                padding: 0,
                margin: 0,
                caretColor: '#ffffff',
              }}
              rows={1}
            />

            {/* Right Actions Group */}
            <div className="flex items-center gap-2">
              {/* Microphone Icon */}
              <button
                onClick={handleMicClick}
                disabled={isTyping}
                className="flex-shrink-0 flex items-center justify-center rounded-lg transition-all hover:bg-white/5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  width: '40px',
                  height: '40px',
                  padding: 0,
                  margin: 0,
                  backgroundColor: isListening ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                }}
                aria-label="Voice input"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>

              {/* Send/Stop Button - Primary Action */}
              <button
                onClick={isTyping ? handleStopStream : handleSend}
                disabled={!isTyping && !input.trim()}
                className="flex-shrink-0 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:cursor-not-allowed"
                style={{
                  width: '40px',
                  height: '40px',
                  padding: 0,
                  margin: 0,
                  backgroundColor: 'var(--rust)',
                  opacity: (input.trim() || isTyping) ? 1 : 0.4,
                  transition: 'opacity 0.15s ease-out, transform 0.1s ease-out',
                }}
                aria-label={isTyping ? "Stop streaming" : "Send message"}
              >
                {isTyping ? (
                  // Stop icon (square)
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="white"
                    stroke="none"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  // Send icon (arrow)
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
