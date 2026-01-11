# OpenCode ACP Skill - Specification

> Skill for clawdbot to control OpenCode via Agent Client Protocol (ACP)

## Overview

This skill teaches clawdbot how to communicate directly with OpenCode using the ACP protocol. Instead of a CLI wrapper, clawdbot becomes a native ACP client using its built-in `bash` and `process` tools.

### Architecture

```
Clawdbot
    |
    +-- bash tool (background: true)
    |      +-- starts: opencode acp
    |
    +-- process tool
           +-- write: send JSON-RPC messages (stdin)
           +-- poll: receive JSON-RPC responses (stdout)
```

### Key Benefits

- No additional CLI layer to maintain
- Direct ACP protocol communication
- Leverages clawdbot's native background process management
- Each `bash` spawn creates an isolated OpenCode instance

---

## Session Management

### Multiple Sessions

Each OpenCode instance runs in its own clawdbot background process. To manage multiple projects:

| Concept | Clawdbot Level | OpenCode/ACP Level |
|---------|----------------|-------------------|
| Process | `bash` sessionId | N/A |
| Session | N/A | ACP `sessionId` |

- **Clawdbot process sessionId**: Identifies the background `opencode acp` process
- **ACP sessionId**: Identifies the conversation within that OpenCode instance

### Lifecycle

```
1. START       bash(command: "opencode acp", background: true)
                 -> returns clawdbot processSessionId
                 
2. INITIALIZE  process.write(initialize request)
               process.poll() -> initialize response
               
3. NEW SESSION process.write(session/new request)
               process.poll() -> session/new response with ACP sessionId
               
4. PROMPT      process.write(session/prompt)
               process.poll() -> session/update notifications (repeat)
               process.poll() -> session/prompt response (stopReason)
               
5. [OPTIONAL]  session/cancel, session/load, session/set_mode
               
6. TERMINATE   process.kill(processSessionId)
```

---

## Polling Strategy

### Current Implementation (v1)

- **Interval**: 2 seconds between polls
- **Timeout**: Poll until `stopReason` is received or max attempts reached
- **Max attempts**: 150 (= 5 minutes max wait time)

### Response Handling

Each `process.poll()` may return:
- Multiple newline-delimited JSON-RPC messages
- Mix of notifications (`session/update`) and responses
- Empty output (agent still thinking)

**Parsing Strategy**:
1. Split output by newlines
2. Parse each line as JSON
3. Collect `session/update` notifications
4. Look for response matching the request `id`

---

## ACP Protocol Reference

### JSON-RPC Message Format

All messages are JSON-RPC 2.0, newline-delimited:

```json
{"jsonrpc": "2.0", "id": 1, "method": "...", "params": {...}}
```

### Message ID Counter

Clawdbot must maintain a counter for JSON-RPC message IDs:
- Start at `0` for `initialize`
- Increment for each request
- Notifications from agent have no `id`

---

## Message Templates

### 1. Initialize

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "method": "initialize",
  "params": {
    "protocolVersion": 1,
    "clientCapabilities": {
      "fs": { "readTextFile": true, "writeTextFile": true },
      "terminal": true
    },
    "clientInfo": {
      "name": "clawdbot",
      "title": "Clawdbot AI Assistant",
      "version": "1.0.0"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "result": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "loadSession": true,
      "promptCapabilities": { "image": true, "embeddedContext": true }
    },
    "agentInfo": { "name": "opencode", "version": "..." }
  }
}
```

### 2. Create Session

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "session/new",
  "params": {
    "cwd": "/path/to/project",
    "mcpServers": []
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "sessionId": "sess_abc123def456",
    "modes": {
      "currentModeId": "code",
      "availableModes": [...]
    }
  }
}
```

### 3. Send Prompt

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "session/prompt",
  "params": {
    "sessionId": "sess_abc123def456",
    "prompt": [
      { "type": "text", "text": "What files are in this directory?" }
    ]
  }
}
```

**Notifications (streamed):**
```json
{"jsonrpc": "2.0", "method": "session/update", "params": {"sessionId": "...", "update": {"sessionUpdate": "agent_message_chunk", "content": {"type": "text", "text": "Let me check..."}}}}
{"jsonrpc": "2.0", "method": "session/update", "params": {"sessionId": "...", "update": {"sessionUpdate": "tool_call", "toolCallId": "call_001", "title": "List files", "status": "pending"}}}
```

**Final Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": { "stopReason": "end_turn" }
}
```

### 4. Cancel Prompt

**Notification (no response expected):**
```json
{
  "jsonrpc": "2.0",
  "method": "session/cancel",
  "params": { "sessionId": "sess_abc123def456" }
}
```

---

## State Tracking

Clawdbot must track per OpenCode instance:

| State | Description | Example |
|-------|-------------|---------|
| `processSessionId` | Clawdbot's background process ID | `"bg_12345"` |
| `acpSessionId` | OpenCode's session ID | `"sess_abc123"` |
| `messageIdCounter` | JSON-RPC request ID | `3` |
| `cwd` | Working directory | `"/home/user/project"` |
| `initialized` | Whether initialize handshake done | `true` |

---

## Error Handling

### Process Errors

| Error | Detection | Action |
|-------|-----------|--------|
| OpenCode not found | `process.poll()` returns error | Inform user to install OpenCode |
| Process crashed | `process.poll()` shows exit status | Restart or inform user |
| Timeout | No response after max attempts | Cancel and inform user |

### Protocol Errors

| Error | Detection | Action |
|-------|-----------|--------|
| Invalid JSON | Parse error | Log and retry poll |
| Unknown method | Error response | Log and continue |
| Session not found | Error response | Create new session |

---

## Example Workflows

### Workflow 1: Start OpenCode and Ask a Question

```
1. bash(command: "opencode acp", background: true)
   -> processSessionId: "bg_001"

2. process.write(sessionId: "bg_001", data: '{"jsonrpc":"2.0","id":0,"method":"initialize",...}\n')

3. process.poll(sessionId: "bg_001")
   -> initialize response (check protocolVersion)

4. process.write(sessionId: "bg_001", data: '{"jsonrpc":"2.0","id":1,"method":"session/new",...}\n')

5. process.poll(sessionId: "bg_001")
   -> session/new response with acpSessionId

6. process.write(sessionId: "bg_001", data: '{"jsonrpc":"2.0","id":2,"method":"session/prompt",...}\n')

7. LOOP: process.poll(sessionId: "bg_001") every 2 seconds
   -> collect session/update notifications
   -> until stopReason received
```

### Workflow 2: Check Status of Running Session

```
1. process.list()
   -> find processSessionId for OpenCode

2. process.poll(sessionId: "bg_001")
   -> check if still receiving updates or idle
```

### Workflow 3: Terminate Session

```
1. process.kill(sessionId: "bg_001")
   -> OpenCode process terminated
```

---

## Future Enhancements (v2+)

- [ ] Continuous polling option for real-time streaming
- [ ] Session persistence (save/load ACP sessionId)
- [ ] MCP server passthrough (connect clawdbot's MCPs to OpenCode)
- [ ] Permission request handling (`session/request_permission`)
- [ ] Mode switching (`session/set_mode`)
- [ ] File system method handling (`fs/read_text_file`, `fs/write_text_file`)

---

## References

- ACP Protocol Documentation (for LLMs): https://agentclientprotocol.com/llms.txt
- ACP Official Website: https://agentcommunicationprotocol.dev/introduction/welcome
- Local protocol docs: `docs/acp/` in this repository
