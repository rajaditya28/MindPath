# 🧠 MindPath — AI-Powered Personalized Learning Companion

**MindPath** is an intelligent learning assistant that helps users learn new concepts effectively through personalized content, adaptive pacing, and AI-driven tutoring. Built entirely on Google Cloud services.

## 🎯 Challenge Alignment

MindPath addresses the **Learning Companion** challenge by combining personalized learning paths, adaptive quizzes, progress tracking, and a conversational AI tutor. The app uses Google Cloud services to generate curriculum, explain concepts, assess understanding, recommend educational media, translate content, synthesize audio, analyze images, and persist each learner's progress in Firestore.

## 🌟 Features

### Personalized Learning Paths
AI-powered custom learning roadmaps generated based on your goals, background knowledge, and preferred difficulty level. Each path adapts as you progress.

### AI Tutor Chat (Gemini-powered)
Interactive conversational learning with a Socratic-method AI tutor. Get real-time explanations, examples, and guidance tailored to your understanding level with streaming responses.

### Adaptive Quizzes
AI-generated assessments that adjust difficulty based on your performance. Build confidence with progressively challenging questions and detailed explanations.

### Multi-Modal Learning
- **Text Lessons**: Rich markdown-formatted educational content
- **Audio Lessons**: Text-to-Speech for accessibility
- **Video Recommendations**: Curated YouTube content per topic
- **Image Analysis**: Upload images for Visual AI-powered learning

### Multi-Language Support
Learn in your preferred language with real-time translation powered by Google Cloud Translate.

### Progress Analytics
Track your journey with learning streaks, mastery levels, completion rates, and time analytics.

## 🛠 Google Cloud Services Used (12)

| Service | Purpose |
|---------|---------|
| **Gemini AI** | Content generation, quiz creation, adaptive AI tutoring |
| **Cloud Firestore** | User data, progress tracking, content storage |
| **Firebase Authentication** | Google Sign-In, session management |
| **Cloud Text-to-Speech** | Audio lesson generation for accessibility |
| **Cloud Translate** | Multi-language content support |
| **Cloud Vision AI** | Image analysis for visual learning |
| **YouTube Data API** | Educational video recommendations |
| **Cloud Storage** | Audio file and asset storage |
| **Secret Manager** | Secure API key management |
| **Cloud Run** | Serverless container deployment |
| **Cloud Logging** | Application observability and monitoring |
| **Cloud Natural Language** | Content difficulty and entity analysis |

## 🏗 Architecture

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # REST API routes
│   │   │   ├── chat/           # AI tutor (streaming SSE)
│   │   │   ├── learn/          # Learning path, lesson, quiz generation
│   │   │   ├── tts/            # Text-to-Speech
│   │   │   ├── translate/      # Translation
│   │   │   ├── vision/         # Image analysis
│   │   │   ├── youtube/        # Video recommendations
│   │   │   └── analyze/        # NLP content analysis
│   │   ├── dashboard/          # User dashboard
│   │   ├── chat/               # AI tutor interface
│   │   ├── learn/[pathId]/     # Learning path & lessons
│   │   └── page.tsx            # Landing page
│   ├── components/             # React components
│   │   └── providers/          # Context providers
│   ├── lib/                    # Core libraries
│   │   ├── gemini.ts           # Gemini AI client & prompts
│   │   ├── firebase-admin.ts   # Server-side Firebase
│   │   ├── firebase-client.ts  # Client-side Firebase
│   │   ├── google-services.ts  # All Google Cloud integrations
│   │   ├── security.ts         # Rate limiting, sanitization
│   │   └── types.ts            # TypeScript definitions
│   └── middleware.ts           # Security middleware
├── __tests__/                  # Jest unit tests
├── Dockerfile                  # Multi-stage production build
└── next.config.mjs             # Next.js configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Google Cloud project with billing enabled
- Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/MindPath.git
cd MindPath

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

### Environment Variables

See `.env.example` for all required environment variables.

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test -- --coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🐳 Deployment (Google Cloud Run)

```bash
# Deploy directly from source
gcloud run deploy mindpath \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=your_key,GOOGLE_CLOUD_PROJECT_ID=learning-companion-494405"
```

## 🔒 Security Features

- **Non-root Docker container** for production
- **Input sanitization** against XSS attacks
- **Rate limiting** on all API endpoints
- **Security headers** (CSP, HSTS, X-Frame-Options, etc.)
- **Server-side API key management** — no secrets in client code
- **Authentication middleware** for protected routes

## ♿ Accessibility

- Full ARIA labels and semantic HTML
- Keyboard navigation support
- Screen reader compatible
- Skip-to-content link
- High contrast support
- Reduced motion preference respect
- Text-to-Speech for all educational content
- Multi-language support

## 📄 License

MIT License — Built with ❤️ for the Google Cloud Hackathon
