export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  preferences: {
    language: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    dailyGoalMinutes: number;
    enableAudio: boolean;
  };
  stats: {
    totalPathsStarted: number;
    totalPathsCompleted: number;
    totalLessonsCompleted: number;
    totalQuizzesTaken: number;
    averageScore: number;
    streakDays: number;
    lastActiveDate: string;
    totalStudyMinutes: number;
  };
}

export interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  lessons: LessonMeta[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'archived';
  progress: number;
}

export interface LessonMeta {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  topics: string[];
  status: 'locked' | 'available' | 'in_progress' | 'completed';
}

export interface LessonContent {
  id: string;
  pathId: string;
  title: string;
  content: string;
  keyTakeaways: string[];
  practiceExercises: Array<{
    question: string;
    hint: string;
  }>;
  audioUrl?: string;
  videoRecommendations?: YouTubeVideo[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizResult {
  id: string;
  userId: string;
  pathId: string;
  lessonId: string;
  questions: QuizQuestion[];
  answers: number[];
  score: number;
  totalQuestions: number;
  completedAt: string;
  timeSpentSeconds: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
