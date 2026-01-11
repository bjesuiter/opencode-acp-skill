# Test 02: Inspect Running OpenCode Instance

**Date**: 2026-01-11  
**Status**: ✅ PASSED  
**Tester**: Robi 🤖

## Objective

Verify that a running OpenCode ACP instance can be inspected and monitored using Clawdbot's process tools.

## Prerequisites

- An OpenCode ACP instance already running (from Test 01)

## Test Steps

### Step 1: List Running Processes

```
process(action: "list")
```

**Expected**: Shows the running OpenCode process with sessionId and runtime  
**Actual**: ✅ 
```
68707955 running   8m46s :: opencode acp
```

### Step 2: Check System Process Details

```bash
ps aux | grep "opencode acp"
```

**Expected**: Shows system PID(s) for the OpenCode process  
**Actual**: ✅
```
USER        PID   %CPU %MEM     VSZ     RSS  STAT  TIME COMMAND
bjesuiter  5711   0.2  0.9  508MB   350MB   S     0:05 opencode acp
bjesuiter  5663   0.0  0.0  435MB    10MB   Ss    0:00 fish -c opencode acp
```

## Key Identifiers

| Identifier | Value | Purpose |
|------------|-------|---------|
| **Clawdbot sessionId** | `68707955-3aaa-466b-a99f-e44298559497` | Use with `process` tool |
| **Shell PID** | `5663` | Parent shell process |
| **OpenCode PID** | `5711` | Actual opencode process |

## Available Process Commands

| Command | Purpose |
|---------|---------|
| `process(action: "list")` | List all background processes |
| `process(action: "poll", sessionId: "...")` | Get new output since last poll |
| `process(action: "log", sessionId: "...")` | Get full process output log |
| `process(action: "kill", sessionId: "...")` | Terminate the process |

## Observations

1. **Two PIDs**: OpenCode runs as a child of the shell process
2. **Shell**: Fish 🐟 (`/Users/bjesuiter/.homebrew/bin/fish -c opencode acp`) — Clawdbot uses the user's default shell with `-c` (command mode)
3. **Short sessionId**: Clawdbot shows truncated sessionId (`68707955`) in list view
4. **Full sessionId**: Required for process commands (`68707955-3aaa-466b-a99f-e44298559497`)
5. **Runtime tracking**: Clawdbot tracks how long the process has been running

## Conclusion

Running OpenCode ACP instances can be easily monitored using:
- Clawdbot's `process(action: "list")` for quick overview
- System `ps` command for detailed process information
- Both the Clawdbot sessionId and system PID are available for management
