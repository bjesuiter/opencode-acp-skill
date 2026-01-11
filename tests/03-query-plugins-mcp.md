# Test 03: Query Plugins and MCP Servers

**Date**: 2026-01-11  
**Status**: ✅ PASSED  
**Tester**: Robi 🤖

## Objective

Verify that an existing OpenCode ACP session can be reused to query information about loaded plugins and MCP servers, and write the findings to a file.

## Prerequisites

- OpenCode ACP instance already running (from Test 01)
- ACP session already established (`opencodeSessionId` known)

## Test Steps

### Step 1: Send Query Prompt

Using the existing session from Test 01:
- `processSessionId`: `68707955-3aaa-466b-a99f-e44298559497`
- `opencodeSessionId`: `ses_451cd8ae0ffegNQsh59nuM3VVy`
- `messageId`: `3` (incrementing from previous tests)

```json
{"jsonrpc":"2.0","id":3,"method":"session/prompt","params":{"sessionId":"ses_451cd8ae0ffegNQsh59nuM3VVy","prompt":[{"type":"text","text":"Which plugins are loaded? Which MCP servers are loaded? List them all."}]}}
```

**Expected**: Streamed response with plugin/MCP information  
**Actual**: ✅ Received detailed response over multiple polls

### Step 2: Poll for Response

**Poll 1**: No output (agent thinking)  
**Poll 2**: Streamed `agent_message_chunk` updates with formatted response  
**Poll 3**: Final chunks + `stopReason: "end_turn"`

## Response Content

OpenCode reported the following configuration:

### Loaded MCP Servers

| MCP Server | Description |
|------------|-------------|
| **playwright** | Browser automation via Playwright - verification, browsing, web scraping, testing, screenshots |
| **context7** | Documentation lookup - resolves library IDs and queries up-to-date docs for programming libraries/frameworks |
| **websearch** | Web search via Exa AI - real-time web searches and URL content scraping |
| **grep_app** | GitHub code search - searches code patterns across 1M+ public GitHub repositories |

### Available Skills/Plugins

| Skill | Description |
|-------|-------------|
| **playwright** | Browser automation skill for browser-related tasks |

### Built-in Tool Categories

| Category | Tools |
|----------|-------|
| **File operations** | Read, Write, Edit, Glob, Grep |
| **Code intelligence** | LSP tools (hover, goto definition, find references, diagnostics, rename, code actions) |
| **AST manipulation** | ast_grep_search, ast_grep_replace |
| **Execution** | Bash, Interactive Bash (tmux) |
| **Task management** | TodoWrite, TodoRead, Task (subagents) |
| **Session management** | session_list, session_read, session_search, session_info |
| **Background tasks** | background_task, background_output, background_cancel |
| **Media analysis** | look_at (for PDFs, images, diagrams) |
| **Web fetching** | webfetch |

### Step 3: Write Findings to File

Follow-up prompt to write the information to `THIRD.md`:

```json
{"jsonrpc":"2.0","id":4,"method":"session/prompt","params":{"sessionId":"ses_451cd8ae0ffegNQsh59nuM3VVy","prompt":[{"type":"text","text":"Write all the plugins and MCP servers info you just told me into a file called THIRD.md in the current directory."}]}}
```

**Expected**: OpenCode creates THIRD.md with the plugin/MCP information  
**Actual**: ✅ File created with formatted content

### Step 4: Verify Output File

**File**: `playground/THIRD.md`  
**Content**: Complete listing of MCP servers, plugins, and built-in tool categories

```markdown
# Loaded MCP Servers and Plugins

## Loaded MCP Servers
| MCP Server | Description |
|------------|-------------|
| playwright | Browser automation via Playwright |
| context7 | Documentation lookup |
| websearch | Web search via Exa AI |
| grep_app | GitHub code search |

## Available Skills/Plugins
| Skill | Description |
|-------|-------------|
| playwright | Browser automation skill |

## Tool Categories Available
- File operations, Code intelligence, AST manipulation
- Execution, Task management, Session management
- Background tasks, Media analysis, Web fetching
```

## Observations

1. **Session reuse**: Successfully reused existing ACP session without re-initialization
2. **Message ID tracking**: Incremented from `id: 3` to `id: 4` for file write request
3. **Multi-poll response**: Response streamed across multiple polls before completion
4. **Rich tooling**: OpenCode has extensive built-in tools plus 4 MCP servers configured
5. **Conversation memory**: OpenCode remembered previous response and wrote it to file

## Conclusion

- Existing ACP sessions can be reused for multiple prompts
- Message ID counter must be maintained across requests
- OpenCode provides introspection capabilities to list available tools and MCP servers
- OpenCode maintains conversation context and can reference previous responses
