/**
 * Latzu API client — MIGRATION REFERENCE
 *
 * This file documents the original REST-style API client and maps every
 * function to its replacement GraphQL operation. The REST endpoints listed
 * here never existed on the Python backends (which are pure GraphQL).
 *
 * HOW TO MIGRATE
 * --------------
 * 1. Import the Apollo clients:
 *      import { aiClient, entityClient } from "@/lib/apollo";
 *
 * 2. Import the GraphQL operation document:
 *      import { SEND_MESSAGE } from "@/graphql/ai/operations";
 *
 * 3. In a React component or hook, use Apollo's useMutation / useQuery:
 *      const [send] = useMutation(SEND_MESSAGE, { client: aiClient });
 *      await send({ variables: { input: { message, session_id } } });
 *
 * All operations and their variables are documented in:
 *   src/graphql/ai/operations.ts  — AI Service (:8001)
 *   src/graphql/api/operations.ts — Entity API (:8000)
 *
 * Full system documentation: docs/ARCHITECTURE.md
 */

// ─── REPLACED: Auth API ───────────────────────────────────────────────────────
//
// Old:  api.post("/api/auth/sync", data)  → no equivalent endpoint on backend
// Old:  api.get("/auth/me", { token })    → use NextAuth session instead:
//         import { useSession } from "next-auth/react";
//         const { data: session } = useSession();
//         const user = session?.user;
//
// Old:  api.post("/auth/logout")          → use NextAuth signOut:
//         import { signOut } from "next-auth/react";
//         signOut();

// ─── REPLACED: Chat API ───────────────────────────────────────────────────────
//
// Old:  aiApi.post("/ai/chat/sessions", data)
// New:  mutation sendMessage (omit session_id to auto-create)
//       → src/graphql/ai/operations.ts › SEND_MESSAGE
//       → hook: src/hooks/useChat.ts › sendMessage()
//
// Old:  aiApi.get("/ai/chat/sessions/:id")
// New:  query chatHistory(session_id: String!)
//       → src/graphql/ai/operations.ts › GET_CHAT_HISTORY
//
// Old:  aiApi.post("/ai/chat/messages", data)
// New:  mutation sendMessage(input: SendMessageInput!)
//       → src/graphql/ai/operations.ts › SEND_MESSAGE
//       → hook: src/hooks/useChat.ts › sendMessage()

// ─── REPLACED: Knowledge Graph API ───────────────────────────────────────────
//
// Old:  aiApi.post("/ai/knowledge-graph/extract/text", data)
// New:  mutation extractText(input: ExtractTextInput!)
//       → src/graphql/ai/operations.ts › EXTRACT_TEXT
//       → hook: src/hooks/useKnowledge.ts › extractText()
//
// Old:  aiApi.get("/ai/knowledge-graph/graph/:id")
// New:  No direct equivalent — knowledge nodes are stored in Neo4j.
//       Chat sessions serve as an index of what has been ingested.
//       → query chatSessions › src/graphql/ai/operations.ts › GET_CHAT_SESSIONS
//
// Old:  aiApi.post("/ai/knowledge-graph/query/:id", ...)
// New:  mutation sendMessage with use_rag: true
//       RAG context is automatically injected into every chat message.
//       → src/graphql/ai/operations.ts › SEND_MESSAGE

// ─── REPLACED: Personalized Learning API ─────────────────────────────────────
//
// Old:  aiApi.post("/ai/personalized-learning/personalized-summary", data)
// Old:  aiApi.get("/ai/personalized-learning/recommend/:userId/:graphId")
// New:  No backend equivalent yet. Learn page uses static mock data.
//       See docs/ARCHITECTURE.md — "Known Gaps" for how to add this.

// ─── REPLACED: Cypher QA API ─────────────────────────────────────────────────
//
// Old:  aiApi.post("/ai/cypher-qa/query", data)
// Old:  aiApi.get("/ai/cypher-qa/examples")
// New:  No backend equivalent. Use sendMessage with use_rag: true for
//       natural-language queries against the knowledge graph.

// ─── REPLACED: MCP Tools API ─────────────────────────────────────────────────
//
// Old:  aiApi.get("/ai/mcp/tools")
// Old:  aiApi.post("/ai/mcp/execute", data)
// New:  No backend equivalent.

// ─── REPLACED: Metrics API ───────────────────────────────────────────────────
//
// Old:  api.get("/metrics/interactions/summary")
// Old:  api.get("/metrics/graph-quality/:graphId")
// New:  No backend equivalent.

// ─── REPLACED: Dynamic Entities API ──────────────────────────────────────────
//
// Old:  api.post("/api/dynamic/:tenantId/:entityType", { data })
// New:  mutation createEntity(input: CreateEntityInput!)
//       → src/graphql/api/operations.ts › CREATE_ENTITY
//
// Old:  api.get("/api/dynamic/:tenantId/:entityType/:entityId")
// New:  query entity(id: String!)
//       → src/graphql/api/operations.ts › GET_ENTITY
//
// Old:  api.get("/api/dynamic/:tenantId/:entityType")
// New:  query entities(entity_type: String, skip: Int, limit: Int)
//       → src/graphql/api/operations.ts › GET_ENTITIES
//
// Old:  api.put("/api/dynamic/:tenantId/:entityType/:entityId", { data })
// New:  mutation updateEntity(id: String!, input: UpdateEntityInput!)
//       → src/graphql/api/operations.ts › UPDATE_ENTITY
//
// Old:  api.delete("/api/dynamic/:tenantId/:entityType/:entityId")
// New:  mutation deleteEntity(id: String!)
//       → src/graphql/api/operations.ts › DELETE_ENTITY

// ─── YouTube (was missing from original api.ts) ───────────────────────────────
//
// New:  mutation processYoutube(url: String!)
//       → src/graphql/ai/operations.ts › PROCESS_YOUTUBE
//       → hook: src/hooks/useKnowledge.ts › processYoutube()

export {};
