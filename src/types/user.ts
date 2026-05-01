// User types for Latzu Platform

export type ProfileType = 'estudiante' | 'aprendiz';

export type LearningStyle = 'visual' | 'auditivo' | 'lectura' | 'kinestesico';

export type PlanningStyle = 'structured' | 'flexible' | 'mixed';
export type EnergyPeak = 'early_morning' | 'morning' | 'afternoon' | 'night' | 'varies';
export type WorkPace = 'sprints' | 'steady' | 'streaks';

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

// ─── New deep-profile onboarding data ────────────────────────────────────────

export interface OnboardingData {
  profileType: ProfileType;

  // Step 2: Context
  country?: string;
  university?: string;
  career?: string;
  semester?: string;
  studyFocus?: string;
  phoneNumber?: string;

  // Step 3: Why are you here
  motivations: string[];

  // Step 4: What are you juggling
  activeAreas: string[];

  // Step 5: Personality
  planningStyle?: string;
  energyPeak?: string;
  feedbackStyle?: string;
  workPace?: string;
  mainBlocker?: string;
  mainMotivator?: string;
  goalRelationship?: string;
  whenBlocked?: string;
  dailyTime?: string;

  // Step 6: AI style
  aiPersonality?: string[];

  // Step 7: 90-day vision (area → level key)
  vision90?: Record<string, string>;

  // Legacy / backward compat
  goals?: string[];
  interests?: string[];
  experience?: string;
  learningStyle?: LearningStyle;
  lifeAreaGoals?: LifeAreaGoals;
}

// ─── Onboarding preview types ─────────────────────────────────────────────────

export interface ProposedPage {
  title: string;
  description: string;
  icon: string;
}

export interface ProposedWorkspace {
  title: string;
  icon: string;
  description: string;
  pages: ProposedPage[];
}

export interface ProposedTask {
  title: string;
  area: string;
}

export interface OnboardingPreview {
  personalityBadges: string[];
  workspaces: ProposedWorkspace[];
  initialTasks: ProposedTask[];
  summary: string;
}
