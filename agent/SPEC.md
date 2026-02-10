# OpenCode ACP Skill - Specification

> Skill for clawdbot to control OpenCode via Agent Client Protocol (ACP)

## Overview

This skill teaches clawdbot how to communicate directly with OpenCode using the ACP protocol. Two connection modes are supported:

- **Local**: Start `opencode acp` via `bash` and communicate via the `process` tool (stdin/stdout).
- **Remote**: Connect to an OpenCode ACP server already running on another host via a bidirectional channel (e.g. WebSocket or TCP). Same JSON-RPC message format and workflow after connection.

### Architecture

**Local (opencode acp process):**

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

**Remote (ACP server on another host):**

```
Clawdbot
    |
    +-- connect tool (e.g. WebSocket / TCP client)
    |      +-- connect to user-provided URL or host:port
    |
    +-- same JSON-RPC over the channel
           +-- write: send newline-delimited JSON-RPC
           +-- read/poll: receive newline-delimited JSON-RPC
```

### Key Benefits

- No additional CLI layer to maintain
- Direct ACP protocol communication
- **Local**: Leverages clawdbot's native background process management; each `bash` spawn is an isolated OpenCode instance
- **Remote**: Use an existing OpenCode ACP server on another machine without starting a local process

---

## Session Management

### Multiple Sessions

**Local:** Each OpenCode instance runs in its own clawdbot background process. **Remote:** Each connection to a remote server can host one or more ACP sessions (session/new per conversation).

| Concept | Local (Clawdbot) | Remote | OpenCode/ACP Level |
|---------|------------------|--------|---------------------|
| Connection | `bash` → processSessionId | connect tool → connectionId | N/A |
| Session | N/A | N/A | ACP `sessionId` |

- **Local**: `processSessionId` identifies the background `opencode acp` process
- **Remote**: `connectionId` (or handle) identifies the open channel to the remote ACP server
- **ACP sessionId**: Identifies the conversation within that OpenCode instance (same in both modes)

### Lifecycle

**Local:**

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

**Remote:** Same steps 2–5; step 1 is “connect to URL/host:port” (returns connectionId), step 6 is “close connection” (no process to kill). List sessions and version check are not available via remote unless the server exposes them.

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

Clawdbot must track per OpenCode connection (local or remote):

| State | Description | Example | Mode |
|-------|-------------|---------|------|
| `processSessionId` | Clawdbot's background process ID (local only) | `"bg_12345"` | Local |
| `connectionId` | Handle from connect tool (remote only) | `"conn_1"` | Remote |
| `acpSessionId` | OpenCode's session ID | `"sess_abc123"` | Both |
| `messageIdCounter` | JSON-RPC request ID | `3` | Both |
| `cwd` | Working directory | `"/home/user/project"` | Both |
| `initialized` | Whether initialize handshake done | `true` | Both |

---

## Error Handling

### Process / Connection Errors

| Error | Detection | Action |
|-------|-----------|--------|
| **Local**: OpenCode not found | `process.poll()` returns error | Inform user to install OpenCode |
| **Local**: Process crashed | `process.poll()` shows exit status | Restart or inform user |
| **Remote**: Connection closed or error | read/poll fails or connection tool reports disconnect | Notify user; they may need to reconnect or restart the remote server |
| Timeout | No response after max attempts | **Local**: Kill process, inform user. **Remote**: Close connection, inform user |

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

### Workflow 3: Terminate Session (local)

```
1. process.kill(sessionId: "bg_001")
   -> OpenCode process terminated
```

### Workflow 4: Connect to remote ACP server and ask a question

```
1. connection = connect(url: "ws://remote-host:4096")   # or TCP; tool depends on environment
   -> connectionId: "conn_1"

2. connection.write('{"jsonrpc":"2.0","id":0,"method":"initialize",...}\n')
   connection.read() or poll() -> initialize response

3. connection.write('{"jsonrpc":"2.0","id":1,"method":"session/new","params":{"cwd":"/path/on/remote","mcpServers":[]}}\n')
   connection.read() -> acpSessionId

4. connection.write('{"jsonrpc":"2.0","id":2,"method":"session/prompt",...}\n')
   Poll/read every 2 sec; collect session/update; stop on stopReason

5. connection.close() when done
```

---

## Future Enhancements (v2+)

- [x] **Remote ACP** – connect to an ACP server on another host (same JSON-RPC, different transport)
- [ ] Continuous polling option for real-time streaming
- [ ] Session persistence (save/load ACP sessionId)
- [ ] MCP server passthrough (connect clawdbot's MCPs to OpenCode)
- [ ] Permission request handling (`session/request_permission`)
- [ ] Mode switching (`session/set_mode`)
- [ ] File system method handling (`fs/read_text_file`, `fs/write_text_file`)
- [ ] Streamable HTTP transport when standardized in ACP

---

## References

- ACP Protocol Documentation (for LLMs): https://agentclientprotocol.com/llms.txt
- ACP Official Website: https://agentcommunicationprotocol.dev/introduction/welcome
- Local protocol docs: `docs/acp/` in this repository
