# Test 04: Multiple OpenCode Instances

## Goal
Verify multiple OpenCode ACP instances can run concurrently and operate independently.

## Guardrail
- This test must run in a `clawdbot --dev` environment.
- If not running in clawdbot, stop and report the test as not run.

## Prerequisites
- `playground/` exists and is writable.

## Reporting
- Use the suite report file in `reports/` (one markdown file per full suite run).
- Append a section named `## Test 04: Multiple OpenCode Instances` with status, evidence, and notes.

## Test Steps

### Step 1: Start Instance 2
```
bash(
  command: "opencode acp",
  workdir: "/path/to/playground",
  background: true
)
```
**Expected**: A new `processSessionId` is returned.

### Step 2: Initialize + Create Session (Instance 2)
```json
{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":1,"clientCapabilities":{"fs":{"readTextFile":true,"writeTextFile":true},"terminal":true},"clientInfo":{"name":"clawdbot","title":"Clawdbot","version":"1.0.0"}}}
```
```json
{"jsonrpc":"2.0","id":1,"method":"session/new","params":{"cwd":"/path/to/playground","mcpServers":[]}}
```
**Expected**: Response includes `protocolVersion: 1` and a new `sessionId`.

### Step 3: Start Instance 3
```
bash(
  command: "opencode acp",
  workdir: "/path/to/playground",
  background: true
)
```
**Expected**: A different `processSessionId` is returned.

### Step 4: Initialize + Create Session (Instance 3)
```json
{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":1,"clientCapabilities":{"fs":{"readTextFile":true,"writeTextFile":true},"terminal":true},"clientInfo":{"name":"clawdbot","title":"Clawdbot","version":"1.0.0"}}}
```
```json
{"jsonrpc":"2.0","id":1,"method":"session/new","params":{"cwd":"/path/to/playground","mcpServers":[]}}
```
**Expected**: Response includes `protocolVersion: 1` and a new `sessionId`.

### Step 5: Create Files from Each Instance
```json
{"jsonrpc":"2.0","id":2,"method":"session/prompt","params":{"sessionId":"<sessionId-2>","prompt":[{"type":"text","text":"Create a file called 02-FIRST.md with a short greeting."}]}}
```
```json
{"jsonrpc":"2.0","id":2,"method":"session/prompt","params":{"sessionId":"<sessionId-3>","prompt":[{"type":"text","text":"Create a file called 03-FIRST.md with a short greeting."}]}}
```
**Expected**: Both prompts complete with `stopReason: "end_turn"`.

### Step 6: Verify Files and Concurrency
- Confirm `playground/02-FIRST.md` and `playground/03-FIRST.md` exist.
- Run `process(action: "list")` and confirm two running `opencode acp` processes.

## Assertions
- Two distinct `processSessionId` values returned.
- Two distinct `sessionId` values returned.
- Both files created in `playground/`.
- Process list shows both instances running.

## Report Template
```
## Test 04: Multiple OpenCode Instances
- Status: pass | fail | not run
- Evidence:
  - processSessionId-2: <id>
  - processSessionId-3: <id>
  - opencodeSessionId-2: <id>
  - opencodeSessionId-3: <id>
  - Files: playground/02-FIRST.md, playground/03-FIRST.md
- Notes: <optional>
```
