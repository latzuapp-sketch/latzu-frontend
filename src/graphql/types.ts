/**
 * TypeScript interfaces mirroring the GraphQL schemas of both Latzu backends.
 *
 * Entity API  (apps/api  — port 8000): EntityType, Entity, EntityList
 * AI Service  (apps/ai   — port 8001): ChatSession, ChatMessage, SendMessageResult,
 *                                       ExtractionResult, YouTubeResult
 *
 * NOTE: Strawberry-GraphQL converts all Python snake_case field names to camelCase
 * in the generated GraphQL schema. These interfaces reflect the camelCase names
 * that Apollo Client will return (matching what the GraphQL operations request).
 *
 * These types are hand-written (no codegen) to keep the dependency count low.
 */

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface DeleteResult {
  success: boolean;
  message: string;
}

// ─── Entity API types (:8000) ─────────────────────────────────────────────────

/** A single property definition inside an EntityType schema. */
export interface PropertyDefinition {
  name: string;
  /** Primitive type hint — e.g. "string", "int", "float", "bool" */
  type: string;
  required: boolean;
  description: string;
}

/** Input shape when creating or updating an EntityType's property list. */
export interface PropertyDefinitionInput {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
}

/** A dynamic entity schema definition stored in Neo4j as :EntityType. */
export interface EntityType {
  name: string;
  description: string;
  properties: PropertyDefinition[];
  createdAt: string | null;
  updatedAt: string | null;
}

/** A record instance conforming to an EntityType, stored as :EntityInstance. */
export interface Entity {
  id: string;
  entityType: string;
  /** Arbitrary key/value bag serialised as JSON in Neo4j. */
  properties: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Paginated list of Entity instances returned by the `entities` query. */
export interface EntityList {
  items: Entity[];
  total: number;
  skip: number;
  limit: number;
}

// ─── AI Service types (:8001) ─────────────────────────────────────────────────

/** A single message in a chat conversation. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string | null;
}

/** Metadata for a chat session (no messages included). */
export interface ChatSession {
  sessionId: string;
  title: string;
  createdAt: string | null;
  updatedAt: string | null;
  messageCount: number;
}

/** A single tool call executed by the AI agent during a chat turn. */
export interface AgentAction {
  toolName: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  status: "success" | "error";
}

/**
 * A real-time event emitted by the chat_stream subscription.
 *
 * eventType values:
 *   "tool_start"    — a tool is about to execute
 *   "tool_complete" — a tool finished (result + status present)
 *   "reply"         — final assistant reply
 *   "done"          — stream complete, sessionId is set
 */
export interface ChatStreamEvent {
  eventType: "tool_start" | "tool_complete" | "reply" | "done";
  toolName?: string | null;
  args?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
  status?: "success" | "error" | null;
  reply?: string | null;
  sessionId?: string | null;
  sources?: RagSource[] | null;
  quickReplies?: string[] | null;
}

/** Full return value of the `sendMessage` mutation. */
export interface SendMessageResult {
  sessionId: string;
  reply: string;
  /** Knowledge nodes used as RAG context. Empty when RAG found nothing. */
  sources: RagSource[];
  /** Tool calls executed by the agent. Empty for plain chat responses. */
  actions: AgentAction[];
  /** Contextual follow-up suggestions for the user. */
  quickReplies: string[];
}

/** A knowledge node that was retrieved during RAG context building. */
export interface RagSource {
  id?: string;
  name: string;
  type: string;
  content?: string;
  score?: number;
}

/** Return value of the `chatHistory` query. */
export interface SessionHistoryResult {
  sessionId: string;
  messages: ChatMessage[];
}

/** Return value of the `extractText` mutation. */
export interface ExtractionResult {
  contentType: "narrative" | "informative" | "universal";
  nodesCreated: number;
  relationshipsCreated: number;
  summary: string;
  sourceRef: string;
}

/** Return value of the `processYoutube` mutation. */
export interface YouTubeResult {
  videoId: string;
  contentType: "narrative" | "informative" | "universal";
  nodesCreated: number;
  relationshipsCreated: number;
  summary: string;
}

// ─── Library books (:8001) ────────────────────────────────────────────────────

export interface LibraryBookChapter {
  title: string;
  content: string;
}

export interface LibraryBookExercise {
  prompt: string;
  type: "reflection" | "action";
}

/** A curated book returned by the `libraryBooks` GraphQL query. */
export interface LibraryBookAPI {
  id: string;
  bookId: string;
  title: string;
  author: string;
  year: number;
  category: string;
  coverGradient: string;
  pages: number;
  readMinutes: number;
  summary: string;
  overview: string;
  tags: string[];
  insights: string[];
  chapters: LibraryBookChapter[];
  analysis: string;
  critiques: string[];
  exercises: LibraryBookExercise[];
  aiContext: string;
}

// ─── Biblioteca / Knowledge node types (:8001) ───────────────────────────────

/** A single node in the knowledge graph extracted by the AI. */
export interface KnowledgeNode {
  id: string;
  name: string;
  type: string;
  content: string;
  sourceRef: string | null;
  properties: string | null; // JSON string
}

/** A directed relationship between KnowledgeNodes. */
export interface KnowledgeRelationship {
  relType: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  direction: "outgoing" | "incoming";
}

/** Full node data including relationships (returned by `knowledgeNode` query). */
export interface KnowledgeNodeDetail extends KnowledgeNode {
  relationships: KnowledgeRelationship[];
}

/** Paginated list of KnowledgeNodes. */
export interface KnowledgeNodeList {
  items: KnowledgeNode[];
  total: number;
}

/** Global knowledge graph statistics. */
export interface KnowledgeStats {
  totalNodes: number;
  totalRelationships: number;
  nodeTypes: string[];
  sourceRefs: string[];
}

// ─── Mutation input shapes (sent to backend — also camelCase per Strawberry) ──

export interface SendMessageInput {
  message: string;
  sessionId?: string | null;
  useRag?: boolean;
}

export interface ExtractTextInput {
  text: string;
  sourceRef?: string;
  hint?: "narrative" | "informative" | "universal" | null;
}

export interface CreateEntityTypeInput {
  name: string;
  description?: string;
  properties?: PropertyDefinitionInput[];
}

export interface CreateEntityInput {
  entityType: string;
  properties?: Record<string, unknown>;
}

export interface UpdateEntityInput {
  properties: Record<string, unknown>;
}

// ─── Organizer agent types (:8001) ────────────────────────────────────────────

export type AgentIntentType =
  | "tag_node"
  | "link_nodes"
  | "create_workspace"
  | "move_to_workspace"
  | "surface_connection"
  | "archive_stale"
  | "merge_nodes"
  | "create_synthesis_node"
  | "create_life_area"
  | "link_to_life_area"
  | "build_hierarchy"
  | "update_task_priority"
  | "update_task_due"
  | "deprecate_node"
  | "queue_focus_signal";

export type AgentIntentRisk = "low" | "medium" | "high";
export type AgentIntentStatus = "pending" | "applied" | "dismissed" | "failed";

export interface AgentIntent {
  id: string;
  type: AgentIntentType;
  title: string;
  description: string;
  risk: AgentIntentRisk;
  status: AgentIntentStatus;
  payload: string; // JSON string
  createdAt: string;
}

export interface InteractionStats {
  totalEvents: number;
  uniqueTargets: number;
  eventTypes: string[];
  lastReflection: string | null;
}

export interface RecordInteractionResult {
  eventId: string;
  recorded: boolean;
}

export interface IntentActionResult {
  intentId: string;
  success: boolean;
}

// ─── Smart Organizer types (:8001) ────────────────────────────────────────────

export type FocusSignalType = "reminder" | "insight" | "warning" | "milestone" | "suggestion";
export type FocusSignalStatus = "pending" | "delivered" | "dismissed" | "snoozed";

export interface FocusSignal {
  id: string;
  message: string;
  type: FocusSignalType;
  deliverAt: string;
  context: string | null; // JSON string
  relatedNodeIds: string[];
  actionPayload: string | null; // JSON string
  status: FocusSignalStatus;
}

export interface UserModel {
  userId: string;
  lifeAreas: string;         // JSON: [{name, description, node_ids, strength, last_active}]
  currentFocus: string;
  longTermGoals: string;     // JSON array of strings
  momentumTopics: string;    // JSON array of strings
  staleAreas: string;        // JSON array of strings
  blockers: string;          // JSON array of strings
  behaviorPatterns: string;  // JSON array of strings
  knowledgeFrontier: string; // JSON array of strings
  graphHealth: string;       // fragmented | growing | healthy | stale | unknown
  modelVersion: number;
  lastDeepReflection: string | null;
  updatedAt: string | null;
}

export interface LifeArea {
  name: string;
  description: string;
  confidence: number;
  lastActive: string | null;
  nodeCount: number;
}

// ─── Plan Health types ────────────────────────────────────────────────────────

export type PlanHealthStatus = "on_track" | "at_risk" | "derailing" | "abandoned";

export interface PlanHealth {
  planId: string;
  userId: string;
  score: number;
  status: PlanHealthStatus;
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  completionPct: number;
  daysRemaining: number | null;
  projectedCompletion: string | null;
  daysSinceActivity: number;
  riskFactors: string[];
  recommendation: string;
  updatedAt: string | null;
}
