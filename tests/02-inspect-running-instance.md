# Test 02: Inspect Running OpenCode Instance

## Goal
Verify a running OpenCode ACP process can be discovered and inspected using Clawdbot process tools.

## Guardrail
- This test must run in a `clawdbot --dev` environment.
- If not running in clawdbot, stop and report the test as not run.

## Prerequisites
- An OpenCode ACP instance is already running (from Test 01).

## Reporting
- Use the suite report file in `reports/` (one markdown file per full suite run).
- Append a section named `## Test 02: Inspect Running OpenCode Instance` with status, evidence, and notes.

## Test Steps

### Step 1: List Running ACP Processes
```
process(action: "list")
```
**Expected**: At least one `opencode acp` process is listed with a sessionId and runtime.

### Step 2: Inspect System Process Details
```bash
ps aux | grep "opencode acp"
```
**Expected**: At least one system process entry for `opencode acp` is present.

## Assertions
- `process(action: "list")` includes a running `opencode acp` entry.
- `ps aux` output includes `opencode acp`.

## Report Template
```
## Test 02: Inspect Running OpenCode Instance
- Status: pass | fail | not run
- Evidence:
  - process list entry: <line>
  - ps entry: <line>
- Notes: <optional>
```
