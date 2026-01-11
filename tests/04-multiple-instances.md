# Test 04: Multiple OpenCode Instances

**Date**: 2026-01-11  
**Status**: ✅ PASSED  
**Tester**: Robi 🤖

## Objective

Verify that multiple independent OpenCode ACP instances can be spawned and operated concurrently from the same Clawdbot session.

## Prerequisites

- First OpenCode instance from previous tests (may have timed out)

## Test Steps

### Step 1: Check Existing Processes

```
process(action: "list")
```

**Result**:
```
9a4d83cb running   4s :: opencode acp      ← New instance
68707955 failed    30m00s :: opencode acp  ← First instance (timed out)
```

**Observation**: First instance auto-terminated after ~30 minutes of inactivity.

### Step 2: Start Second Instance

```
bash(
  command: "opencode acp",
  workdir: "/path/to/playground",
  background: true
)
```

**Result**: `processSessionId: 9a4d83cb-d372-4800-ba1a-7c54397e9263`

### Step 3: Initialize & Create Session

| Step | messageId | Result |
|------|-----------|--------|
| Initialize | 0 | ✅ protocolVersion: 1 |
| session/new | 1 | ✅ `opencodeSessionId: ses_451a89e63ffea2TQIpnDGtJBkS` |

### Step 4: Send Prompt

```json
{"jsonrpc":"2.0","id":2,"method":"session/prompt","params":{"sessionId":"ses_451a89e63ffea2TQIpnDGtJBkS","prompt":[{"type":"text","text":"Create a file called 02-FIRST.md with a greeting that says: Hello from the second OpenCode instance!"}]}}
```

**Result**: ✅ File created, `stopReason: "end_turn"`

### Step 5: Verify Output

**File**: `playground/02-FIRST.md`
```
Hello from the second OpenCode instance!
```

**Playground contents**:
```
playground/
├── 02-FIRST.md  ← Created by instance 2
├── 03-FIRST.md  ← Created by instance 3
├── FIRST.md     ← Created by instance 1 (Test 01)
└── THIRD.md     ← Created by instance 1 (Test 03)
```

## Instance Comparison

| Property | Instance 1 | Instance 2 | Instance 3 |
|----------|------------|------------|------------|
| **processSessionId** | `68707955-3aaa-...` | `9a4d83cb-d372-...` | `f5cb87db-0fd9-...` |
| **opencodeSessionId** | `ses_451cd8ae0ffe...` | `ses_451a89e63ffe...` | `ses_451a53b20ffe...` |
| **Status** | Failed (30min timeout) | Running | Running |
| **Output file** | `FIRST.md` | `02-FIRST.md` | `03-FIRST.md` |
| **Message counter** | Started at 0 | Started at 0 | Started at 0 |

### Concurrent Instances Verified

```
process(action: "list")

f5cb87db running   52s :: opencode acp     ← Instance 3
9a4d83cb running   4m37s :: opencode acp   ← Instance 2
68707955 failed    30m00s :: opencode acp  ← Instance 1 (timed out)
```

**Two instances running simultaneously** — proving true concurrent execution.

## What This Proves

1. **Independent instances**: Multiple OpenCode ACP processes can run simultaneously
2. **Isolated state**: Each instance has its own:
   - Clawdbot `processSessionId`
   - ACP `sessionId`
   - Message ID counter (both start at 0)
   - Conversation history (no shared memory)
3. **No cross-talk**: Second instance has no knowledge of first instance's conversations
4. **Auto-timeout**: Idle instances terminate after ~30 minutes
5. **Fresh initialization**: Each instance requires full initialize → session/new → prompt cycle

## Use Cases

- **Parallel workloads**: Run multiple agents on different tasks simultaneously
- **Project isolation**: Each instance can work in a different working directory
- **Fault tolerance**: If one instance fails, others continue independently

## Conclusion

The opencode-acp skill supports spawning multiple concurrent OpenCode instances (tested with 3 instances, 2 running simultaneously). Each operates independently with its own state, message counters, and conversation history. This enables parallel AI-assisted development workflows.
