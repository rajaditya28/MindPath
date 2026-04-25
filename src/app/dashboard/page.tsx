'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { LearningPath } from '@/lib/types';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [loading, setLoading] = useState(false);
  const [loadingPaths, setLoadingPaths] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');

  // Load saved paths from Firestore on mount
  useEffect(() => {
    if (!user) return;
    setLoadingPaths(true);
    fetch(`/api/learn/generate?userId=${user.uid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setPaths(data.data as LearningPath[]);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingPaths(false));
  }, [user]);

  const handleCreatePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/learn/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, goal, difficulty, userId: user?.uid }),
      });
      const data = await res.json();
      if (data.success) {
        const newPath = { ...data.data, userId: user?.uid || '' } as LearningPath;
        setPaths((prev) => [newPath, ...prev]);
        setShowCreate(false);
        setTopic('');
        setGoal('');
      }
    } catch (error) {
      console.error('Error creating path:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPath = (path: LearningPath) => {
    // Store in sessionStorage so learn page can access it without another API call
    sessionStorage.setItem(`path_${path.id}`, JSON.stringify(path));
    router.push(`/learn/${path.id}`);
  };

  const sidebarLinks = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'paths', icon: '🛤️', label: 'Learning Paths' },
    { id: 'chat', icon: '🤖', label: 'AI Tutor', href: '/chat' },
    { id: 'progress', icon: '📈', label: 'Progress' },
  ];

  return (
    <>
      <header className="header" role="banner">
        <div className="header-inner">
          <button className="logo" style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => router.push('/')} aria-label="Go to home page" id="dashboard-logo">
            🧠 MindPath
          </button>
          <nav className="nav-links" aria-label="User navigation">
            {user && (
              <>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {user.displayName || user.email}
                </span>
                {user.photoURL && (
                  <Image
                    src={user.photoURL}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    style={{ width: 32, height: 32, borderRadius: '50%' }}
                  />
                )}
                <button className="btn btn-ghost btn-sm" onClick={signOut} id="btn-signout">
                  Sign Out
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="sidebar" role="navigation" aria-label="Dashboard navigation">
          {sidebarLinks.map((link) => (
            <button
              key={link.id}
              className={`sidebar-link ${activePage === link.id ? 'active' : ''}`}
              onClick={() => {
                if (link.href) router.push(link.href);
                else setActivePage(link.id);
              }}
              id={`sidebar-${link.id}`}
              aria-current={activePage === link.id ? 'page' : undefined}
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </aside>

        <main className="main-content" id="main-content">
          {/* Stats */}
          <div className="stats-grid" role="region" aria-label="Learning statistics">
            <div className="card stat-card" id="stat-paths">
              <div className="stat-value">{paths.length}</div>
              <div className="stat-label">Learning Paths</div>
            </div>
            <div className="card stat-card" id="stat-lessons">
              <div className="stat-value">{paths.reduce((acc, p) => acc + p.lessons.filter((l) => l.status === 'completed').length, 0)}</div>
              <div className="stat-label">Lessons Completed</div>
            </div>
            <div className="card stat-card" id="stat-streak">
              <div className="stat-value">0</div>
              <div className="stat-label">Day Streak 🔥</div>
            </div>
            <div className="card stat-card" id="stat-time">
              <div className="stat-value">0h</div>
              <div className="stat-label">Study Time</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="btn-create-path">
              <span aria-hidden="true">✨</span> Create Learning Path
            </button>
            <button className="btn btn-secondary" onClick={() => router.push('/chat')} id="btn-open-chat">
              <span aria-hidden="true">🤖</span> Chat with AI Tutor
            </button>
          </div>

          {/* Create Path Modal */}
          {showCreate && (
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-path-title"
            >
              <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '32px' }}>
                <h2 id="create-path-title" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
                  Create Learning Path
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.875rem' }}>
                  Tell us what you want to learn and AI will create a personalized path for you.
                </p>
                <form onSubmit={handleCreatePath}>
                  <div style={{ marginBottom: '16px' }}>
                    <label htmlFor="topic-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                      What do you want to learn?
                    </label>
                    <input
                      id="topic-input"
                      className="input-field"
                      placeholder="e.g., Machine Learning, React, Quantum Physics..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label htmlFor="goal-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                      Your goal (optional)
                    </label>
                    <input
                      id="goal-input"
                      className="input-field"
                      placeholder="e.g., Build a chatbot, Pass an exam..."
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                    />
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <label htmlFor="difficulty-select" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                      Difficulty Level
                    </label>
                    <select
                      id="difficulty-select"
                      className="input-field"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} id="btn-cancel-create">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading || !topic.trim()} id="btn-submit-create">
                      {loading ? <><span className="spinner" style={{ width: 16, height: 16 }}></span> Generating...</> : '✨ Generate Path'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Learning Paths */}
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
            {paths.length > 0 ? 'Your Learning Paths' : 'Get Started'}
          </h2>

          {loadingPaths ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ width: 20, height: 20 }}></div>
              Loading your paths...
            </div>
          ) : paths.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }} id="empty-state">
              <div style={{ fontSize: '3rem', marginBottom: '16px' }} aria-hidden="true">🚀</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Start Your Learning Journey</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                Create your first personalized learning path. Our AI will generate a complete curriculum tailored to your goals.
              </p>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="btn-empty-create">
                <span aria-hidden="true">✨</span> Create Your First Path
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
              {paths.map((path) => (
                <article
                  key={path.id}
                  className="card card-glow"
                  style={{ cursor: 'pointer' }}
                  onClick={() => openPath(path)}
                  id={`path-${path.id}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') openPath(path); }}
                  aria-label={`Open learning path: ${path.title}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{path.title}</h3>
                    <span className={`badge badge-${path.difficulty === 'beginner' ? 'success' : path.difficulty === 'intermediate' ? 'warning' : 'accent'}`}>
                      {path.difficulty}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px', lineHeight: 1.6 }}>
                    {path.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    <span>{path.lessons.length} lessons</span>
                    <span>~{path.estimatedHours}h</span>
                  </div>
                  <div className="progress-bar" role="progressbar" aria-valuenow={path.progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-fill" style={{ width: `${path.progress}%` }}></div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
