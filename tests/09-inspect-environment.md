# Test 09: Inspect Environment

## Goal
Verify environment information can be retrieved via ACP responses.

## Guardrail
- This test must run in a `clawdbot --dev` environment.
- If not running in clawdbot, stop and report the test as not run.

## Prerequisites
- OpenCode installed (`opencode` command available).

## Reporting
- Use the suite report file in `reports/` (one markdown file per full suite run).
- Append a section named `## Test 09: Inspect Environment` with status, evidence, and notes.

## Test Steps

### Step 1: Initialize and Read Agent Info
```json
{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":1,"clientCapabilities":{"fs":{"readTextFile":true,"writeTextFile":true},"terminal":true},"clientInfo":{"name":"clawdbot","title":"Clawdbot","version":"1.0.0"}}}
```
**Expected**: Response includes `result.agentInfo.name` and `result.agentInfo.version`.

### Step 2: Create Session and Read Modes/Models
```json
{"jsonrpc":"2.0","id":1,"method":"session/new","params":{"cwd":"/path/to/playground","mcpServers":[]}}
```
**Expected**: Response includes `modes.currentModeId` and `models.currentModelId`.

## Assertions
- `agentInfo.name` and `agentInfo.version` are present.
- `modes.currentModeId` is present.
- `models.currentModelId` is present.

## Report Template
```
## Test 09: Inspect Environment
- Status: pass | fail | not run
- Evidence:
  - agentInfo.name: <value>
  - agentInfo.version: <value>
  - modes.currentModeId: <value>
  - models.currentModelId: <value>
- Notes: <optional>
```
