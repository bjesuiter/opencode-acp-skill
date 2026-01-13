# Test 01: Create File via ACP

## Goal
Validate that the opencode-acp skill can start OpenCode, initialize ACP, create a session, and create a file via `session/prompt`.

## Guardrail
- This test must run in a `clawdbot --dev` environment.
- If not running in clawdbot, stop and report the test as not run.

## Prerequisites
- OpenCode installed (`opencode` command available)
- OpenCode configured with valid API credentials
- Empty `playground/` folder as working directory

## Reporting
- Use the suite report file in `reports/` (one markdown file per full suite run).
- Append a section named `## Test 01: Create File via ACP` with status, evidence, and notes.

## Test Steps

### Step 1: Start OpenCode ACP
```
bash(
  command: "opencode acp",
  workdir: "/path/to/playground",
  background: true
)
```
**Expected**: A `processSessionId` is returned.

### Step 2: Initialize ACP
```json
{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":1,"clientCapabilities":{"fs":{"readTextFile":true,"writeTextFile":true},"terminal":true},"clientInfo":{"name":"clawdbot","title":"Clawdbot","version":"1.0.0"}}}
```
**Expected**: Response includes `result.protocolVersion: 1`.

### Step 3: Create Session
```json
{"jsonrpc":"2.0","id":1,"method":"session/new","params":{"cwd":"/path/to/playground","mcpServers":[]}}
```
**Expected**: Response includes a new `sessionId`.

### Step 4: Create a File via Prompt
```json
{"jsonrpc":"2.0","id":2,"method":"session/prompt","params":{"sessionId":"<sessionId>","prompt":[{"type":"text","text":"Create a file called FIRST.md in the current directory with a simple greeting message."}]}}
```
**Expected**: Streamed updates end with `stopReason: "end_turn"`.

### Step 5: Verify File Contents
- Read `playground/FIRST.md`.
- Confirm the file exists and contains a short greeting message.

## Assertions
- `processSessionId` was returned from `bash`.
- `initialize` responded with `protocolVersion: 1`.
- `session/new` returned a `sessionId`.
- `session/prompt` completed with `stopReason: "end_turn"`.
- `playground/FIRST.md` exists with greeting content.

## Report Template
```
## Test 01: Create File via ACP
- Status: pass | fail | not run
- Evidence:
  - processSessionId: <id>
  - opencodeSessionId: <sessionId>
  - File: playground/FIRST.md
- Notes: <optional>
```
