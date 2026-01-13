# Test 06: Session Persistence (Load Previous Session)

## Goal
Verify a new OpenCode ACP process can load and continue a previous session with full history.

## Guardrail
- This test must run in a `clawdbot --dev` environment.
- If not running in clawdbot, stop and report the test as not run.

## Prerequisites
- A previous ACP session exists with known `sessionId`.
- That original ACP process is no longer running.

## Reporting
- Use the suite report file in `reports/` (one markdown file per full suite run).
- Append a section named `## Test 06: Session Persistence (Load Previous Session)` with status, evidence, and notes.

## Test Steps

### Step 1: Start New ACP Process
```
bash(command: "opencode acp", background: true)
```
**Expected**: A new `processSessionId` is returned.

### Step 2: Initialize
```json
{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":1,"clientCapabilities":{"fs":{"readTextFile":true,"writeTextFile":true},"terminal":true},"clientInfo":{"name":"clawdbot","title":"Clawdbot","version":"1.0.0"}}}
```
**Expected**: Response includes `result.agentCapabilities.loadSession: true`.

### Step 3: Load Previous Session (Required Params)
```json
{"jsonrpc":"2.0","id":1,"method":"session/load","params":{"sessionId":"<previous-sessionId>","cwd":"/path/to/playground","mcpServers":[]}}
```
**Expected**: History replay begins and the session is loaded.

### Step 4: Ask About Prior Actions
```json
{"jsonrpc":"2.0","id":2,"method":"session/prompt","params":{"sessionId":"<previous-sessionId>","prompt":[{"type":"text","text":"What have you done first?"}]}}
```
**Expected**: Response references the original first action from the prior session.

## Assertions
- `initialize` indicates `loadSession: true`.
- `session/load` succeeds with `cwd` and `mcpServers` provided.
- Loaded session can answer questions about prior actions.

## Report Template
```
## Test 06: Session Persistence (Load Previous Session)
- Status: pass | fail | not run
- Evidence:
  - processSessionId: <id>
  - loaded sessionId: <id>
  - sample reply: <quote>
- Notes: <optional>
```
