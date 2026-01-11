# Test 07: Restart Recovery (Reconnect After Process Loss)

**Date**: 2026-01-11  
**Status**: ✅ PASSED  
**Tester**: Robi 🤖

## Objective

Verify that OpenCode ACP sessions can be recovered after all Clawdbot processes are terminated (simulating a Clawdbot restart or crash).

## Scenario

Simulate what happens when Clawdbot restarts:
1. All background processes are lost (stdin/stdout pipes broken)
2. Process sessionIds are no longer valid
3. But ACP sessionIds persist server-side

## Prerequisites

- Instance 2 (`ses_451a89e63ffea2TQIpnDGtJBkS`) previously created:
  - `02-FIRST.md`
  - `02-SECOND.md`
- Multiple OpenCode processes running

## Test Steps

### Step 1: Kill All Running Processes

```
process(action: "kill", sessionId: "44b1d1d0-...")  ← Instance 4
process(action: "kill", sessionId: "f5cb87db-...")  ← Instance 3
process(action: "kill", sessionId: "9a4d83cb-...")  ← Instance 2
```

**Result**:
```
44b1d1d0 failed    6m14s :: opencode acp
f5cb87db failed    11m36s :: opencode acp
9a4d83cb failed    15m21s :: opencode acp
68707955 failed    30m00s :: opencode acp
```

All processes terminated. **This simulates Clawdbot losing all connections.**

### Step 2: Start Fresh OpenCode Process

```
bash(command: "opencode acp", background: true)
```

**Result**: New `processSessionId: 473eec3b-f60e-4573-82db-f9f4730c83c9`

### Step 3: Initialize

```json
{"jsonrpc":"2.0","id":0,"method":"initialize",...}
```

**Result**: ✅ `loadSession: true`

### Step 4: Load Previous Session by ACP sessionId

```json
{"jsonrpc":"2.0","id":1,"method":"session/load","params":{
  "sessionId":"ses_451a89e63ffea2TQIpnDGtJBkS",
  "cwd":"/path/to/playground",
  "mcpServers":[]
}}
```

**Result**: ✅ Full history replayed:
```
1. user: "Create a file called 02-FIRST.md..."
   agent: Created 02-FIRST.md

2. user: "Create a file called 02-SECOND.md..."
   agent: Created 02-SECOND.md
```

### Step 5: Verify Memory Intact

```json
{"jsonrpc":"2.0","id":2,"method":"session/prompt","params":{
  "sessionId":"ses_451a89e63ffea2TQIpnDGtJBkS",
  "prompt":[{"type":"text","text":"What files have you created so far?"}]
}}
```

**Response**:
> "I've created two files so far:
> 1. **02-FIRST.md** - Contains: "Hello from the second OpenCode instance!"
> 2. **02-SECOND.md** - Contains: "Second file from instance 2""

## Recovery Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  BEFORE RESTART                                             │
│                                                             │
│  Clawdbot                                                   │
│    ├── processSessionId: 9a4d83cb-...  ──┐                 │
│    │       (stdin/stdout pipes)          │                 │
│    │                                     ▼                 │
│    └────────────────────────────► OpenCode Process         │
│                                     └── opencodeSessionId:      │
│                                         ses_451a89e63ffe   │
└─────────────────────────────────────────────────────────────┘
                           │
                     [RESTART]
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  AFTER RESTART                                              │
│                                                             │
│  Clawdbot (no process references)                          │
│    │                                                        │
│    ├── 1. bash("opencode acp") → NEW processSessionId      │
│    ├── 2. initialize                                        │
│    └── 3. session/load(opencodeSessionId) → RESTORED!           │
│                                                             │
│  ✅ Full conversation history recovered                     │
│  ✅ Agent memory intact                                     │
└─────────────────────────────────────────────────────────────┘
```

## Key Insight

| Handle | Survives Restart? | Notes |
|--------|-------------------|-------|
| Clawdbot `processSessionId` | ❌ No | Lost when process dies |
| ACP `sessionId` | ✅ Yes | Persisted server-side |

**The ACP sessionId is the durable handle for session recovery.**

## What This Proves

1. **Crash resilience**: Sessions survive complete process termination
2. **Restart recovery**: New process can restore any previous session
3. **No data loss**: Full conversation history preserved
4. **Agent continuity**: Agent remembers all previous interactions

## Best Practice

Store ACP sessionIds persistently (file, database) if you need to recover sessions after Clawdbot restarts:

```
# Save after session/new or session/load
echo "ses_451a89e63ffea2TQIpnDGtJBkS" > .opencode-session

# Restore after restart
sessionId=$(cat .opencode-session)
session/load(sessionId: $sessionId, ...)
```

## Conclusion

OpenCode ACP sessions are fully recoverable after Clawdbot restarts. The ACP sessionId acts as a durable handle that can reconnect to any previous session, making the skill resilient to process failures and restarts.
