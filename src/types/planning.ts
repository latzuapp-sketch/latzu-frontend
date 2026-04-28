// Planning module types

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type TaskCategory =
  | "task"
  | "lesson"
  | "reminder"
  | "flashcard"
  | "reading"
  | "quiz"
  | "video"
  | "practice";

export type PlanType = "study" | "action";
export type PlanStatus = "active" | "completed" | "paused";

export interface StudySchedule {
  daysPerWeek: number;
  hoursPerDay: number;
  preferredDays: string[];
  preferredTime?: string;
}

export interface StudySubPhase {
  id: string;
  title: string;
  topics?: string[];
}

export interface StudyPhase {
  id: string;
  title: string;
  description?: string;
  durationWeeks: number;
  topics?: string[];
  color?: string;
  subPhases?: StudySubPhase[];
}

export interface PlanningTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  dueTime: string | null;
  category: TaskCategory;
  contentType?: TaskCategory;
  contentRef?: string;
  phaseIndex?: number;
  subPhaseId?: string;
  planId?: string;
  lessonRef?: string;
  googleEventId?: string;
  userId: string;
  createdAt: string;
}

export interface ActionPlan {
  id: string;
  title: string;
  description: string;
  goal: string;
  type: PlanType;
  status: PlanStatus;
  dueDate: string | null;
  schedule?: string; // JSON-serialized StudySchedule
  phases?: string;   // JSON-serialized StudyPhase[]
  userId: string;
  createdAt: string;
  aiGenerated?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;   // ISO datetime or date
  end: string;     // ISO datetime or date
  allDay: boolean;
  htmlLink?: string;
  description?: string;
  colorId?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  dueTime?: string | null;
  category?: TaskCategory;
  contentType?: TaskCategory;
  contentRef?: string;
  phaseIndex?: number;
  planId?: string;
  lessonRef?: string;
}

export interface CreatePlanInput {
  title: string;
  description?: string;
  goal: string;
  type: PlanType;
  dueDate?: string | null;
  generateWithAI?: boolean;
  phases?: StudyPhase[];
}
