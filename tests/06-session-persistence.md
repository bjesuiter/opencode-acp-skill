# Test 06: Session Persistence (Load Previous Session)

**Date**: 2026-01-11  
**Status**: ✅ PASSED  
**Tester**: Robi 🤖

## Objective

Verify that a new OpenCode ACP instance can load and continue a previous session, preserving full conversation history.

## Prerequisites

- Instance 1's session (`ses_451cd8ae0ffegNQsh59nuM3VVy`) previously created FIRST.md and THIRD.md
- Instance 1 process terminated (30min timeout)

## Test Steps

### Step 1: Verify Original Instance Terminated

```
process(action: "list")

68707955 failed    30m00s :: opencode acp  ← Instance 1 (terminated)
```

### Step 2: Start New Instance

```
bash(command: "opencode acp", background: true)
```

**Result**: `processSessionId: 44b1d1d0-e224-4b86-8fe4-a8e2bd2b3bf5`

### Step 3: Initialize

```json
{"jsonrpc":"2.0","id":0,"method":"initialize",...}
```

**Result**: ✅ `loadSession: true` capability confirmed

### Step 4: Load Previous Session

First attempt (failed - missing required params):
```json
{"jsonrpc":"2.0","id":1,"method":"session/load","params":{"sessionId":"ses_451cd8ae0ffegNQsh59nuM3VVy"}}
```

**Error**: `cwd` and `mcpServers` required

Second attempt (success):
```json
{"jsonrpc":"2.0","id":2,"method":"session/load","params":{"sessionId":"ses_451cd8ae0ffegNQsh59nuM3VVy","cwd":"/path/to/playground","mcpServers":[]}}
```

**Result**: ✅ Session loaded with full history replay

### Step 5: History Replay

On load, OpenCode streamed the entire conversation history:

```
1. user_message_chunk: "Create a file called FIRST.md..."
   tool_call_update: Created playground/FIRST.md
   agent_message_chunk: "Done! Created FIRST.md..."

2. user_message_chunk: "Which plugins are loaded?..."
   agent_message_chunk: [MCP servers list]

3. user_message_chunk: "Write all the plugins...to THIRD.md"
   tool_call_update: Created playground/THIRD.md
   agent_message_chunk: "Done! Created THIRD.md..."
```

### Step 6: Ask About Previous Actions

```json
{"jsonrpc":"2.0","id":3,"method":"session/prompt","params":{"sessionId":"ses_451cd8ae0ffegNQsh59nuM3VVy","prompt":[{"type":"text","text":"What have you done first?"}]}}
```

**Response**:
> "I created a file called `FIRST.md` in the current directory with a simple greeting message. Here's what it contained:
> ```markdown
> # Hello!
> 
> Welcome to this project. We're glad you're here.
> ```"

## session/load Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `sessionId` | ✅ | ACP session ID to load |
| `cwd` | ✅ | Working directory |
| `mcpServers` | ✅ | MCP server configuration (can be `[]`) |

## What This Proves

1. **Session persistence**: OpenCode stores session history server-side
2. **Full history replay**: On load, all messages and tool calls are streamed back
3. **Memory preservation**: Agent remembers everything from the previous session
4. **Process independence**: Sessions survive process termination
5. **Cross-instance continuity**: New process can pick up where old one left off

## Use Cases

- **Crash recovery**: Resume work after unexpected termination
- **Long-running tasks**: Continue multi-day development sessions
- **Context switching**: Load different project sessions as needed
- **Debugging**: Reload a session to inspect what happened

## Conclusion

OpenCode ACP sessions persist independently of the running process. A new OpenCode instance can load any previous session using `session/load`, gaining full access to the conversation history and agent memory. This enables robust, resumable AI-assisted workflows.
