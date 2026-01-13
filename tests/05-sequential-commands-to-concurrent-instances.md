# Test 05: Sequential Commands to Concurrent Instances
This is a testfile which should be executed by an llm.
It expects to be run in a "clawdbot --dev" environment.
If you're not running in a clawdbot environment, stop directly and tell the user!
If you're running in clawdbot, execute the tasks and compare the results as written!

**Date**: 2026-01-11  
**Status**: ✅ PASSED  
**Tester**: Robi 🤖

## Objective

Verify that multiple concurrent OpenCode instances can receive and execute commands sequentially, each maintaining its own message counter and session state.

## Prerequisites

- Instance 2 running (`processSessionId: 9a4d83cb-...`, `opencodeSessionId: ses_451a89e63ffe...`)
- Instance 3 running (`processSessionId: f5cb87db-...`, `opencodeSessionId: ses_451a53b20ffe...`)
- Both instances have already executed one prompt each (messageId 2 used)

## Test Steps

### Step 1: Command to Instance 2

```json
{"jsonrpc":"2.0","id":3,"method":"session/prompt","params":{"sessionId":"ses_451a89e63ffea2TQIpnDGtJBkS","prompt":[{"type":"text","text":"Create a file called 02-SECOND.md with the text: Second file from instance 2"}]}}
```

**Result**: ✅ `stopReason: "end_turn"`  
**File created**: `playground/02-SECOND.md`

### Step 2: Command to Instance 3

```json
{"jsonrpc":"2.0","id":3,"method":"session/prompt","params":{"sessionId":"ses_451a53b20ffeQqA31Wzvp9cBW9","prompt":[{"type":"text","text":"Create a file called 03-SECOND.md with the text: Second file from instance 3"}]}}
```

**Result**: ✅ `stopReason: "end_turn"`  
**File created**: `playground/03-SECOND.md`

## Output Files

```
playground/
├── 02-FIRST.md   ← Instance 2, messageId 2
├── 02-SECOND.md  ← Instance 2, messageId 3   ✨ NEW
├── 03-FIRST.md   ← Instance 3, messageId 2
├── 03-SECOND.md  ← Instance 3, messageId 3   ✨ NEW
├── FIRST.md      ← Instance 1
└── THIRD.md      ← Instance 1
```

**File contents**:
```
02-SECOND.md: "Second file from instance 2"
03-SECOND.md: "Second file from instance 3"
```

## Message ID Tracking

| Instance | Prompt 1 | Prompt 2 | Next Available |
|----------|----------|----------|----------------|
| Instance 2 | id: 2 (02-FIRST.md) | id: 3 (02-SECOND.md) | id: 4 |
| Instance 3 | id: 2 (03-FIRST.md) | id: 3 (03-SECOND.md) | id: 4 |

Note: Both instances use messageId 3 independently — no conflict.

## What This Proves

1. **Independent message counters**: Each instance tracks its own messageId sequence
2. **Session persistence**: Instances maintain state between commands
3. **No interference**: Commands to one instance don't affect the other
4. **Sequential control**: Clawdbot can orchestrate multiple instances in sequence
5. **Reliable routing**: Correct processSessionId + opencodeSessionId routes to correct instance

## Potential Use Case: Parallel Workflows

```
Clawdbot
    ├── Instance 2 → Frontend tasks (React components)
    └── Instance 3 → Backend tasks (API endpoints)
```

Both can work on the same codebase without interfering with each other.

## Conclusion

Multiple concurrent OpenCode instances can be controlled sequentially from a single Clawdbot session. Each maintains independent state, enabling orchestrated parallel development workflows.
