# Initialization

> How all Agent Client Protocol connections begin

The Initialization phase allows Clients and Agents to negotiate protocol versions, capabilities, and authentication methods.

## Sequence

```
Client                                    Agent
  │                                         │
  │         Connection established          │
  │                                         │
  │──────────── initialize ────────────────►│
  │                                         │ Negotiate protocol
  │                                         │ version & capabilities
  │◄─────────── initialize response ────────│
  │                                         │
  │         Ready for session setup         │
  │                                         │
```

Before a Session can be created, Clients **MUST** initialize the connection by calling the `initialize` method with:

* The latest protocol version supported
* The capabilities supported

They **SHOULD** also provide a name and version to the Agent.

### Initialize Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "method": "initialize",
  "params": {
    "protocolVersion": 1,
    "clientCapabilities": {
      "fs": {
        "readTextFile": true,
        "writeTextFile": true
      },
      "terminal": true
    },
    "clientInfo": {
      "name": "my-client",
      "title": "My Client",
      "version": "1.0.0"
    }
  }
}
```

### Initialize Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "result": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "loadSession": true,
      "promptCapabilities": {
        "image": true,
        "audio": true,
        "embeddedContext": true
      },
      "mcp": {
        "http": true,
        "sse": true
      }
    },
    "agentInfo": {
      "name": "my-agent",
      "title": "My Agent",
      "version": "1.0.0"
    },
    "authMethods": []
  }
}
```

## Protocol Version

The protocol versions that appear in the `initialize` requests and responses are a single integer that identifies a **MAJOR** protocol version. This version is only incremented when breaking changes are introduced.

Clients and Agents **MUST** agree on a protocol version and act according to its specification.

### Version Negotiation

The `initialize` request **MUST** include the latest protocol version the Client supports.

If the Agent supports the requested version, it **MUST** respond with the same version. Otherwise, the Agent **MUST** respond with the latest version it supports.

If the Client does not support the version specified by the Agent in the `initialize` response, the Client **SHOULD** close the connection and inform the user about it.

## Capabilities

Capabilities describe features supported by the Client and the Agent.

All capabilities included in the `initialize` request are **OPTIONAL**. Clients and Agents **SHOULD** support all possible combinations of their peer's capabilities.

The introduction of new capabilities is not considered a breaking change. Therefore, Clients and Agents **MUST** treat all capabilities omitted in the `initialize` request as **UNSUPPORTED**.

### Client Capabilities

#### File System

| Capability | Description |
|------------|-------------|
| `readTextFile` | The `fs/read_text_file` method is available |
| `writeTextFile` | The `fs/write_text_file` method is available |

#### Terminal

| Capability | Description |
|------------|-------------|
| `terminal` | All `terminal/*` methods are available |

### Agent Capabilities

| Capability | Default | Description |
|------------|---------|-------------|
| `loadSession` | false | The `session/load` method is available |
| `promptCapabilities` | - | Object indicating content types supported in prompts |

#### Prompt Capabilities

As a baseline, all Agents **MUST** support `ContentBlock::Text` and `ContentBlock::ResourceLink` in `session/prompt` requests.

| Capability | Default | Description |
|------------|---------|-------------|
| `image` | false | The prompt may include `ContentBlock::Image` |
| `audio` | false | The prompt may include `ContentBlock::Audio` |
| `embeddedContext` | false | The prompt may include `ContentBlock::Resource` |

#### MCP Capabilities

| Capability | Default | Description |
|------------|---------|-------------|
| `http` | false | Agent supports connecting to MCP servers over HTTP |
| `sse` | false | Agent supports connecting to MCP servers over SSE (deprecated) |

## Implementation Information

Both Clients and Agents **SHOULD** provide information about their implementation:

| Field | Description |
|-------|-------------|
| `name` | Intended for programmatic or logical use |
| `title` | Intended for UI and end-user contexts |
| `version` | Version of the implementation |

---

Once the connection is initialized, you're ready to create a session and begin the conversation with the Agent.
