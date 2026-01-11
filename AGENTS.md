# AGENTS.md - Coding Agent Guidelines

> Guidelines for AI coding agents working in this repository.

## Project Overview

This is a **skill project** that teaches AI assistants (like clawdbot) how to control OpenCode via the Agent Client Protocol (ACP). The main deliverable is a markdown skill file, not a compiled application.

**Key Files:**
- `src/skill/opencode-acp.md` - The skill file (primary deliverable)
- `agent/SPEC.md` - Full technical specification
- `docs/acp/` - ACP protocol reference documentation
- `scripts/` - Utility scripts (TypeScript/Bun)

---

## Build / Lint / Test Commands

### Runtime

This project uses **Bun** as the JavaScript/TypeScript runtime.

```bash
# Install dependencies
bun install

# Run TypeScript scripts
bun run scripts/download-acp-docs.bun.ts

# Type check (no emit)
bunx tsc --noEmit
```

### No Formal Test Suite

This project does not have automated tests. The skill file is validated by:
1. Manual testing with clawdbot
2. Verifying JSON-RPC message formats match ACP spec

### Linting / Formatting

No ESLint, Prettier, or Biome configuration exists. Follow the style conventions below.

---

## Code Style Guidelines

### TypeScript Configuration

The project uses strict TypeScript with these key settings:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noFallthroughCasesInSwitch": true,
  "noImplicitOverride": true,
  "verbatimModuleSyntax": true
}
```

### Import Style

```typescript
// CORRECT: Use node: prefix for Node.js built-ins
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

// CORRECT: Use ESM imports (type: "module" in package.json)
import { SomeType } from "./types.ts";

// WRONG: CommonJS require
const fs = require("fs");

// WRONG: Missing node: prefix
import { mkdir } from "fs/promises";
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `download-acp-docs.bun.ts` |
| Functions | camelCase | `downloadFile`, `parseResponse` |
| Variables | camelCase | `sessionId`, `messageIdCounter` |
| Constants | SCREAMING_SNAKE | `BASE_URL`, `MAX_ATTEMPTS` |
| Types/Interfaces | PascalCase | `AcpSession`, `JsonRpcMessage` |

### Function Style

```typescript
// Prefer async/await over .then() chains
async function downloadFile(urlPath: string): Promise<void> {
  const response = await fetch(url);
  // ...
}

// Use arrow functions for callbacks
const succeeded = results.filter((r) => r.status === "fulfilled").length;

// Use explicit return types on exported functions
export async function main(): Promise<void> { }
```

### Error Handling

```typescript
// CORRECT: Specific error handling with informative messages
if (!response.ok) {
  throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
}

// CORRECT: Use Promise.allSettled for parallel operations that may fail
const results = await Promise.allSettled(items.map(processItem));
const failed = results.filter((r) => r.status === "rejected");

// WRONG: Silent failures
try { doSomething(); } catch (e) { }

// WRONG: Generic error messages
throw new Error("Something went wrong");
```

### String Formatting

```typescript
// Use template literals for string interpolation
console.log(`Downloaded: ${succeeded}/${total} files`);
console.log(`  Saved to: ${outputPath}`);

// Use console.log for output (this is a CLI tool context)
console.log(`\n${"=".repeat(50)}`);
```

### Type Safety

```typescript
// NEVER suppress type errors
// WRONG:
const data = response as any;
// @ts-ignore
// @ts-expect-error

// CORRECT: Define proper types
interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}
```

---

## Markdown / Documentation Style

### Skill Files (`src/skill/*.md`)

Skill files are read by AI assistants. Follow these conventions:

1. **Start with a title and brief description**
2. **Include a Quick Reference table** for common operations
3. **Use code blocks with language hints** for examples
4. **Structure with clear headings** (##, ###)
5. **Include state tracking requirements** if applicable
6. **Add error handling guidance**

Example structure:
```markdown
# Skill Name

Brief description of what this skill does.

## Quick Reference

| Action | How |
|--------|-----|
| Action 1 | `command` |

## Step-by-Step Workflow

### Step 1: Initialize
...
```

### Specification Files (`agent/*.md`)

These are technical specifications:
- Include architecture diagrams (ASCII)
- Document all message formats with JSON examples
- List all state that must be tracked
- Include example workflows
- Document error handling strategies

---

## Project Structure Conventions

```
opencode-acp-skill/
  src/
    skill/           # Skill files for AI assistants
      *.md
  agent/
    SPEC.md          # Technical specification
  docs/
    acp/             # External protocol documentation
  scripts/
    *.bun.ts         # Bun scripts (use .bun.ts suffix)
  package.json
  tsconfig.json
```

### File Suffixes

- `.bun.ts` - Scripts meant to run with Bun
- `.md` - Documentation and skill files

---

## ACP Protocol Specifics

When working with ACP-related code:

### JSON-RPC Message Format

```json
{"jsonrpc":"2.0","id":0,"method":"initialize","params":{...}}
```

- All messages are newline-delimited
- Maintain message ID counter starting at 0
- Notifications have no `id` field

### Session IDs

Track two types of session IDs:
- `processSessionId` - From the bash tool (process management)
- `acpSessionId` - From session/new response (ACP protocol)

---

## Git Conventions

### Commit Messages

Follow conventional commits:
```
feat: add session cancellation support
fix: handle empty poll responses
docs: update skill file with error handling
chore: update dependencies
```

### What to Commit

- **DO commit**: Source files, documentation, scripts
- **DO NOT commit**: `node_modules/`, build artifacts, `.env` files

---

## Common Tasks

### Adding a New Script

1. Create file in `scripts/` with `.bun.ts` suffix
2. Add shebang: `#!/usr/bin/env bun`
3. Include JSDoc header explaining purpose and usage
4. Run with: `bun run scripts/your-script.bun.ts`

### Updating the Skill File

1. Edit `src/skill/opencode-acp.md`
2. Ensure JSON examples are valid
3. Test manually with clawdbot if possible
4. Update `agent/SPEC.md` if protocol details changed

### Downloading Updated ACP Docs

```bash
bun run scripts/download-acp-docs.bun.ts
```

---

## References

- ACP Protocol (for LLMs): https://agentclientprotocol.com/llms.txt
- ACP Official Website: https://agentcommunicationprotocol.dev/introduction/welcome
- Local protocol docs: `docs/acp/` directory
