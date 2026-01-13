# Test 05: Sequential Commands to Concurrent Instances

## Goal
Verify multiple concurrent OpenCode instances can be controlled sequentially without state interference.

## Guardrail
- This test must run in a `clawdbot --dev` environment.
- If not running in clawdbot, stop and report the test as not run.

## Prerequisites
- Instance 2 running with `opencodeSessionId` and message counter ready.
- Instance 3 running with `opencodeSessionId` and message counter ready.

## Reporting
- Use the suite report file in `reports/` (one markdown file per full suite run).
- Append a section named `## Test 05: Sequential Commands to Concurrent Instances` with status, evidence, and notes.

## Test Steps

### Step 1: Command to Instance 2
```json
{"jsonrpc":"2.0","id":3,"method":"session/prompt","params":{"sessionId":"<sessionId-2>","prompt":[{"type":"text","text":"Create a file called 02-SECOND.md with the text: Second file from instance 2"}]}}
```
**Expected**: `stopReason: "end_turn"`.

### Step 2: Command to Instance 3
```json
{"jsonrpc":"2.0","id":3,"method":"session/prompt","params":{"sessionId":"<sessionId-3>","prompt":[{"type":"text","text":"Create a file called 03-SECOND.md with the text: Second file from instance 3"}]}}
```
**Expected**: `stopReason: "end_turn"`.

### Step 3: Verify Output Files
- Confirm `playground/02-SECOND.md` and `playground/03-SECOND.md` exist with expected content.

## Assertions
- Each instance uses its own message counter without collision.
- Both files are created with correct content.

## Report Template
```
## Test 05: Sequential Commands to Concurrent Instances
- Status: pass | fail | not run
- Evidence:
  - opencodeSessionId-2: <id>
  - opencodeSessionId-3: <id>
  - Files: playground/02-SECOND.md, playground/03-SECOND.md
- Notes: <optional>
```
