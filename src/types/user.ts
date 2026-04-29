// User types for Latzu Platform

export type ProfileType = 'estudiante' | 'aprendiz';

export type LearningStyle = 'visual' | 'auditivo' | 'lectura' | 'kinestesico';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  profileType: ProfileType;
  tenantId: string;
  role: 'user' | 'admin' | 'moderator';
  provider: 'google' | 'email';
  createdAt: string;
  lastLoginAt: string;
  metadata?: Record<string, unknown>;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    proactiveSuggestions: boolean;
  };
  learningGoals: string[];
  focusAreas: string[];
}

export interface UserProgress {
  userId: string;
  totalLessonsCompleted: number;
  totalTimeSpent: number; // minutes
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string;
  skillLevels: Record<string, number>; // skill name -> level (0-100)
  conceptsMastered: string[];
  conceptsInProgress: string[];
}

export interface LifeAreaGoals {
  career?: string;
  health?: string;
  relationships?: string;
  growth?: string;
}

export interface OnboardingData {
  profileType: ProfileType;
  goals: string[];
  lifeAreaGoals?: LifeAreaGoals;
  experience: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  learningStyle?: LearningStyle;
  // Student-specific
  country?: string;
  university?: string;
  career?: string;
  semester?: string;
  // Aprendiz-specific
  studyFocus?: string;
  // WhatsApp
  phoneNumber?: string;
}
