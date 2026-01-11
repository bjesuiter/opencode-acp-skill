# Overview

> How the Agent Client Protocol works

The Agent Client Protocol allows Agents and Clients to communicate by exposing methods that each side can call and sending notifications to inform each other of events.

## Communication Model

The protocol follows the [JSON-RPC 2.0](https://www.jsonrpc.org/specification) specification with two types of messages:

* **Methods**: Request-response pairs that expect a result or error
* **Notifications**: One-way messages that don't expect a response

## Message Flow

A typical flow follows this pattern:

### 1. Initialization Phase
* Client → Agent: `initialize` to establish connection
* Client → Agent: `authenticate` if required by the Agent

### 2. Session Setup - either:
* Client → Agent: `session/new` to create a new session
* Client → Agent: `session/load` to resume an existing session if supported

### 3. Prompt Turn
* Client → Agent: `session/prompt` to send user message
* Agent → Client: `session/update` notifications for progress updates
* Agent → Client: File operations or permission requests as needed
* Client → Agent: `session/cancel` to interrupt processing if needed
* Turn ends and the Agent sends the `session/prompt` response with a stop reason

## Agent

Agents are programs that use generative AI to autonomously modify code. They typically run as subprocesses of the Client.

### Baseline Methods

| Method | Description |
|--------|-------------|
| `initialize` | Negotiate versions and exchange capabilities |
| `authenticate` | Authenticate with the Agent (if required) |
| `session/new` | Create a new conversation session |
| `session/prompt` | Send user prompts to the Agent |

### Optional Methods

| Method | Description |
|--------|-------------|
| `session/load` | Load an existing session (requires `loadSession` capability) |
| `session/set_mode` | Switch between agent operating modes |

### Notifications

| Notification | Description |
|--------------|-------------|
| `session/cancel` | Cancel ongoing operations (no response expected) |

## Client

Clients provide the interface between users and agents. They are typically code editors (IDEs, text editors) but can also be other UIs for interacting with agents. Clients manage the environment, handle user interactions, and control access to resources.

### Baseline Methods

| Method | Description |
|--------|-------------|
| `session/request_permission` | Request user authorization for tool calls |

### Optional Methods

| Method | Description |
|--------|-------------|
| `fs/read_text_file` | Read file contents (requires `fs.readTextFile` capability) |
| `fs/write_text_file` | Write file contents (requires `fs.writeTextFile` capability) |
| `terminal/create` | Create a new terminal (requires `terminal` capability) |
| `terminal/output` | Get terminal output and exit status |
| `terminal/release` | Release a terminal |
| `terminal/wait_for_exit` | Wait for terminal command to exit |
| `terminal/kill` | Kill terminal command without releasing |

### Notifications

| Notification | Description |
|--------------|-------------|
| `session/update` | Send session updates (message chunks, tool calls, plans, commands, mode changes) |

## Argument Requirements

* All file paths in the protocol **MUST** be absolute.
* Line numbers are 1-based

## Error Handling

All methods follow standard JSON-RPC 2.0 error handling:

* Successful responses include a `result` field
* Errors include an `error` object with `code` and `message`
* Notifications never receive responses (success or error)

## Extensibility

The protocol provides built-in mechanisms for adding custom functionality while maintaining compatibility:

* Add custom data using `_meta` fields
* Create custom methods by prefixing their name with underscore (`_`)
* Advertise custom capabilities during initialization

## Next Steps

* Learn about [Initialization](./initialization.md) to understand version and capability negotiation
* Understand [Session Setup](./session-setup.md) for creating and loading sessions
* Review the [Prompt Turn](./prompt-turn.md) lifecycle
* Explore [Extensibility](./extensibility.md) to add custom features
