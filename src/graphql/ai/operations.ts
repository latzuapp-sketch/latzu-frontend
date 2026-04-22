/**
 * GraphQL operation documents for the Latzu AI Service (port 8001).
 *
 * Endpoints:
 *   Queries   → chatSessions, chatHistory
 *   Mutations → sendMessage, deleteChatSession, extractText, processYoutube
 *
 * All documents are used with { client: aiClient } from src/lib/apollo.ts.
 *
 * NOTE: Strawberry-GraphQL automatically converts Python snake_case field names
 * to camelCase in the GraphQL schema (e.g. session_id → sessionId).
 * All field names and input keys here must use camelCase to match.
 *
 * Example usage:
 *   import { SEND_MESSAGE } from "@/graphql/ai/operations";
 *   import { aiClient } from "@/lib/apollo";
 *   const [send, { loading }] = useMutation(SEND_MESSAGE, { client: aiClient });
 */

import { gql } from "@apollo/client";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * List all chat sessions for a user, most recent first.
 *
 * Variables: { userId?: string }
 * Returns metadata only (no messages). Use GET_CHAT_HISTORY to load messages.
 */
export const GET_CHAT_SESSIONS = gql`
  query GetChatSessions($userId: String) {
    chatSessions(userId: $userId) {
      sessionId
      title
      messageCount
      createdAt
      updatedAt
    }
  }
`;

/**
 * Load the full message history for a specific session.
 *
 * Variables: { sessionId: string }
 */
export const GET_CHAT_HISTORY = gql`
  query GetChatHistory($sessionId: String!) {
    chatHistory(sessionId: $sessionId) {
      sessionId
      messages {
        role
        content
        timestamp
      }
    }
  }
`;

// ─── Subscriptions ───────────────────────────────────────────────────────────

/**
 * Stream real-time events as the AI agent processes a message.
 *
 * Event types (eventType field):
 *   "tool_start"    — a tool is about to execute (toolName + args present)
 *   "tool_complete" — a tool finished (toolName + args + result + status present)
 *   "reply"         — final assistant reply (reply + sessionId + sources present)
 *   "done"          — stream complete (sessionId present)
 *
 * Use { client: aiClient } and subscribe imperatively via aiClient.subscribe().
 */
export const CHAT_STREAM = gql`
  subscription ChatStream($input: SendMessageInput!) {
    chatStream(input: $input) {
      eventType
      toolName
      args
      result
      status
      reply
      sessionId
      sources
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Send a user message to the AI. Creates a new session if sessionId is omitted.
 *
 * Variables: { input: SendMessageInput }
 *   - message:     string             — the user's text
 *   - sessionId:   string?            — omit to start a fresh conversation
 *   - useRag:      boolean            — whether to inject knowledge graph context
 *   - userProfile: UserProfileInput?  — pass for personalisation and memory updates
 *
 * Note: This is a synchronous mutation — the full reply is returned at once.
 */
export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      sessionId
      reply
      sources
      actions {
        toolName
        args
        result
        status
      }
    }
  }
`;

/**
 * Delete a chat session and all its messages from Neo4j.
 *
 * Variables: { sessionId: string }
 */
export const DELETE_CHAT_SESSION = gql`
  mutation DeleteChatSession($sessionId: String!) {
    deleteChatSession(sessionId: $sessionId) {
      success
      message
    }
  }
`;

/**
 * Extract a knowledge graph from a text passage and persist it to Neo4j.
 *
 * Variables: { input: ExtractTextInput }
 *   - text:       string  — the text to extract from (minimum 10 chars)
 *   - sourceRef:  string? — label for provenance (e.g. "blog-post-2024")
 *   - hint:       string? — force a strategy: "narrative" | "informative" | "universal"
 *   - userId:     string? — scope nodes to a specific user (private by default)
 *   - visibility: string  — "private" | "public" (default: "private")
 */
export const EXTRACT_TEXT = gql`
  mutation ExtractText($input: ExtractTextInput!) {
    extractText(input: $input) {
      contentType
      nodesCreated
      relationshipsCreated
      summary
      sourceRef
    }
  }
`;

/**
 * Fetch a YouTube transcript and extract its knowledge graph into Neo4j.
 *
 * Variables: { url: string }
 *
 * Errors:
 *   - "Could not extract a video ID from URL" — invalid URL format
 *   - "Could not fetch transcript" — video has no captions / is private
 */
export const PROCESS_YOUTUBE = gql`
  mutation ProcessYoutube($url: String!) {
    processYoutube(url: $url) {
      videoId
      contentType
      nodesCreated
      relationshipsCreated
      summary
    }
  }
`;

/**
 * Fetch a webpage, strip HTML, and extract knowledge graph into Neo4j.
 *
 * Variables: { url: string, sourceRef?: string, visibility?: string }
 */
export const SCRAPE_URL = gql`
  mutation ScrapeUrl($url: String!, $sourceRef: String, $visibility: String) {
    scrapeUrl(url: $url, sourceRef: $sourceRef, visibility: $visibility) {
      contentType
      nodesCreated
      relationshipsCreated
      summary
      sourceRef
    }
  }
`;

// ─── Biblioteca queries ───────────────────────────────────────────────────────

/**
 * List KnowledgeNodes with optional search / filter / pagination.
 *
 * Variables (all optional):
 *   - search:    string  — full-text on name + content
 *   - nodeType:  string  — exact match on node type
 *   - sourceRef: string  — exact match on source reference
 *   - skip:      int     — pagination offset (default 0)
 *   - limit:     int     — max results (default 50)
 */
export const GET_KNOWLEDGE_NODES = gql`
  query GetKnowledgeNodes(
    $search: String
    $nodeType: String
    $sourceRef: String
    $userId: String
    $skip: Int
    $limit: Int
  ) {
    knowledgeNodes(
      search: $search
      nodeType: $nodeType
      sourceRef: $sourceRef
      userId: $userId
      skip: $skip
      limit: $limit
    ) {
      total
      items {
        id
        name
        type
        content
        sourceRef
        properties
      }
    }
  }
`;

/**
 * Fetch a single KnowledgeNode with all its relationships.
 *
 * Variables: { id: string }
 */
export const GET_KNOWLEDGE_NODE = gql`
  query GetKnowledgeNode($id: String!, $userId: String) {
    knowledgeNode(id: $id, userId: $userId) {
      id
      name
      type
      content
      sourceRef
      relationships {
        relType
        nodeId
        nodeName
        nodeType
        direction
      }
    }
  }
`;

/** Global stats for the knowledge graph (node count, types, sources). */
export const GET_KNOWLEDGE_STATS = gql`
  query GetKnowledgeStats {
    knowledgeStats {
      totalNodes
      totalRelationships
      nodeTypes
      sourceRefs
    }
  }
`;

// ─── Biblioteca mutations ─────────────────────────────────────────────────────

/**
 * Delete a KnowledgeNode and all its relationships.
 *
 * Variables: { id: string }
 */
export const DELETE_KNOWLEDGE_NODE = gql`
  mutation DeleteKnowledgeNode($id: String!) {
    deleteKnowledgeNode(id: $id) {
      success
      message
    }
  }
`;

/**
 * Update the name and/or content of a KnowledgeNode.
 *
 * Variables: { id: string, input: { name?: string, content?: string } }
 */
export const UPDATE_KNOWLEDGE_NODE = gql`
  mutation UpdateKnowledgeNode($id: String!, $input: UpdateKnowledgeNodeInput!) {
    updateKnowledgeNode(id: $id, input: $input) {
      id
      name
      type
      content
      sourceRef
    }
  }
`;

/**
 * Ask Gemini to rewrite a KnowledgeNode's content following an instruction.
 * Does NOT persist — returns the rewritten text so the UI can preview it.
 *
 * Variables: { input: { nodeId, instruction?, mode? } }
 *   - mode: "improve" | "summarize" | "expand" | "simplify" | "fix" | "translate_en"
 *   - instruction: free-form prompt ("make it more formal", etc.)
 *   At least one of mode/instruction is required.
 */
export const REWRITE_KNOWLEDGE_CONTENT = gql`
  mutation RewriteKnowledgeContent($input: RewriteContentInput!) {
    rewriteKnowledgeContent(input: $input) {
      nodeId
      original
      rewritten
    }
  }
`;

// ─── Personalisation operations ───────────────────────────────────────────────

/**
 * Get personalised KnowledgeNode recommendations for a user.
 * Uses graph traversal from owned nodes + interest matching from UserMemory.
 *
 * Variables: { userId: string, limit?: number }
 */
export const GET_RECOMMENDATIONS = gql`
  query GetRecommendations($userId: String!, $limit: Int) {
    recommendations(userId: $userId, limit: $limit) {
      id
      name
      type
      content
      sourceRef
      connectionStrength
      reason
    }
  }
`;

/**
 * Get the AI-generated learning memory/profile for a user.
 *
 * Variables: { userId: string }
 */
export const GET_USER_MEMORY = gql`
  query GetUserMemory($userId: String!) {
    userMemory(userId: $userId) {
      userId
      summary
      interests
      knowledgeGaps
      learningStyle
      sessionCount
      messageCount
      updatedAt
    }
  }
`;

/**
 * Get aggregate stats for a user's personalised knowledge graph.
 *
 * Variables: { userId: string }
 */
export const GET_USER_STATS = gql`
  query GetUserStats($userId: String!) {
    userStats(userId: $userId) {
      ownedNodes
      ownedRelationships
      sessionCount
      messageCount
    }
  }
`;

/**
 * Record a user interaction with a KnowledgeNode.
 * interaction_type: "viewed" | "saved" | "dismissed"
 *
 * Variables: { input: RecordInteractionInput }
 */
export const RECORD_INTERACTION = gql`
  mutation RecordInteraction($input: RecordInteractionInput!) {
    recordInteraction(input: $input) {
      success
      message
    }
  }
`;

/**
 * Analyze onboarding data and create the initial workspace structure for a new user.
 * Called once, immediately after onboarding completes.
 *
 * Variables: { input: PersonalizeUserInput }
 */
export const PERSONALIZE_USER = gql`
  mutation PersonalizeUser($input: PersonalizeUserInput!) {
    personalizeUser(input: $input) {
      workspacesCreated
      pagesCreated
      knowledgeNodesCreated
      message
    }
  }
`;

/**
 * Manually refresh the user's AI memory from their recent sessions.
 *
 * Variables: { userId: string, userProfile: UserProfileInput }
 */
export const REFRESH_USER_MEMORY = gql`
  mutation RefreshUserMemory($userId: String!, $userProfile: UserProfileInput!) {
    refreshUserMemory(userId: $userId, userProfile: $userProfile) {
      userId
      summary
      interests
      knowledgeGaps
      learningStyle
      sessionCount
      messageCount
    }
  }
`;

// ─── Spaced Repetition ────────────────────────────────────────────────────────

const DECK_FIELDS = gql`
  fragment DeckFields on DeckGQL {
    id userId name description color createdAt
    cardCount dueCount newCount
  }
`;

const CARD_FIELDS = gql`
  fragment CardFields on FlashcardGQL {
    id deckId front back easeFactor reps interval
    dueDate createdAt lastReviewedAt sourceNodeId
  }
`;

export const GET_DECKS = gql`
  ${DECK_FIELDS}
  query GetDecks($userId: String!) {
    decks(userId: $userId) { ...DeckFields }
  }
`;

export const GET_DECK_CARDS = gql`
  ${CARD_FIELDS}
  query GetDeckCards($deckId: String!) {
    deckCards(deckId: $deckId) { ...CardFields }
  }
`;

export const GET_DUE_CARDS = gql`
  ${CARD_FIELDS}
  query GetDueCards($userId: String!, $deckId: String, $limit: Int) {
    dueCards(userId: $userId, deckId: $deckId, limit: $limit) { ...CardFields }
  }
`;

export const GET_DUE_COUNT = gql`
  query GetDueCount($userId: String!) {
    dueCardCount(userId: $userId) { total }
  }
`;

export const CREATE_DECK = gql`
  ${DECK_FIELDS}
  mutation CreateDeck($userId: String!, $name: String!, $description: String, $color: String) {
    createDeck(userId: $userId, name: $name, description: $description, color: $color) {
      ...DeckFields
    }
  }
`;

export const DELETE_DECK = gql`
  mutation DeleteDeck($deckId: String!, $userId: String!) {
    deleteDeck(deckId: $deckId, userId: $userId) { success deletedId }
  }
`;

export const CREATE_FLASHCARD = gql`
  ${CARD_FIELDS}
  mutation CreateFlashcard($deckId: String!, $front: String!, $back: String!, $sourceNodeId: String) {
    createFlashcard(deckId: $deckId, front: $front, back: $back, sourceNodeId: $sourceNodeId) {
      ...CardFields
    }
  }
`;

export const DELETE_FLASHCARD = gql`
  mutation DeleteFlashcard($cardId: String!) {
    deleteFlashcard(cardId: $cardId) { success deletedId }
  }
`;

export const REVIEW_CARD = gql`
  ${CARD_FIELDS}
  mutation ReviewCard($cardId: String!, $quality: Int!) {
    reviewCard(cardId: $cardId, quality: $quality) { ...CardFields }
  }
`;

export const GENERATE_FLASHCARDS_FROM_NODE = gql`
  ${CARD_FIELDS}
  mutation GenerateFlashcardsFromNode($nodeId: String!, $deckId: String!, $count: Int) {
    generateFlashcardsFromNode(nodeId: $nodeId, deckId: $deckId, count: $count) {
      ...CardFields
    }
  }
`;
