import { describe, expect, it } from '@jest/globals';
import type { ApiResponse, UserProfile, LearningPath, ChatMessage, QuizResult } from '@/lib/types';

describe('API Response Types', () => {
  it('should create a success response', () => {
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Hello' },
    };
    expect(response.success).toBe(true);
    expect(response.data?.message).toBe('Hello');
  });

  it('should create an error response', () => {
    const response: ApiResponse = {
      success: false,
      error: 'Something went wrong',
    };
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });
});

describe('User Profile Type', () => {
  it('should have correct default preferences', () => {
    const profile: UserProfile = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: '',
      createdAt: new Date().toISOString(),
      preferences: {
        language: 'en',
        difficulty: 'beginner',
        dailyGoalMinutes: 30,
        enableAudio: true,
      },
      stats: {
        totalPathsStarted: 0,
        totalPathsCompleted: 0,
        totalLessonsCompleted: 0,
        totalQuizzesTaken: 0,
        averageScore: 0,
        streakDays: 0,
        lastActiveDate: new Date().toISOString(),
        totalStudyMinutes: 0,
      },
    };
    expect(profile.preferences.language).toBe('en');
    expect(profile.stats.streakDays).toBe(0);
  });
});

describe('Learning Path Type', () => {
  it('should calculate progress correctly', () => {
    const path: LearningPath = {
      id: 'path-1',
      userId: 'user-1',
      title: 'Test Path',
      description: 'Test',
      topic: 'testing',
      difficulty: 'beginner',
      estimatedHours: 10,
      lessons: [
        { id: '1', title: 'L1', description: '', order: 1, estimatedMinutes: 30, topics: [], status: 'completed' },
        { id: '2', title: 'L2', description: '', order: 2, estimatedMinutes: 30, topics: [], status: 'available' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      progress: 50,
    };

    const completed = path.lessons.filter(l => l.status === 'completed').length;
    const calculatedProgress = Math.round((completed / path.lessons.length) * 100);
    expect(calculatedProgress).toBe(50);
  });
});

describe('Chat Message Type', () => {
  it('should support user and assistant roles', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
      { id: '2', role: 'assistant', content: 'Hi!', timestamp: new Date().toISOString() },
    ];
    expect(messages[0].role).toBe('user');
    expect(messages[1].role).toBe('assistant');
  });
});

describe('Quiz Result Type', () => {
  it('should calculate score correctly', () => {
    const result: QuizResult = {
      id: 'qr-1',
      userId: 'user-1',
      pathId: 'path-1',
      lessonId: 'lesson-1',
      questions: [],
      answers: [0, 1, 0, 2, 3],
      score: 80,
      totalQuestions: 5,
      completedAt: new Date().toISOString(),
      timeSpentSeconds: 120,
    };
    expect(result.score).toBe(80);
    expect(result.answers.length).toBe(result.totalQuestions);
  });
});
