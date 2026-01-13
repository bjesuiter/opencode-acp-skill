# Test 03: Query Plugins and MCP Servers

## Goal
Verify an existing ACP session can query loaded plugins/MCP servers and write the results to a file.

## Guardrail
- This test must run in a `clawdbot --dev` environment.
- If not running in clawdbot, stop and report the test as not run.

## Prerequisites
- OpenCode ACP instance already running (from Test 01).
- ACP session already established (`opencodeSessionId` known).
- Message ID counter continues from prior tests.

## Reporting
- Use the suite report file in `reports/` (one markdown file per full suite run).
- Append a section named `## Test 03: Query Plugins and MCP Servers` with status, evidence, and notes.

## Test Steps

### Step 1: Send Query Prompt
```json
{"jsonrpc":"2.0","id":3,"method":"session/prompt","params":{"sessionId":"<sessionId>","prompt":[{"type":"text","text":"Which plugins are loaded? Which MCP servers are loaded? List them all."}]}}
```
**Expected**: Streamed response with plugin/MCP information and `stopReason: "end_turn"`.

### Step 2: Write Findings to File
```json
{"jsonrpc":"2.0","id":4,"method":"session/prompt","params":{"sessionId":"<sessionId>","prompt":[{"type":"text","text":"Write all the plugins and MCP servers info you just told me into a file called THIRD.md in the current directory."}]}}
```
**Expected**: `playground/THIRD.md` is created.

### Step 3: Verify Output File
- Read `playground/THIRD.md`.
- Confirm it contains lists of MCP servers and plugins.

## Assertions
- Query prompt completes with `stopReason: "end_turn"`.
- `playground/THIRD.md` exists and contains MCP/plugin listings.

## Report Template
```
## Test 03: Query Plugins and MCP Servers
- Status: pass | fail | not run
- Evidence:
  - opencodeSessionId: <sessionId>
  - File: playground/THIRD.md
- Notes: <optional>
```
