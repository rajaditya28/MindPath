'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import type { ChatMessage } from '@/lib/types';

export default function ChatPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  function welcomeMessage(): ChatMessage {
    return {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hi! I'm your MindPath AI Tutor. I'm here to help you learn anything you're curious about.\n\nYou can:\n- Ask me to explain any concept\n- Get help with problems\n- Explore new topics\n- Get study tips\n\nWhat would you like to learn today?",
      timestamp: new Date().toISOString(),
    };
  }

  const storageKey = `mindpath_chat_${user?.uid ?? 'guest'}`;

  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage()]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load persisted messages when user is known
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (parsed.length > 0) { setMessages(parsed); return; }
      }
    } catch { /* ignore */ }
    setMessages([welcomeMessage()]);
  }, [storageKey]);

  // Persist messages whenever they change
  useEffect(() => {
    if (typeof window === 'undefined' || messages.length <= 1) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-100)));
    } catch { /* ignore quota errors */ }
  }, [messages, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString() }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, content: m.content + parsed.text } : m)
                );
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: 'Sorry, I encountered an error. Please try again.' } : m)
      );
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      <header className="header" role="banner">
        <div className="header-inner">
          <button className="logo" style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => router.push('/dashboard')} id="chat-logo">
            🧠 MindPath
          </button>
          <nav className="nav-links" aria-label="Chat navigation">
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')} id="chat-nav-dashboard">Dashboard</button>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              setMessages([welcomeMessage()]);
              localStorage.removeItem(storageKey);
            }} id="chat-clear">Clear Chat</button>
            {user && (
              <button className="btn btn-ghost btn-sm" onClick={signOut} id="chat-signout">Sign Out</button>
            )}
          </nav>
        </div>
      </header>

      <main className="chat-container" id="main-content" style={{ paddingTop: '65px' }}>
        <div className="chat-messages" role="log" aria-label="Chat messages" aria-live="polite">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.role}`}
              id={`msg-${msg.id}`}
              role="article"
              aria-label={`${msg.role === 'user' ? 'You' : 'AI Tutor'} said`}
            >
              <div className="markdown-content" style={{ whiteSpace: 'pre-wrap' }}>
                {msg.content || (isStreaming ? '...' : '')}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <form onSubmit={sendMessage} className="chat-input-wrapper" role="search">
            <label htmlFor="chat-input" className="sr-only">Type your message</label>
            <input
              ref={inputRef}
              id="chat-input"
              className="input-field"
              placeholder="Ask me anything... e.g., Explain quantum computing"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              autoComplete="off"
              aria-label="Chat message input"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!input.trim() || isStreaming}
              id="btn-send-message"
              aria-label="Send message"
            >
              {isStreaming ? <span className="spinner" style={{ width: 18, height: 18 }}></span> : '→'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
