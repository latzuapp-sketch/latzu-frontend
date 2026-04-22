# Experience Story: Converting a RAG Chatbot into a Real-Time AI Agent

> **STAR Format** — Situation · Task · Action · Result

---

## Situation

The Latzu Platform already had a working AI chat powered by Google Gemini and a RAG (Retrieval-Augmented Generation) pipeline. The chat could answer questions about the user's knowledge graph by fetching semantically similar nodes and injecting them into the model's context.

However, it was fundamentally **passive**. Every interaction followed the same fixed loop:

```
user message → retrieve context from Neo4j → build prompt → Gemini generates text → display
```

The chat could talk *about* the user's data but could never *act on it*. If a student said "create a 5-task study plan for React," the AI would describe what tasks to create — and stop there. The user had to manually go to the Planning board and create them one by one.

This created a jarring gap between what the AI *said* it could help with and what it could actually *do*. The platform had a rich entity layer — `PlanningTask`, `KnowledgeNode`, calendars — all sitting idle, unreachable from the chat interface.

---

## Task

The goal was to turn the chat into a **first-class agent**: one that can reason about what the user needs and then reach into the platform's data layer to make it happen — creating tasks, building study plans, searching knowledge — all visible in real-time without any page refresh.

The core constraints were:

- **No new infrastructure.** No new message broker, no new service. The existing architecture (FastAPI + Strawberry GraphQL + Neo4j + Apollo Client + Next.js) had to carry the full weight.
- **Real-time feel.** When the agent takes an action, the user should see it happen — as a visual card appearing in the chat — before the text reply arrives.
- **Data consistency.** Tasks created by the agent had to be identical in shape to tasks created through the Planning UI. The Planning board should refresh automatically.
- **Graceful degradation.** A failure in one tool call should not crash the whole turn. The agent should continue and report the error.

---

## Action

### 1. Choosing the architecture: tool calling over HTTP

The first decision was *where* to place the tool execution layer. Two options:

**Option A — Agent calls Entity API over HTTP**
The AI service would call `http://entity-service:8000/graphql` to create tasks, just like the frontend does. This is clean and decoupled.

**Option B — Agent writes directly to Neo4j**
Both the AI service and Entity service import the same `core/db.py` driver. The agent could write directly to the graph, bypassing HTTP entirely.

I chose **Option B** for this first pass. The services already share the database layer, and adding an HTTP round-trip introduced latency, auth complexity, and a failure surface during an agent loop that might call 10 tools in sequence. Writing directly to Neo4j and reusing the same `EntityInstance:PlanningTask` label pattern kept the data identical to what the Entity API produces — the Planning board sees no difference.

### 2. Designing the tool schema

I defined 6 tools using Gemini's `FunctionDeclaration` format, organized around the two core domains of the platform:

**Planning tools:**
- `create_task` — single task with title, description, priority, due date, category
- `create_multiple_tasks` — batch creation accepting an array (critical for study plans)
- `list_tasks` — read current tasks with optional status filter
- `update_task` — modify status, priority, title, or description

**Knowledge tools:**
- `create_knowledge_node` — add a concept/note to the user's knowledge graph
- `search_knowledge` — vector-search the knowledge base before creating duplicates

Each tool's parameter schema used JSON Schema types so Gemini could validate its own arguments before returning a `function_call` part.

The trickiest design question was `create_multiple_tasks`. I could have let Gemini call `create_task` in a loop, but that would produce N sequential Gemini round-trips (each with its own latency). A single batch call with an array of task objects was far more efficient and predictable.

### 3. Building the agent loop

The existing `chat_turn()` function was a one-shot Gemini call. Replacing it with an **agent loop** required understanding Gemini's multi-turn function calling protocol:

```
1. Send message + tool definitions to Gemini
2. Gemini responds with function_call parts (not text)
3. Execute each function call locally
4. Send FunctionResponse parts back to Gemini
5. Gemini generates the next response (more calls or final text)
6. Repeat until text reply
```

The implementation in `agent_chat_turn()`:

```python
async def agent_chat_turn(history, user_message, tool_executor, ...):
    actions_taken = []
    model = genai.GenerativeModel(model_name, tools=tools, ...)
    chat = model.start_chat(history=converted_history)

    response = await asyncio.to_thread(chat.send_message, user_message)

    for _ in range(max_tool_calls):  # safety ceiling — prevents infinite loops
        function_calls = [
            part.function_call
            for candidate in response.candidates
            for part in candidate.content.parts
            if part.function_call.name  # empty string = no function call
        ]

        if not function_calls:
            break  # Gemini is done with tools, extract text reply

        # Execute all function calls and collect FunctionResponse parts
        response_parts = []
        for fc in function_calls:
            result = await tool_executor.execute(fc.name, dict(fc.args))
            actions_taken.append(AgentAction(tool_name=fc.name, args=dict(fc.args), result=result))
            response_parts.append(
                genai.protos.Part(
                    function_response=genai.protos.FunctionResponse(
                        name=fc.name, response={"result": result}
                    )
                )
            )

        # Feed results back to Gemini
        response = await asyncio.to_thread(
            chat.send_message,
            genai.protos.Content(parts=response_parts, role="user"),
        )

    reply = next(
        (part.text for c in response.candidates for part in c.content.parts if part.text),
        "Listo.",
    )
    return reply, actions_taken
```

One subtle issue: `genai.GenerativeModel` with tools cannot be cached the same way the base model is. Tools are baked into the model instance at construction time, so the agent model is created fresh each call. This is slightly more overhead but avoids stale tool state.

### 4. Propagating actions through GraphQL

`SendMessageResponse` (Pydantic) and `SendMessageResult` (Strawberry) were extended with an `actions` field:

```python
# Pydantic
class AgentAction(BaseModel):
    tool_name: str
    args: dict[str, Any] = {}
    result: dict[str, Any] = {}
    status: str = "success"

class SendMessageResponse(BaseModel):
    reply: str
    session_id: str
    sources: list[RagSource] = []
    actions: list[AgentAction] = []   # ← new

# Strawberry
@strawberry.type
class AgentActionGQL:
    tool_name: str = strawberry.field(name="toolName")
    args: JSON
    result: JSON
    status: str

@strawberry.type
class SendMessageResult:
    reply: str
    session_id: str = strawberry.field(name="sessionId")
    sources: list[RagSourceGQL] = []
    actions: list[AgentActionGQL] = []   # ← new
```

Using `strawberry.scalars.JSON` for `args` and `result` was the right call — these are free-form dicts that differ by tool, and defining a union type for every possible shape would have been overengineering.

### 5. Frontend: simulating real-time without WebSockets

The backend returns all actions at once at the end of the mutation. True streaming (SSE per tool call) would have required activating the Socket.io server that was already scaffolded but dormant.

Instead, I used a **staggered insertion trick** in `useChat.ts`:

```typescript
// Insert action cards one by one with 120ms stagger
for (const action of result.actions) {
    addMessage({
        id: crypto.randomUUID(),
        role: "agent_action",
        content: action.toolName,
        timestamp: new Date(),
        metadata: { action },
    });
    await new Promise<void>((r) => setTimeout(r, 120));
}

// Then stream the text reply character by character
startStreaming(assistantId, result.reply, () => { ... });
```

Combined with the existing character-by-character streaming simulation (~750 chars/sec), this creates the perception of:

```
[Card: "Crear tarea: Introducción a React"]   ← 120ms
[Card: "Crear tarea: Componentes y Props"]    ← 120ms
[Card: "Crear tarea: Estado con useState"]    ← 120ms
...
[Assistant reply streams in character by character]
```

The user sees each action appear before the final reply, which makes it feel like the agent is working through a list in real-time — even though it all happened on the server during a single HTTP request.

### 6. Closing the loop: live data refresh

After inserting action cards, `useChat.ts` checks which tool categories were invoked and triggers targeted Apollo refetches:

```typescript
const TASK_TOOLS = new Set(["create_task", "create_multiple_tasks", "update_task"]);
const KNOWLEDGE_TOOLS = new Set(["create_knowledge_node"]);

const hasTaskChanges = result.actions.some((a) => TASK_TOOLS.has(a.toolName));
if (hasTaskChanges) {
    entityClient.refetchQueries({ include: ["GetEntities"] });
}

const hasKnowledgeChanges = result.actions.some((a) => KNOWLEDGE_TOOLS.has(a.toolName));
if (hasKnowledgeChanges) {
    aiClient.refetchQueries({ include: ["GetKnowledgeNodes", "GetKnowledgeStats"] });
}
```

This uses Apollo's operation-name-based cache invalidation (`"GetEntities"` as a string, not a DocumentNode) — a distinction that caused a TypeScript error (`TS2353: 'query' does not exist in type 'DocumentNode'`) during development, caught by `npx tsc --noEmit`.

### 7. Visual design: AgentActionCard

Each tool call renders as a compact card in the message list:

```tsx
<motion.div
    initial={{ opacity: 0, x: -8, scale: 0.97 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
>
    <Icon className="text-primary" />
    <span>{getLabel(action)}</span>   // "Crear tarea: 'Aprende React hooks'"
    {action.status === "success"
        ? <CheckCircle2 className="text-emerald-500" />
        : <XCircle className="text-destructive" />
    }
</motion.div>
```

The `getLabel()` function produces human-readable descriptions:
- `create_task` → `"Crear tarea: 'Aprende React hooks'"`
- `create_multiple_tasks` → `"3 tareas creadas"`
- `update_task` → `"Actualizar tarea"`
- `search_knowledge` → `"Buscar en conocimiento: 'React'"`

---

## Result

The platform now supports a full agent interaction model. The complete flow for "Crea un plan de 5 tareas para aprender React":

1. User sends message from the chat input
2. `sendMessage` GraphQL mutation reaches the AI service
3. `agent_chat_turn()` sends the message + 6 tool definitions to Gemini
4. Gemini responds with `function_call: create_multiple_tasks` with a structured array of 5 tasks
5. `ToolExecutor._create_multiple_tasks()` writes 5 `EntityInstance:PlanningTask` nodes to Neo4j
6. Result is returned to Gemini, which generates the final text reply
7. Frontend receives `{ reply: "...", actions: [{toolName: "create_multiple_tasks", args: {...}}] }`
8. 5 action cards appear one by one (120ms stagger), then the reply streams in
9. `entityClient.refetchQueries(["GetEntities"])` fires → Planning board refreshes with all 5 new tasks — no page reload, no manual action

**Technical outcomes:**
- Zero new infrastructure (no new services, no new message broker)
- TypeScript strict mode passes with `npx tsc --noEmit` exit code 0
- Tasks written by the agent are byte-for-byte identical to tasks created via the Planning UI
- Agent loop capped at 10 tool calls per turn to prevent runaway execution
- Graceful error handling: a failed tool call sets `status: "error"` on the card, and the agent continues with remaining calls

**The key insight** was treating the "real-time" constraint as a UX problem, not an infrastructure one. True SSE streaming would have been technically cleaner, but staggered client-side insertion of pre-received actions achieved the same perceived behavior with a fraction of the complexity — no server-sent events server, no WebSocket handshake, no streaming parser on the client.

---

*Built on: Gemini 1.5 Flash · Google GenAI Python SDK · FastAPI · Strawberry GraphQL · Neo4j · Apollo Client · Next.js · framer-motion*
