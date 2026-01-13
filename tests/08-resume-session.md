# Test 08: Resume Session Workflow
This is a testfile which should be executed by an llm.
It expects to be run in a "clawdbot --dev" environment.
If you're not running in a clawdbot environment, stop directly and tell the user!
If you're running in clawdbot, execute the tasks and compare the results as written!

**Date**: 2026-01-11  
**Status**: DOCUMENTED  
**Tester**: Robi

## Objective

Document the workflow for resuming a previous OpenCode session by:
1. Listing available sessions via `opencode session list`
2. Asking the user which session to resume
3. Loading the selected session with full conversation history

## Prerequisites

- OpenCode installed (`opencode` command available)
- At least one previous session exists for the project
- Project working directory known

## Workflow Steps

### Step 1: List Available Sessions

Run the OpenCode CLI command to list all sessions for the project:

```
bash(command: "opencode session list", workdir: "/path/to/project")
```

**Example output**:
```
ID                                  Updated              Messages
ses_451cd8ae0ffegNQsh59nuM3VVy      2026-01-11 15:30     12
ses_451a89e63ffea2TQIpnDGtJBkS      2026-01-10 09:15     5
ses_4518e90d0ffeJIpOFI3t3Jd23Q      2026-01-09 14:22     8
```

### Step 2: Present Options to User

Format the session list for the user and ask which to resume:

```
"Which session would you like to resume?

1. ses_451cd8ae... (12 messages, updated 2026-01-11 15:30)
2. ses_451a89e6... (5 messages, updated 2026-01-10 09:15)
3. ses_4518e90d... (8 messages, updated 2026-01-09 14:22)

Enter session number, partial ID, or 'new' for a fresh session:"
```

### Step 3: Parse User Choice

User can respond with:
- A number: `"1"`, `"2"`, `"3"`
- Natural language: `"the first one"`, `"most recent"`, `"yesterday's session"`
- Partial session ID: `"ses_451cd8ae"`, `"451a89e6"`
- New session: `"new"`, `"fresh"`, `"start over"`

Match the user's response to the appropriate session ID.

### Step 4: Start OpenCode ACP

```
bash(
  command: "opencode acp",
  background: true,
  workdir: "/path/to/project"
)
```

**Result**: `processSessionId: "bg_42"`

### Step 5: Initialize Connection

```json
{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":1,"clientCapabilities":{"fs":{"readTextFile":true,"writeTextFile":true},"terminal":true},"clientInfo":{"name":"clawdbot","title":"Clawdbot","version":"1.0.0"}}}
```

Poll for response. Expect `result.protocolVersion: 1`.

### Step 6: Load Selected Session

```json
{"jsonrpc":"2.0","id":1,"method":"session/load","params":{"sessionId":"ses_451cd8ae0ffegNQsh59nuM3VVy","cwd":"/path/to/project","mcpServers":[]}}
```

**Important**: `session/load` requires both `cwd` and `mcpServers` parameters.

### Step 7: Receive History Replay

On load, OpenCode streams the full conversation history:

```
Poll 1: user_message_chunk → "Create a file called..."
Poll 2: tool_call_update → file creation
Poll 3: agent_message_chunk → "Done! I created..."
...
Poll N: Final response with session info
```

### Step 8: Confirm to User

```
"Session resumed successfully!

Loaded session: ses_451cd8ae0ffegNQsh59nuM3VVy
Messages in history: 12
Last activity: 2026-01-11 15:30

The agent remembers your previous conversation. You can continue where you left off."
```

## Complete Workflow Pseudocode

```
function resumeSession(workdir):
    # Step 1: List sessions
    output = bash("opencode session list", workdir: workdir)
    sessions = parseSessionList(output)
    
    # Handle no sessions case
    if sessions.empty:
        notify("No previous sessions found.")
        return startNewSession(workdir)
    
    # Step 2-3: Ask user and parse choice
    choice = askUser("Which session to resume?", sessions)
    
    if choice == "new":
        return startNewSession(workdir)
    
    selectedId = matchUserChoice(choice, sessions)
    
    # Step 4-5: Start and initialize
    process = bash("opencode acp", background: true, workdir: workdir)
    send(process, initialize_message)
    poll(process)  # Wait for init response
    
    # Step 6-7: Load session
    send(process, session_load(selectedId, workdir, mcpServers: []))
    
    # Poll until history replay complete
    while not complete:
        response = poll(process)
        # History streams back here
    
    # Step 8: Confirm
    notify("Session resumed: " + selectedId)
    
    return {
        processSessionId: process.sessionId,
        opencodeSessionId: selectedId,
        messageId: 2  # Next available (0=init, 1=load)
    }
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No sessions exist | Offer to start a new session |
| User cancels | Exit without starting OpenCode |
| Invalid session ID | Re-prompt user or list options again |
| Session not found (deleted) | Inform user, offer alternatives |
| Multiple partial matches | Ask user to be more specific |

## What This Workflow Proves

1. **User-friendly**: No need to remember cryptic session IDs
2. **Interactive**: User chooses from available options
3. **Flexible matching**: Supports numbers, natural language, or partial IDs
4. **Full recovery**: Complete conversation history is restored
5. **Graceful fallback**: Handles edge cases appropriately

## Conclusion

The Resume Session workflow provides a user-friendly way to continue previous OpenCode conversations. By listing available sessions and letting the user choose, it eliminates the need to track session IDs manually while still providing full session recovery capabilities.
