# Test 09: Inspect Environment

**Date**: 2026-01-11  
**Status**: ✅ PASSED  
**Tester**: Robi 🤖

## Objective

Determine what environment information is available via the ACP protocol:
- OpenCode version
- Update schedule/availability
- Default agent/mode

## Available Information

### From `initialize` Response

```json
{
  "result": {
    "agentInfo": {
      "name": "OpenCode",
      "version": "1.1.13"
    },
    "agentCapabilities": {
      "loadSession": true,
      "mcpCapabilities": {"http": true, "sse": true},
      "promptCapabilities": {"embeddedContext": true, "image": true}
    }
  }
}
```

| Field | Value | Description |
|-------|-------|-------------|
| `agentInfo.name` | `"OpenCode"` | Agent application name |
| `agentInfo.version` | `"1.1.13"` | Current OpenCode version |
| `agentCapabilities.loadSession` | `true` | Session persistence supported |

### From `session/new` Response

```json
{
  "result": {
    "sessionId": "ses_...",
    "modes": {
      "currentModeId": "Sisyphus",
      "availableModes": [
        {"id": "Sisyphus", "name": "Sisyphus", "description": "..."},
        {"id": "Planner-Sisyphus", "name": "Planner-Sisyphus", "description": "..."},
        {"id": "Frontend Expert", "name": "Frontend Expert", "description": "..."},
        ...
      ]
    },
    "models": {
      "currentModelId": "anthropic/claude-opus-4-5",
      "availableModels": [...]
    }
  }
}
```

| Field | Value | Description |
|-------|-------|-------------|
| `modes.currentModeId` | `"Sisyphus"` | Default agent/mode |
| `modes.availableModes` | Array | All available agents |
| `models.currentModelId` | `"anthropic/claude-opus-4-5"` | Current LLM model |
| `models.availableModels` | Array | All available models |

## Summary Table

| Question | Available via ACP? | How to Get It |
|----------|-------------------|---------------|
| **Version running** | ✅ Yes | `initialize` → `result.agentInfo.version` |
| **Update scheduled** | ❌ No | Not in ACP protocol |
| **New version exists** | ❌ No | Requires external check (GitHub releases) |
| **Default agent name** | ✅ Yes | `session/new` → `result.modes.currentModeId` |
| **Available agents** | ✅ Yes | `session/new` → `result.modes.availableModes` |
| **Current model** | ✅ Yes | `session/new` → `result.models.currentModelId` |
| **Available models** | ✅ Yes | `session/new` → `result.models.availableModels` |

## Checking for Updates (Workaround)

Since ACP doesn't provide update info, you can:

1. **CLI check**: Run `opencode --version` via bash
2. **Compare to GitHub**: Fetch https://github.com/anomalyco/opencode/releases
3. **In-app notification**: OpenCode TUI notifies on startup if update available

## Example: Extracting Environment Info

```javascript
// After initialize
const version = initResponse.result.agentInfo.version;  // "1.1.13"
const name = initResponse.result.agentInfo.name;        // "OpenCode"

// After session/new
const currentMode = sessionResponse.result.modes.currentModeId;  // "Sisyphus"
const currentModel = sessionResponse.result.models.currentModelId;  // "anthropic/claude-opus-4-5"
```

## Observations

1. **Version is reliable**: Always available in initialize response
2. **Mode can change**: Different sessions can use different modes
3. **No update API**: ACP focuses on coding tasks, not self-management
4. **Rich model info**: Full list of available models with metadata

## Conclusion

The ACP protocol provides:
- ✅ Version info (`agentInfo.version`)
- ✅ Agent/mode info (`modes.currentModeId`, `modes.availableModes`)
- ✅ Model info (`models.currentModelId`, `models.availableModels`)
- ❌ Update scheduling (not part of ACP scope)

For update checks, use external methods (CLI, GitHub releases, or OpenCode TUI notifications).
