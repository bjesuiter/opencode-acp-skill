# Test 08: Named Sessions with Auto-Recovery

**Date**: 2026-01-11  
**Status**: ✅ PASSED  
**Tester**: Robi 🤖

## Objective

Design and test a session naming system that:
1. Maps human-readable labels to ACP sessionIds
2. Tracks processSessionIds for active connections
3. Auto-recovers sessions when processes are lost

## Session Registry Design

Store session mappings in `sessions.json`:

```json
{
  "sessions": {
    "project1": {
      "acpSessionId": "ses_4518e90d0ffeJIpOFI3t3Jd23Q",
      "processSessionId": "4f7a49d2-...",
      "cwd": "/path/to/playground",
      "messageId": 3
    },
    "project2": {
      "acpSessionId": "ses_4518ddba4ffeRL4IG41jPdFQ1r",
      "processSessionId": "3aef063d-...",
      "cwd": "/path/to/playground",
      "messageId": 3
    },
    "project3": {
      "acpSessionId": "ses_4518ca338ffeUfqP5gdu5vS6ed",
      "processSessionId": "4867b0db-...",
      "cwd": "/path/to/playground",
      "messageId": 3
    }
  }
}
```

## Test Steps

### Step 1: Create Named Sessions

Started 3 OpenCode instances with labels:

| Label | acpSessionId | processSessionId | Created File |
|-------|--------------|------------------|--------------|
| project1 | `ses_4518e90d0ffe...` | `4f7a49d2-...` | project1.md |
| project2 | `ses_4518ddba4ffe...` | `3aef063d-...` | project2.md |
| project3 | `ses_4518ca338ffe...` | `4867b0db-...` | project3.md |

Each instance was told its identity: "You are projectX"

### Step 2: Save Session Registry

Saved mappings to `sessions.json` with:
- Label → acpSessionId (for recovery)
- processSessionId (for active connection check)
- cwd (for session/load)
- messageId (for next request)

### Step 3: Kill All Processes

```
process(action: "kill", ...) × 3
```

All connections lost — simulates Clawdbot restart.

### Step 4: Reconnect by Label

Workflow to reconnect to "project2":

```
1. Read sessions.json
2. Look up "project2" → acpSessionId: ses_4518ddba4ffeRL4IG41jPdFQ1r
3. Start new OpenCode process
4. Initialize
5. session/load(sessionId: "ses_4518ddba4ffeRL4IG41jPdFQ1r", cwd: "...", mcpServers: [])
6. Update processSessionId in sessions.json
```

### Step 5: Verify Identity

```json
{"jsonrpc":"2.0","id":2,"method":"session/prompt","params":{
  "sessionId":"ses_4518ddba4ffeRL4IG41jPdFQ1r",
  "prompt":[{"type":"text","text":"Who are you?"}]
}}
```

**Response**: "I am project2."

✅ **Identity preserved across process restart!**

## Auto-Recovery Algorithm

```
function sendToSession(label, prompt):
    session = sessions.json[label]
    
    # Check if process still running
    if process.list().includes(session.processSessionId):
        # Use existing connection
        process.write(session.processSessionId, prompt)
    else:
        # Auto-recover
        newProcess = bash("opencode acp", background: true)
        process.write(newProcess, initialize)
        process.write(newProcess, session/load(session.acpSessionId))
        
        # Update registry
        session.processSessionId = newProcess.sessionId
        save(sessions.json)
        
        # Now send the prompt
        process.write(newProcess, prompt)
```

## Files Created

```
playground/
├── project1.md    "I am project1"
├── project2.md    "I am project2"
├── project3.md    "I am project3"
└── sessions.json  (session registry)
```

## What This Proves

1. **Human-readable labels**: Sessions can be referenced by name, not cryptic IDs
2. **Persistent mapping**: Registry file survives restarts
3. **Auto-recovery**: Lost connections can be transparently re-established
4. **Identity preservation**: Agents remember their assigned identity

## Use Cases

- **Multi-project development**: "project1" for frontend, "project2" for backend
- **Team workflows**: Named sessions for different team members' contexts
- **Long-running tasks**: Resume work on "feature-X" after days/weeks

## Future Enhancements

- [ ] Auto-create sessions.json if missing
- [ ] CLI helper: `opencode send project1 "do something"`
- [ ] Session expiry/cleanup
- [ ] Session metadata (created_at, last_used, description)

## Conclusion

Named sessions with auto-recovery provide a user-friendly abstraction over raw ACP sessionIds. The session registry (`sessions.json`) acts as the durable source of truth, enabling seamless reconnection to any named project.
