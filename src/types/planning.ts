// Planning module types

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type ABCDEPriority = "A" | "B" | "C" | "D" | "E";
export type LifeArea = "career" | "health" | "relationships" | "growth";
export type TaskSource = "manual" | "ai" | "plan" | "calendar" | "system";
export type TaskCreator = "user" | "ai" | "system";
export type BoardListKind = "todo" | "in_progress" | "done" | "custom";
export type ProjectRole = "owner" | "admin" | "member" | "viewer";
export type TaskRelationshipType = "BLOCKS" | "RELATES_TO" | "DUPLICATES" | "PARENT_OF";

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
  abcdePriority?: ABCDEPriority;
  lifeArea?: LifeArea;
  dueDate: string | null;
  dueTime: string | null;
  category: TaskCategory;
  contentType?: TaskCategory;
  contentRef?: string;
  phaseIndex?: number;
  subPhaseId?: string;
  planId?: string;
  projectId?: string;
  boardId?: string;
  listId?: string;
  issueKey?: string;
  lessonRef?: string;
  googleEventId?: string;
  source?: TaskSource;
  labels?: string[];
  assigneeUserId?: string;
  assigneeName?: string;
  estimateMinutes?: number;
  spentMinutes?: number;
  rank?: number;
  parentTaskId?: string;
  blockedBy?: string[];
  watcherUserIds?: string[];
  memberUserIds?: string[];
  lastEditedByUserId?: string;
  lastEditedByName?: string;
  linkedTaskIds?: string[];
  acceptanceCriteria?: string;
  createdBy?: TaskCreator;
  userId: string;
  createdAt: string;
  updatedAt?: string;
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
  abcdePriority?: ABCDEPriority;
  lifeArea?: LifeArea;
  dueDate?: string | null;
  dueTime?: string | null;
  category?: TaskCategory;
  contentType?: TaskCategory;
  contentRef?: string;
  phaseIndex?: number;
  subPhaseId?: string;
  planId?: string;
  projectId?: string;
  boardId?: string;
  listId?: string;
  issueKey?: string;
  lessonRef?: string;
  source?: TaskSource;
  labels?: string[];
  assigneeUserId?: string;
  assigneeName?: string;
  estimateMinutes?: number;
  spentMinutes?: number;
  rank?: number;
  parentTaskId?: string;
  blockedBy?: string[];
  watcherUserIds?: string[];
  memberUserIds?: string[];
  lastEditedByUserId?: string;
  lastEditedByName?: string;
  linkedTaskIds?: string[];
  acceptanceCriteria?: string;
  createdBy?: TaskCreator;
}

export interface ProjectMember {
  userId: string;
  name: string;
  email?: string;
  role: ProjectRole;
}

export interface ProjectBoardProject {
  id: string;
  name: string;
  key: string;
  description: string;
  ownerUserId: string;
  ownerName?: string;
  tenantId?: string;
  memberUserIds: string[];
  memberNames: string[];
  members: ProjectMember[];
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectBoard {
  id: string;
  projectId: string;
  name: string;
  description: string;
  ownerUserId: string;
  memberUserIds: string[];
  memberNames: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface BoardList {
  id: string;
  projectId: string;
  boardId: string;
  name: string;
  description: string;
  order: number;
  kind: BoardListKind;
  mapsToTaskStatus: TaskStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  projectId?: string;
  boardId?: string;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityEvent {
  id: string;
  taskId?: string;
  projectId?: string;
  boardId?: string;
  actorUserId: string;
  actorName: string;
  action: string;
  summary: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface EntityRelationship {
  fromId: string;
  toId: string;
  relationshipType: string;
  fromEntityType?: string | null;
  toEntityType?: string | null;
  createdAt?: string | null;
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
