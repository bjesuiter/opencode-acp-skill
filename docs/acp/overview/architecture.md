# Architecture

> Overview of the Agent Client Protocol architecture

The Agent Client Protocol defines a standard interface for communication between AI agents and client applications. The architecture is designed to be flexible, extensible, and platform-agnostic.

## Design Philosophy

The protocol architecture follows several key principles:

1. **MCP-friendly**: The protocol is built on JSON-RPC, and re-uses MCP types where possible so that integrators don't need to build yet-another representation for common data types.
2. **UX-first**: It is designed to solve the UX challenges of interacting with AI agents; ensuring there's enough flexibility to render clearly the agents intent, but is no more abstract than it needs to be.
3. **Trusted**: ACP works when you're using a code editor to talk to a model you trust. You still have controls over the agent's tool calls, but the code editor gives the agent access to local files and MCP servers.

## Setup

When the user tries to connect to an agent, the editor boots the agent sub-process on demand, and all communication happens over stdin/stdout.

Each connection can support several concurrent sessions, so you can have multiple trains of thought going on at once.

<img src="https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/server-client.svg?fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=90242ce890be80f96c4c1a6166e3c057" alt="Server Client setup" data-og-width="579" width="579" data-og-height="455" height="455" data-path="images/server-client.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/server-client.svg?w=280&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=bd917ddb677e6b23cdc2a19346390822 280w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/server-client.svg?w=560&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=1d05c343199c6051ca57040276d3cd60 560w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/server-client.svg?w=840&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=d60766a694ef1485b14044538777260d 840w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/server-client.svg?w=1100&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=60a044b75725dd10573c2a5a9d10b103 1100w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/server-client.svg?w=1650&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=c8755a1d971c8c0c374077a622ce2873 1650w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/server-client.svg?w=2500&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=53540d5df78b7c0e400a33632b95ef8e 2500w" />

ACP makes heavy use of JSON-RPC notifications to allow the agent to stream updates to the UI in real-time. It also uses JSON-RPC's bidirectional requests to allow the agent to make requests of the code editor: for example to request permissions for a tool call.

## MCP

Commonly the code editor will have user-configured MCP servers. When forwarding the prompt from the user, it passes configuration for these to the agent. This allows the agent to connect directly to the MCP server.

<img src="https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp.svg?fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=4208d22ec64bdf11af53b1778df72c8c" alt="MCP Server connection" data-og-width="689" width="689" data-og-height="440" height="440" data-path="images/mcp.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp.svg?w=280&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=9442d9a54ca427398580ae7a483cf4ad 280w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp.svg?w=560&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=44ab3b84da5c6b81bbf67d9228c7316b 560w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp.svg?w=840&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=fefa396575e4ad81ba6123284c394d5d 840w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp.svg?w=1100&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=80fddbbee7c96dcb961204e3fbb24507 1100w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp.svg?w=1650&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=28bc64ceb8091ec50d58903e8132bd6f 1650w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp.svg?w=2500&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=049676f3e8a20c01fd0e169032041fc8 2500w" />

The code editor may itself also wish to export MCP based tools. Instead of trying to run MCP and ACP on the same socket, the code editor can provide its own MCP server as configuration. As agents may only support MCP over stdio, the code editor can provide a small proxy that tunnels requests back to itself:

<img src="https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp-proxy.svg?fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=ce25c0e525d70d48044da2d9841d6f83" alt="MCP connection to self" data-og-width="632" width="632" data-og-height="440" height="440" data-path="images/mcp-proxy.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp-proxy.svg?w=280&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=4fdf7e888ab64e9a77cda096c3115354 280w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp-proxy.svg?w=560&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=22e6dec61324e2a4f4ee82d9c0624563 560w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp-proxy.svg?w=840&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=0d7a261ba0002c913174de587490728f 840w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp-proxy.svg?w=1100&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=6dd1a0f7deb4d4da801ce6613dd4c180 1100w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp-proxy.svg?w=1650&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=a9927bfa96f59759d50525163732b511 1650w, https://mintcdn.com/zed-685ed6d6/FgcZrIi8cEeJJGHC/images/mcp-proxy.svg?w=2500&fit=max&auto=format&n=FgcZrIi8cEeJJGHC&q=85&s=711e54a4c2195fd9183baf3e021f719c 2500w" />


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://agentclientprotocol.com/llms.txt