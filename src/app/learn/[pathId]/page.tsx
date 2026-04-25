'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import type { LearningPath, LessonContent, QuizQuestion as QuizQuestionType } from '@/lib/types';

export default function LearnPathPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = use(params);
  const router = useRouter();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quiz, setQuiz] = useState<{ questions: QuizQuestionType[] } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Load path from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(`path_${pathId}`);
    if (stored) {
      setPath(JSON.parse(stored));
    }
  }, [pathId]);

  // Save path to sessionStorage when it changes
  useEffect(() => {
    if (path) {
      sessionStorage.setItem(`path_${pathId}`, JSON.stringify(path));
    }
  }, [path, pathId]);

  const loadLesson = async (lessonId: string) => {
    if (!path) return;
    const lesson = path.lessons.find((l) => l.id === lessonId);
    if (!lesson || lesson.status === 'locked') return;

    setActiveLesson(lessonId);
    setLessonContent(null);
    setQuizMode(false);
    setQuiz(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setLoadingLesson(true);

    try {
      const res = await fetch('/api/learn/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: lesson.title,
          lessonDescription: lesson.description,
          pathTopic: path.topic,
          difficulty: path.difficulty,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLessonContent({ ...data.data, id: lessonId, pathId, createdAt: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoadingLesson(false);
    }
  };

  const startQuiz = async () => {
    if (!lessonContent || !path) return;
    setLoadingQuiz(true);
    try {
      const res = await fetch('/api/learn/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: lessonContent.title,
          lessonContent: lessonContent.content?.slice(0, 2000),
          difficulty: path.difficulty,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuiz(data.data);
        setQuizMode(true);
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    // Mark lesson as completed and unlock next
    if (path && activeLesson) {
      const updatedLessons = path.lessons.map((l, i) => {
        if (l.id === activeLesson) return { ...l, status: 'completed' as const };
        if (i > 0 && path.lessons[i - 1].id === activeLesson && l.status === 'locked') {
          return { ...l, status: 'available' as const };
        }
        return l;
      });
      const completedCount = updatedLessons.filter((l) => l.status === 'completed').length;
      setPath({
        ...path,
        lessons: updatedLessons,
        progress: Math.round((completedCount / updatedLessons.length) * 100),
      });
    }
  };

  const getQuizScore = () => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) correct++;
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  if (!path) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading learning path...</p>
        <button className="btn btn-secondary" onClick={() => router.push('/dashboard')} id="btn-back-dashboard">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <header className="header" role="banner">
        <div className="header-inner">
          <button className="logo" style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => router.push('/dashboard')} id="learn-logo">
            🧠 MindPath
          </button>
          <nav className="nav-links" aria-label="Learn navigation">
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')} id="learn-nav-back">← Back</button>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/chat')} id="learn-nav-chat">🤖 AI Tutor</button>
          </nav>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Lesson sidebar */}
        <aside className="sidebar" role="navigation" aria-label="Lesson navigation">
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{path.title}</h2>
            <div className="progress-bar" style={{ marginTop: '8px' }} role="progressbar" aria-valuenow={path.progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-fill" style={{ width: `${path.progress}%` }}></div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{path.progress}% complete</span>
          </div>
          {path.lessons.map((lesson) => (
            <button
              key={lesson.id}
              className={`sidebar-link ${activeLesson === lesson.id ? 'active' : ''}`}
              onClick={() => loadLesson(lesson.id)}
              disabled={lesson.status === 'locked'}
              style={{ opacity: lesson.status === 'locked' ? 0.4 : 1 }}
              id={`lesson-link-${lesson.id}`}
              aria-label={`${lesson.title} - ${lesson.status}`}
            >
              <span aria-hidden="true">
                {lesson.status === 'completed' ? '✅' : lesson.status === 'locked' ? '🔒' : lesson.status === 'in_progress' ? '📖' : '📄'}
              </span>
              <span style={{ fontSize: '0.8125rem' }}>{lesson.title}</span>
            </button>
          ))}
        </aside>

        {/* Main content area */}
        <main className="main-content" id="main-content">
          {!activeLesson ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }} aria-hidden="true">📚</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>{path.title}</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.7 }}>
                {path.description}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
                <span className="badge">{path.lessons.length} lessons</span>
                <span className="badge">~{path.estimatedHours}h</span>
                <span className={`badge badge-${path.difficulty === 'beginner' ? 'success' : path.difficulty === 'intermediate' ? 'warning' : 'accent'}`}>
                  {path.difficulty}
                </span>
              </div>
              <button className="btn btn-primary" onClick={() => loadLesson(path.lessons.find((l) => l.status !== 'locked' && l.status !== 'completed')?.id || path.lessons[0].id)} id="btn-start-learning">
                Start Learning →
              </button>
            </div>
          ) : loadingLesson ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px' }}>
              <div className="spinner" style={{ width: 40, height: 40 }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Generating your lesson with AI...</p>
            </div>
          ) : quizMode && quiz ? (
            /* Quiz View */
            <div className="quiz-container">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>📝 Quiz Time!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                Test your understanding of {lessonContent?.title}
              </p>
              {quiz.questions.map((q, qi) => (
                <div key={q.id} className="card" style={{ marginBottom: '20px', padding: '24px' }} id={`quiz-q-${qi}`}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
                    {qi + 1}. {q.question}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {q.options.map((opt, oi) => {
                      let className = 'quiz-option';
                      if (quizAnswers[q.id] === oi) className += ' selected';
                      if (quizSubmitted) {
                        if (oi === q.correctIndex) className += ' correct';
                        else if (quizAnswers[q.id] === oi) className += ' incorrect';
                      }
                      return (
                        <button
                          key={oi}
                          className={className}
                          onClick={() => !quizSubmitted && setQuizAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                          disabled={quizSubmitted}
                          id={`quiz-q${qi}-opt${oi}`}
                          aria-label={`Option ${oi + 1}: ${opt}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <p style={{ marginTop: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              ))}
              {!quizSubmitted ? (
                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(quizAnswers).length < quiz.questions.length}
                  id="btn-submit-quiz"
                >
                  Submit Answers
                </button>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                  <div className="stat-value" style={{ fontSize: '3rem' }}>{getQuizScore()}%</div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    {getQuizScore() >= 80 ? '🎉 Excellent work!' : getQuizScore() >= 50 ? '👍 Good effort! Review the explanations above.' : '📖 Review the lesson and try again.'}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={() => setQuizMode(false)} id="btn-back-to-lesson">
                      Back to Lesson
                    </button>
                    <button className="btn btn-primary" onClick={() => {
                      const nextLesson = path.lessons.find((l) => l.status === 'available');
                      if (nextLesson) loadLesson(nextLesson.id);
                    }} id="btn-next-lesson">
                      Next Lesson →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : lessonContent ? (
            /* Lesson Content View */
            <div style={{ maxWidth: '800px' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '24px' }}>{lessonContent.title}</h1>
              <div className="markdown-content" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                {lessonContent.content}
              </div>

              {lessonContent.keyTakeaways && lessonContent.keyTakeaways.length > 0 && (
                <div className="card" style={{ marginTop: '32px', background: 'rgba(124,92,252,0.05)', borderColor: 'rgba(124,92,252,0.2)' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '12px' }}>🎯 Key Takeaways</h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {lessonContent.keyTakeaways.map((t, i) => (
                      <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', paddingLeft: '20px', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0 }} aria-hidden="true">✓</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={startQuiz} disabled={loadingQuiz} id="btn-take-quiz">
                  {loadingQuiz ? <><span className="spinner" style={{ width: 16, height: 16 }}></span> Generating Quiz...</> : '📝 Take Quiz'}
                </button>
                <button className="btn btn-secondary" onClick={() => router.push('/chat')} id="btn-lesson-chat">
                  🤖 Ask AI Tutor
                </button>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </>
  );
}
