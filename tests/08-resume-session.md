# Test 08: Resume Session Workflow

## Goal
Verify the resume-session workflow by listing sessions, selecting one, and loading it with history.

## Guardrail
- This test must run in a `clawdbot --dev` environment.
- If not running in clawdbot, stop and report the test as not run.

## Prerequisites
- OpenCode installed (`opencode` command available).
- At least one previous session exists for the project.

## Reporting
- Use the suite report file in `reports/` (one markdown file per full suite run).
- Append a section named `## Test 08: Resume Session Workflow` with status, evidence, and notes.

## Test Steps

### Step 1: List Available Sessions
```
bash(command: "opencode session list", workdir: "/path/to/project")
```
**Expected**: Output includes one or more session IDs.

### Step 2: Choose a Session
- Select the most recent session from the list.
- If no sessions exist, report this test as not run and stop.

### Step 3: Start ACP Process
```
bash(
  command: "opencode acp",
  background: true,
  workdir: "/path/to/project"
)
```
**Expected**: A new `processSessionId` is returned.

### Step 4: Initialize
```json
{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":1,"clientCapabilities":{"fs":{"readTextFile":true,"writeTextFile":true},"terminal":true},"clientInfo":{"name":"clawdbot","title":"Clawdbot","version":"1.0.0"}}}
```
**Expected**: Response includes `result.protocolVersion: 1`.

### Step 5: Load Selected Session
```json
{"jsonrpc":"2.0","id":1,"method":"session/load","params":{"sessionId":"<selected-sessionId>","cwd":"/path/to/project","mcpServers":[]}}
```
**Expected**: History replay begins and session loads successfully.

### Step 6: Confirm Session Active
```json
{"jsonrpc":"2.0","id":2,"method":"session/prompt","params":{"sessionId":"<selected-sessionId>","prompt":[{"type":"text","text":"Summarize our last interaction."}]}}
```
**Expected**: Response reflects prior session context.

## Assertions
- `opencode session list` returns at least one session (or test is not run).
- `session/load` succeeds for the selected session.
- Agent response indicates history is available.

## Report Template
```
## Test 08: Resume Session Workflow
- Status: pass | fail | not run
- Evidence:
  - selected sessionId: <id>
  - sample reply: <quote>
- Notes: <optional>
```
