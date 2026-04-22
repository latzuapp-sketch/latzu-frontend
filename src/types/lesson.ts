// Lesson types for Latzu Platform

export type BlockType =
  | "content"
  | "callout"
  | "image"
  | "divider"
  | "quiz"
  | "exercise"
  | "reflection"
  | "ai-interaction"
  | "video"
  | "code";

// ── Block definitions ────────────────────────────────────────────────────────

export interface ContentBlock {
  type: "content";
  markdown: string;
  /** Optional heading shown above the markdown area */
  title?: string;
}

export type CalloutVariant = "info" | "warning" | "success" | "tip" | "danger";

export interface CalloutBlock {
  type: "callout";
  variant: CalloutVariant;
  title?: string;
  /** Supports inline markdown (bold, italic, code, links) */
  body: string;
}

export interface ImageBlock {
  type: "image";
  src: string;
  alt?: string;
  caption?: string;
  /** "full" | "half" — layout width hint */
  size?: "full" | "half";
}

export interface DividerBlock {
  type: "divider";
  /** Optional label rendered in the middle of the divider */
  label?: string;
}

export interface QuizBlock {
  type: "quiz";
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  points?: number;
}

export interface ExerciseBlock {
  type: "exercise";
  prompt: string;
  hints?: string[];
  /** AI validator prompt sent to the backend */
  validator?: string;
  sampleSolution?: string;
}

export interface ReflectionBlock {
  type: "reflection";
  prompt: string;
  guidingQuestions?: string[];
}

export interface AIInteractionBlock {
  type: "ai-interaction";
  context: string;
  suggestedQuestions?: string[];
  concept?: string;
}

export interface VideoBlock {
  type: "video";
  url: string;
  title?: string;
  /** Duration in seconds */
  duration?: number;
  timestamps?: Array<{ time: number; label: string }>;
}

export interface CodeBlock {
  type: "code";
  language: string;
  prompt?: string;
  starterCode?: string;
  solution?: string;
  testCases?: Array<{ input: string; expectedOutput: string }>;
}

// ── Union ────────────────────────────────────────────────────────────────────

export type LessonBlock =
  | ContentBlock
  | CalloutBlock
  | ImageBlock
  | DividerBlock
  | QuizBlock
  | ExerciseBlock
  | ReflectionBlock
  | AIInteractionBlock
  | VideoBlock
  | CodeBlock;

// ── Lesson & paths ───────────────────────────────────────────────────────────

export interface InteractiveLesson {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  blocks: LessonBlock[];
  /** Lesson IDs that must be completed before this one */
  prerequisites: string[];
  estimatedMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  /** Concept IDs covered by this lesson */
  concepts: string[];
  author?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonProgress {
  lessonId: string;
  userId: string;
  currentBlockIndex: number;
  completedBlocks: number[];
  startedAt: Date;
  lastAccessedAt: Date;
  completedAt?: Date;
  /** 0–100 overall score */
  score: number;
  /** Seconds spent in the lesson */
  timeSpent: number;
  /** blockIndex → score earned */
  quizScores: Record<number, number>;
  /** blockIndex → submitted text */
  exerciseSubmissions: Record<number, string>;
  /** blockIndex → reflection text */
  reflections: Record<number, string>;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  /** Lesson IDs in recommended order */
  lessons: string[];
  estimatedHours: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  prerequisites?: string[];
  outcomes: string[];
}

export interface UserLearningState {
  userId: string;
  activePath?: string;
  completedLessons: string[];
  inProgressLessons: Record<string, LessonProgress>;
  masteredConcepts: string[];
  strugglingConcepts: string[];
  /** Total seconds spent learning */
  totalTimeSpent: number;
  streak: {
    current: number;
    longest: number;
    lastActivityDate: string;
  };
}
