# opencode-acp-skill
A skill developed for clawdbot to control opencode via ACP (Agents Communication Protocol) 

> **Note:** This project is **not** built by the OpenCode team and we are **not affiliated** with them in any way. This is an independent community project.

GitHub: https://github.com/bjesuiter/opencode-acp-skill

## How It Works

```
Clawdbot (or other SKILLS-compatible AI Environment)
    |
    +-- loads skill: src/skill/opencode-acp.md
    |
    +-- bash tool (background: true)
    |      +-- starts: opencode acp
    |
    +-- process tool
           +-- write: send JSON-RPC messages (stdin)
           +-- poll: receive JSON-RPC responses (stdout)
```

The skill teaches clawdbot how to communicate directly with OpenCode using the ACP protocol. No intermediate CLI layer - clawdbot becomes a native ACP client using its built-in `bash` and `process` tools.

## Project Structure

```
src/skill/
  opencode-acp.md   # The skill file - clawdbot reads this

agent/
  SPEC.md           # Full technical specification

docs/acp/           # ACP protocol reference documentation
```

## Useful Links 

- Official ACP Website: https://agentcommunicationprotocol.dev/introduction/welcome
  => Note: as of 2026-01-11 (that's when I checked), ACP will me merged into A2A, so this is a legacy protocol. Only reason for me to implement is that OpenCode supports it right now and i want to connect my clawdbot to opencode.

- Official ACP Website for LLMs: 
  https://agentclientprotocol.com/llms.txt

- ACP TypeScript Client Library: https://www.npmjs.com/package/@agentclientprotocol/sdk

## Feature Status

### v1 (Current Plan)
- [x] Skill file with ACP protocol instructions
- [x] Start OpenCode via `opencode acp`
- [x] Initialize ACP connection
- [x] Create sessions (`session/new`)
- [x] Send prompts (`session/prompt`)
- [x] Poll for responses (2 second intervals)
- [x] Cancel operations (`session/cancel`)

### v2 (Future)
- [ ] Continuous polling option
- [ ] Session persistence (save/load)
- [ ] MCP server passthrough
- [ ] Permission request handling
- [ ] Mode switching
