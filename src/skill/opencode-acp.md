# OpenCode ACP Skill

Control OpenCode directly via the Agent Client Protocol (ACP).

> **More Info**: For detailed ACP protocol documentation, see: https://agentclientprotocol.com/llms.txt

## Quick Reference

| Action | How |
|--------|-----|
| Start OpenCode | `bash(command: "opencode acp", background: true)` |
| Send message | `process.write(sessionId, data: "<json-rpc>\n")` |
| Read response | `process.poll(sessionId)` - repeat every 2 seconds |
| Stop OpenCode | `process.kill(sessionId)` |

## Starting OpenCode

```
bash(
  command: "opencode acp",
  background: true,
  workdir: "/path/to/your/project"
)
```

Save the returned `sessionId` - you'll need it for all subsequent commands.

## Protocol Basics

- All messages are **JSON-RPC 2.0** format
- Messages are **newline-delimited** (end each with `\n`)
- Maintain a **message ID counter** starting at 0

## Step-by-Step Workflow

### Step 1: Initialize Connection

Send immediately after starting OpenCode:

```json
{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":1,"clientCapabilities":{"fs":{"readTextFile":true,"writeTextFile":true},"terminal":true},"clientInfo":{"name":"clawdbot","title":"Clawdbot","version":"1.0.0"}}}
```

Poll for response. Expect `result.protocolVersion: 1`.

### Step 2: Create Session

```json
{"jsonrpc":"2.0","id":1,"method":"session/new","params":{"cwd":"/path/to/project","mcpServers":[]}}
```

Poll for response. Save `result.sessionId` (e.g., `"sess_abc123"`).

### Step 3: Send Prompts

```json
{"jsonrpc":"2.0","id":2,"method":"session/prompt","params":{"sessionId":"sess_abc123","prompt":[{"type":"text","text":"Your question here"}]}}
```

Poll every 2 seconds. You'll receive:
- `session/update` notifications (streaming content)
- Final response with `result.stopReason`

### Step 4: Read Responses

Each poll may return multiple lines. Parse each line as JSON:

- **Notifications**: `method: "session/update"` - collect these for the response
- **Response**: Has `id` matching your request - stop polling when `stopReason` appears

### Step 5: Cancel (if needed)

```json
{"jsonrpc":"2.0","method":"session/cancel","params":{"sessionId":"sess_abc123"}}
```

No response expected - this is a notification.

## State to Track

Per OpenCode instance, track:
- `processSessionId` - from bash tool (clawdbot's process ID)
- `acpSessionId` - from session/new response (OpenCode's session ID)  
- `messageId` - increment for each request you send

## Polling Strategy

- Poll every **2 seconds**
- Continue until you receive a response with `stopReason`
- Max wait: **5 minutes** (150 polls)
- If no response, consider the operation timed out

## Common Stop Reasons

| stopReason | Meaning |
|------------|---------|
| `end_turn` | Agent finished responding |
| `cancelled` | You cancelled the prompt |
| `max_tokens` | Token limit reached |

## Error Handling

| Issue | Solution |
|-------|----------|
| Empty poll response | Keep polling - agent is thinking |
| Parse error | Skip malformed line, continue |
| Process exited | Restart OpenCode |
| No response after 5min | Kill process, start fresh |

## Example: Complete Interaction

```
1. bash(command: "opencode acp", background: true, workdir: "/home/user/myproject")
   -> processSessionId: "bg_42"

2. process.write(sessionId: "bg_42", data: '{"jsonrpc":"2.0","id":0,"method":"initialize",...}\n')
   process.poll(sessionId: "bg_42") -> initialize response

3. process.write(sessionId: "bg_42", data: '{"jsonrpc":"2.0","id":1,"method":"session/new","params":{"cwd":"/home/user/myproject","mcpServers":[]}}\n')
   process.poll(sessionId: "bg_42") -> acpSessionId: "sess_xyz789"

4. process.write(sessionId: "bg_42", data: '{"jsonrpc":"2.0","id":2,"method":"session/prompt","params":{"sessionId":"sess_xyz789","prompt":[{"type":"text","text":"List all TypeScript files"}]}}\n')
   
5. process.poll(sessionId: "bg_42") every 2 sec until stopReason
   -> Collect all session/update content
   -> Final response: stopReason: "end_turn"

6. When done: process.kill(sessionId: "bg_42")
```
