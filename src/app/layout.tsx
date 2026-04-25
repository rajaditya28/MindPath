import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'MindPath — AI-Powered Learning Companion',
  description: 'Personalized learning paths powered by Google AI. Master any concept with adaptive lessons, interactive quizzes, and an AI tutor that adapts to your pace.',
  keywords: ['learning', 'AI tutor', 'personalized education', 'adaptive learning', 'Google AI'],
  authors: [{ name: 'MindPath Team' }],
  openGraph: {
    title: 'MindPath — AI-Powered Learning Companion',
    description: 'Master any concept with personalized AI-powered learning paths',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link" id="skip-navigation">
          Skip to main content
        </a>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
