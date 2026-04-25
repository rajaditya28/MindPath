'use client';

import React from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, signIn } = useAuth();
  const router = useRouter();

  const handleGetStarted = async () => {
    if (user) {
      router.push('/dashboard');
    } else {
      await signIn();
    }
  };

  return (
    <main id="main-content">
      {/* Header */}
      <header className="header" role="banner">
        <div className="header-inner">
          <div className="logo" aria-label="MindPath Home">🧠 MindPath</div>
          <nav className="nav-links" aria-label="Main navigation">
            {user ? (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')} id="nav-dashboard">
                  Dashboard
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => router.push('/chat')} id="nav-chat">
                  AI Tutor
                </button>
              </>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={signIn} id="nav-signin">
                Sign In with Google
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-bg" aria-hidden="true">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge" aria-label="Powered by Google AI">
            <span aria-hidden="true">✨</span> Powered by Google Gemini AI
          </div>
          <h1 id="hero-title" className="hero-title">
            Your Personal AI Learning Companion
          </h1>
          <p className="hero-subtitle">
            Master any concept with personalized learning paths, adaptive quizzes, and an AI tutor
            that understands your pace. Built with 12+ Google Cloud services.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={handleGetStarted} id="hero-cta">
              {user ? 'Go to Dashboard' : 'Start Learning Free'}
              <span aria-hidden="true">→</span>
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} id="hero-features-link">
              Explore Features
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features" aria-labelledby="features-title">
        <h2 id="features-title" className="section-title">Learn Smarter, Not Harder</h2>
        <p className="section-subtitle">AI-powered features designed to accelerate your learning journey</p>
        <div className="features-grid container">
          <article className="card feature-card card-glow" id="feature-paths">
            <div className="feature-icon" aria-hidden="true">🛤️</div>
            <h3 className="feature-title">Personalized Learning Paths</h3>
            <p className="feature-desc">AI generates custom roadmaps based on your goals, background, and preferred difficulty level. Each path adapts as you progress.</p>
          </article>
          <article className="card feature-card card-glow" id="feature-tutor">
            <div className="feature-icon" aria-hidden="true">🤖</div>
            <h3 className="feature-title">AI Tutor Chat</h3>
            <p className="feature-desc">Chat with an AI tutor that uses the Socratic method. Get real-time explanations, examples, and guidance tailored to your understanding.</p>
          </article>
          <article className="card feature-card card-glow" id="feature-quizzes">
            <div className="feature-icon" aria-hidden="true">📝</div>
            <h3 className="feature-title">Adaptive Quizzes</h3>
            <p className="feature-desc">AI-generated quizzes that adjust difficulty based on your performance. Build confidence with progressively challenging questions.</p>
          </article>
          <article className="card feature-card card-glow" id="feature-multimodal">
            <div className="feature-icon" aria-hidden="true">📸</div>
            <h3 className="feature-title">Multi-Modal Learning</h3>
            <p className="feature-desc">Upload images for instant analysis, listen to audio lessons, and watch curated YouTube recommendations — all in one place.</p>
          </article>
          <article className="card feature-card card-glow" id="feature-multilang">
            <div className="feature-icon" aria-hidden="true">🌍</div>
            <h3 className="feature-title">Multi-Language Support</h3>
            <p className="feature-desc">Learn in your preferred language with real-time translation powered by Google Cloud Translate. Break language barriers.</p>
          </article>
          <article className="card feature-card card-glow" id="feature-progress">
            <div className="feature-icon" aria-hidden="true">📊</div>
            <h3 className="feature-title">Progress Analytics</h3>
            <p className="feature-desc">Track your learning journey with detailed progress metrics, streaks, mastery levels, and time analytics.</p>
          </article>
        </div>
      </section>

      {/* Google Services Section */}
      <section className="features-section" style={{ paddingTop: 0 }} aria-labelledby="services-title">
        <h2 id="services-title" className="section-title">Powered by Google Cloud</h2>
        <p className="section-subtitle">Built on 12+ Google services for reliability and intelligence</p>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', maxWidth: '800px' }}>
          {[
            'Gemini AI', 'Cloud Firestore', 'Firebase Auth', 'Cloud Text-to-Speech',
            'Cloud Translate', 'Cloud Vision AI', 'YouTube Data API', 'Cloud Storage',
            'Secret Manager', 'Cloud Run', 'Cloud Logging', 'Cloud Natural Language'
          ].map((service) => (
            <span key={service} className="badge badge-accent">{service}</span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }} role="contentinfo">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          © 2025 MindPath. Built with ❤️ using Google Cloud Services.
        </p>
      </footer>
    </main>
  );
}
