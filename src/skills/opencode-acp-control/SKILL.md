---
name: opencode-acp-control
description: Control OpenCode locally via ACP (opencode acp process) or remotely via the OpenCode REST API (opencode serve on another host). Start sessions, send prompts, resume conversations, and manage OpenCode updates.
metadata: {"version": "1.3.0", "author": "Benjamin Jesuiter <bjesuiter@gmail.com>", "license": "MIT", "github_url": "https://github.com/bjesuiter/opencode-acp-skill"}
---

# OpenCode ACP Skill

Control OpenCode locally via the Agent Client Protocol (ACP) or remotely via the OpenCode REST API. You can use OpenCode **locally** (start a process on this machine) or **remotely** (talk to an OpenCode server on another host over HTTP).

## Connection Modes

| Mode | When to use |
|------|-------------|
| **Local** | User wants OpenCode to run on the same machine. You start `opencode acp` via bash and talk to it via the process tool (stdin/stdout, JSON-RPC). |
| **Remote** | User provides the base URL of an already-running OpenCode server (e.g. `http://remote-host:4096`). The server is started with `opencode serve`. You use HTTP requests to the REST API—**different protocol** than local ACP. See [OpenCode Server docs](https://opencode.ai/docs/de/server/). |

## Metadata

- For ACP Protocol Docs (for Agents/LLMs): https://agentclientprotocol.com/llms.txt
- GitHub Repo: https://github.com/bjesuiter/opencode-acp-skill
- If you have issues with this skill, please open an issue ticket here: https://github.com/bjesuiter/opencode-acp-skill/issues

## Quick Reference

### Local mode (opencode acp process)

| Action | How |
|--------|-----|
| Start OpenCode | `bash(command: "opencode acp --cwd /path/to/project", background: true)` |
| Send message | `process.write(sessionId, data: "<json-rpc>\n")` |
| Read response | `process.poll(sessionId)` - repeat every 2 seconds |
| Stop OpenCode | `process.kill(sessionId)` |
| List sessions | `bash(command: "opencode session list", workdir: "...")` |
| Resume session | List sessions → ask user → `session/load` |
| **Active session (persistent)** | Use the same `opencodeSessionId` for all prompts until the user asks for a new session or to switch/resume another. Do not call `session/new` again for each prompt. |
| Check version | `bash(command: "opencode --version")` |

### Remote mode (OpenCode REST API – `opencode serve` on another host)

| Action | How |
|--------|-----|
| Base URL | User provides e.g. `http://remote-host:4096`. Server started with `opencode serve [--port 4096] [--hostname 0.0.0.0]`. |
| **Auth (optional)** | Ask the user: "Does the server require HTTP Basic Auth?" If yes, ask for username (default: `opencode`) and password. Include `Authorization: Basic <base64(user:pass)>` in all requests. If no, omit auth. **Not required.** |
| List sessions | `GET {baseUrl}/session` → returns array of sessions. |
| Create session | `POST {baseUrl}/session` body `{}` or `{ title: "..." }` → returns session with `id`. |
| Send message | `POST {baseUrl}/session/{id}/message` body `{ parts: [{ type: "text", text: "..." }] }` → **waits for response** in HTTP body (no polling). |
| Abort | `POST {baseUrl}/session/{id}/abort`. |
| **Active session (persistent)** | Same as local: use one session ID for all messages until the user changes it. |
| **OpenAPI spec** | `{baseUrl}/doc` (e.g. `http://remote-host:4096/doc`) – full request/response schemas. |

## Starting OpenCode (local)

```
bash(
  command: "opencode acp --cwd /path/to/your/project",
  background: true,
  workdir: "/path/to/your/project"
)
```

Save the returned `sessionId` (use it as the target for `process.write` and `process.poll`). You'll need it for all subsequent commands.

## Connecting to a remote OpenCode server (REST API)

When the user wants to use an OpenCode server already running on another host (started with `opencode serve`):

1. **Base URL**  
   User provides the server URL, e.g. `http://remote-host:4096` (default port 4096). Server options: `opencode serve [--port 4096] [--hostname 0.0.0.0]`.

2. **Authentication (optional)**  
   **Ask the user:** "Does the OpenCode server require HTTP Basic Auth?"  
   - If **no** (or user doesn't know): omit authentication.  
   - If **yes**: ask for username (default: `opencode`) and password. Add header `Authorization: Basic <base64(username:password)>` to every HTTP request. Basic Auth is **optional**, not required.

3. **REST API workflow** (not ACP; different protocol):
   - **List sessions:** `GET {baseUrl}/session` → returns `[{ id, title, ... }, ...]`.
   - **Create session:** `POST {baseUrl}/session` body `{}` or `{ title: "..." }` → returns `{ id, ... }`. Store `id` as active session.
   - **Use existing session:** If user gives a session ID or picks from list, use that ID as active session.
   - **Send prompt:** `POST {baseUrl}/session/{id}/message` body `{ parts: [{ type: "text", text: "Your question here" }] }` → response is in the HTTP body; no polling.
   - **Abort:** `POST {baseUrl}/session/{id}/abort`.

4. **State to track (remote)**  
   - `baseUrl` – server URL.
   - `activeSessionId` – session ID (from POST /session or user choice). Reuse until user changes it.
   - Auth credentials (only if user said server requires Basic Auth).

5. **OpenAPI spec**  
   The server publishes the OpenAPI 3.1 specification at **`{baseUrl}/doc`** (e.g. `http://remote-host:4096/doc`). Use this for full request/response schemas. Reference: [OpenCode Server docs](https://opencode.ai/docs/de/server/).

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

### Step 2: Create or choose a session (then keep using it)

**Establish the active session once** (or when the user asks to change it):

- **New session:** Send `session/new`, save `result.sessionId`. Use this ID for all subsequent prompts until the user changes session.
- **Resume / use specific session:** If the user gives a session ID or chooses one from a list, send `session/load` with that ID (and `cwd`, `mcpServers`). Save that session ID as the active one.

```json
{"jsonrpc":"2.0","id":1,"method":"session/new","params":{"cwd":"/path/to/project","mcpServers":[]}}
```

Poll for response. Save `result.sessionId` (e.g., `"sess_abc123"`) as the **active session** for this connection. Use it for every `session/prompt` and `session/cancel` until the user explicitly asks for a new session or to switch to another.

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

**Local (ACP):**
- `processSessionId` – from bash tool.
- `opencodeSessionId` (active session) – from `session/new` or `session/load`; reuse until user changes it.
- `messageId` – increment for each JSON-RPC request.

**Remote (REST API):**
- `baseUrl` – server URL (e.g. `http://remote-host:4096`).
- `activeSessionId` – session ID from `POST /session` or user choice; reuse until user changes it.
- `authHeader` (optional) – `Authorization: Basic ...` only if user said server requires Basic Auth.

## Session persistence

**One active session per ACP connection.** You decide which session is active when you establish the connection or when the user asks to change it. From then on, use that session for every prompt until the user explicitly changes it.

- **Set the active session** (do this once, or when the user switches):
  - User wants a **new** conversation → send `session/new`, store `result.sessionId`.
  - User wants to **resume** or **use a specific session** (e.g. they give an ID or choose from a list) → send `session/load` with that ID (and `cwd`, `mcpServers`), then use that session ID as active.
- **Use it persistently:** For every subsequent `session/prompt` and `session/cancel`, use the same stored `opencodeSessionId`. Do **not** call `session/new` again for each prompt.
- **Change only when the user asks:** e.g. "start a new session", "switch to session X", "resume the other one". Then call `session/new` or `session/load` again and store the new ID.

If the user says they want to "use session X for this connection" or "always use this session until I change it", treat that session as the active one and keep using it until they say otherwise.

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
| **Local**: Process exited | Restart OpenCode (bash again). |
| **Remote**: HTTP error or connection failed | Check baseUrl, auth if required. Notify user to verify server is running (`opencode serve`). |
| No response after 5min | **Local**: Kill process, start fresh. **Remote**: Request likely timed out; notify user. |

## Example: Complete Interaction

```
1. bash(command: "opencode acp --cwd /home/user/myproject", background: true, workdir: "/home/user/myproject")
   -> processSessionId: "bg_42"

2. process.write(sessionId: "bg_42", data: '{"jsonrpc":"2.0","id":0,"method":"initialize",...}\n')
   process.poll(sessionId: "bg_42") -> initialize response

3. process.write(sessionId: "bg_42", data: '{"jsonrpc":"2.0","id":1,"method":"session/new","params":{"cwd":"/home/user/myproject","mcpServers":[]}}\n')
   process.poll(sessionId: "bg_42") -> opencodeSessionId: "sess_xyz789"

4. process.write(sessionId: "bg_42", data: '{"jsonrpc":"2.0","id":2,"method":"session/prompt","params":{"sessionId":"sess_xyz789","prompt":[{"type":"text","text":"List all TypeScript files"}]}}\n')
   
5. process.poll(sessionId: "bg_42") every 2 sec until stopReason
   -> Collect all session/update content
   -> Final response: stopReason: "end_turn"

6. When done: process.kill(sessionId: "bg_42")
```

### Example: Remote (REST API)

```
1. baseUrl = "http://remote-host:4096"
   Ask user: "Does the server require HTTP Basic Auth?" 
   If yes: authHeader = "Authorization: Basic " + base64(username + ":" + password)

2. GET {baseUrl}/session  # optional: list sessions for user to choose

3. POST {baseUrl}/session  body: {}
   -> { id: "ses_xyz789", ... }   # store as activeSessionId

4. POST {baseUrl}/session/ses_xyz789/message  body: { parts: [{ type: "text", text: "List all TypeScript files" }] }
   -> response in HTTP body (no polling)

5. (Later prompts) POST {baseUrl}/session/ses_xyz789/message  with new parts
   Use same session ID until user asks to switch.
```

---

## Resume Session

Resume a previous OpenCode session by letting the user choose from available sessions.

**Local:** Use `bash(command: "opencode session list", ...)` then `session/load`.  
**Remote:** Use `GET {baseUrl}/session` to list sessions; user picks one; use that `id` as the active session for `POST /session/{id}/message`. No separate "load" step—the session is already on the server.

### Step 1: List Available Sessions (local)

Example output:
```
ID                                  Updated              Messages
ses_451cd8ae0ffegNQsh59nuM3VVy      2026-01-11 15:30     12
ses_451a89e63ffea2TQIpnDGtJBkS      2026-01-10 09:15     5
ses_4518e90d0ffeJIpOFI3t3Jd23Q      2026-01-09 14:22     8
```

### Step 2: Ask User to Choose

Present the list to the user and ask which session to resume:

```
"Which session would you like to resume?
 
1. ses_451cd8ae... (12 messages, updated 2026-01-11)
2. ses_451a89e6... (5 messages, updated 2026-01-10)
3. ses_4518e90d... (8 messages, updated 2026-01-09)

Enter session number or ID:"
```

### Step 3: Load Selected Session

Once user responds (e.g., "1", "the first one", or "ses_451cd8ae..."):

1. **Start OpenCode ACP**:
   ```
   bash(command: "opencode acp --cwd /path/to/project", background: true, workdir: "/path/to/project")
   ```

2. **Initialize**:
   ```json
   {"jsonrpc":"2.0","id":0,"method":"initialize","params":{...}}
   ```

3. **Load the session**:
   ```json
   {"jsonrpc":"2.0","id":1,"method":"session/load","params":{"sessionId":"ses_451cd8ae0ffegNQsh59nuM3VVy","cwd":"/path/to/project","mcpServers":[]}}
   ```

**Note**: `session/load` requires `cwd` and `mcpServers` parameters.

On load, OpenCode streams the full conversation history back to you.

### Resume Workflow Summary

```
function resumeSession(workdir):
    # List available sessions
    output = bash("opencode session list", workdir: workdir)
    sessions = parseSessionList(output)
    
    if sessions.empty:
        notify("No previous sessions found. Starting fresh.")
        return createNewSession(workdir)
    
    # Ask user to choose
    choice = askUser("Which session to resume?", sessions)
    selectedId = matchUserChoice(choice, sessions)
    
    # Start OpenCode and load session
    process = bash("opencode acp --cwd " + workdir, background: true, workdir: workdir)
    initialize(process)
    
    session_load(process, selectedId, workdir, mcpServers: [])
    
    notify("Session resumed. Conversation history loaded.")
    return process
```

### Important Notes

- **History replay**: On load, all previous messages stream back
- **Memory preserved**: Agent remembers the full conversation
- **Process independent**: Sessions survive OpenCode restarts
- **Becomes active session**: After `session/load`, use this session ID as the persistent active session for all following prompts until the user changes it (see Session persistence).

---

## Updating OpenCode

OpenCode auto-updates when restarted. Use this workflow to check and trigger updates.

### Step 1: Check Current Version

```
bash(command: "opencode --version")
```

Returns something like: `opencode version 1.1.13`

Extract the version number (e.g., `1.1.13`).

### Step 2: Check Latest Version

```
webfetch(url: "https://github.com/anomalyco/opencode/releases/latest", format: "text")
```

The redirect URL contains the latest version tag:
- Redirects to: `https://github.com/anomalyco/opencode/releases/tag/v1.2.0`
- Extract version from the URL path (e.g., `1.2.0`)

### Step 3: Compare and Update

If latest version > current version:

1. **Stop all running OpenCode processes**:
   ```
   process.list()  # Find all "opencode acp" processes
   process.kill(sessionId) # For each running instance
   ```

2. **Restart instances** (OpenCode auto-downloads new binary on start):
   ```
   bash(command: "opencode acp --cwd /path/to/project", background: true, workdir: "/path/to/project")
   ```

3. **Re-initialize** each instance (initialize + session/load for existing sessions)

### Step 4: Verify Update

```
bash(command: "opencode --version")
```

If version still doesn't match latest:
- Inform user: "OpenCode auto-update may have failed. Current: X.X.X, Latest: Y.Y.Y"
- Suggest manual update: `curl -fsSL https://opencode.dev/install | bash`

### Update Workflow Summary

```
function updateOpenCode():
    current = bash("opencode --version")  # e.g., "1.1.13"
    
    latestPage = webfetch("https://github.com/anomalyco/opencode/releases/latest")
    latest = extractVersionFromRedirectUrl(latestPage)  # e.g., "1.2.0"
    
    if semverCompare(latest, current) > 0:
        # Stop all instances
        for process in process.list():
            if process.command.includes("opencode"):
                process.kill(process.sessionId)
        
        # Wait briefly for processes to terminate
        sleep(2 seconds)
        
        # Restart triggers auto-update
        bash("opencode acp", background: true)
        
        # Verify
        newVersion = bash("opencode --version")
        if newVersion != latest:
            notify("Auto-update may have failed. Manual update recommended.")
    else:
        notify("OpenCode is up to date: " + current)
```

### Important Notes

- **Sessions persist**: `opencodeSessionId` survives restarts — use `session/load` to recover
- **Auto-update**: OpenCode downloads new binary automatically on restart
- **No data loss**: Conversation history is preserved server-side
