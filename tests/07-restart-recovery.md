# Test 07: Restart Recovery (Reconnect After Process Loss)

## Goal
Verify ACP sessions can be recovered after all Clawdbot background processes are terminated.

## Guardrail
- This test must run in a `clawdbot --dev` environment.
- If not running in clawdbot, stop and report the test as not run.

## Prerequisites
- At least one ACP session exists with known `sessionId`.
- Multiple OpenCode ACP processes are running.

## Reporting
- Use the suite report file in `reports/` (one markdown file per full suite run).
- Append a section named `## Test 07: Restart Recovery (Reconnect After Process Loss)` with status, evidence, and notes.

## Test Steps

### Step 1: Kill All Running Processes
```
process(action: "list")
process(action: "kill", sessionId: "<processSessionId-1>")
process(action: "kill", sessionId: "<processSessionId-2>")
```
**Expected**: All listed ACP processes are terminated.

### Step 2: Start Fresh ACP Process
```
bash(command: "opencode acp", background: true)
```
**Expected**: A new `processSessionId` is returned.

### Step 3: Initialize
```json
{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":1,"clientCapabilities":{"fs":{"readTextFile":true,"writeTextFile":true},"terminal":true},"clientInfo":{"name":"clawdbot","title":"Clawdbot","version":"1.0.0"}}}
```
**Expected**: `loadSession` capability is available.

### Step 4: Load Previous Session
```json
{"jsonrpc":"2.0","id":1,"method":"session/load","params":{"sessionId":"<previous-sessionId>","cwd":"/path/to/playground","mcpServers":[]}}
```
**Expected**: History replay occurs and session is active.

### Step 5: Verify Memory
```json
{"jsonrpc":"2.0","id":2,"method":"session/prompt","params":{"sessionId":"<previous-sessionId>","prompt":[{"type":"text","text":"What files have you created so far?"}]}}
```
**Expected**: Response lists files from the previous session.

## Assertions
- All prior processes are terminated before restart.
- `session/load` restores the session after restart.
- Agent response confirms memory of prior actions.

## Report Template
```
## Test 07: Restart Recovery (Reconnect After Process Loss)
- Status: pass | fail | not run
- Evidence:
  - killed processSessionIds: <ids>
  - loaded sessionId: <id>
  - sample reply: <quote>
- Notes: <optional>
```
