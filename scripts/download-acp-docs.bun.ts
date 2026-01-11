#!/usr/bin/env bun
/**
 * Downloads ACP documentation files relevant for implementing an ACP client in TypeScript.
 * Source: https://agentclientprotocol.com/llms.txt
 *
 * Usage: bun run scripts/download-acp-docs.bun.ts
 */

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const BASE_URL = "https://agentclientprotocol.com";
const OUTPUT_DIR = "docs/acp";

// URLs relevant for implementing an ACP client in TypeScript
// Excludes: brand, community/governance, RFDs, non-TypeScript language libraries
const DOCS_TO_DOWNLOAD = [
  // Overview - essential context
  "/overview/introduction.md",
  "/overview/architecture.md",
  "/overview/clients.md",
  "/overview/agents.md",

  // TypeScript library reference
  "/libraries/typescript.md",

  // Protocol - core implementation details
  "/protocol/overview.md",
  "/protocol/initialization.md",
  "/protocol/session-setup.md",
  "/protocol/session-modes.md",
  "/protocol/prompt-turn.md",
  "/protocol/content.md",
  "/protocol/tool-calls.md",
  "/protocol/agent-plan.md",
  "/protocol/schema.md",
  "/protocol/transports.md",
  "/protocol/file-system.md",
  "/protocol/terminals.md",
  "/protocol/slash-commands.md",
  "/protocol/extensibility.md",

  // Draft features (may be useful for future-proofing)
  "/protocol/draft/cancellation.md",
  "/protocol/draft/schema.md",
];

async function downloadFile(urlPath: string): Promise<void> {
  const url = `${BASE_URL}${urlPath}`;
  const outputPath = join(OUTPUT_DIR, urlPath);

  await mkdir(dirname(outputPath), { recursive: true });

  console.log(`Downloading: ${urlPath}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const content = await response.text();
  await Bun.write(outputPath, content);

  console.log(`  ✓ Saved to: ${outputPath}`);
}

async function main() {
  console.log(`\nDownloading ACP documentation to ${OUTPUT_DIR}/\n`);
  console.log(`Total files: ${DOCS_TO_DOWNLOAD.length}\n`);

  const results = await Promise.allSettled(DOCS_TO_DOWNLOAD.map(downloadFile));

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected");

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Downloaded: ${succeeded}/${DOCS_TO_DOWNLOAD.length} files`);

  if (failed.length > 0) {
    console.log(`\nFailed downloads:`);
    failed.forEach((r, i) => {
      if (r.status === "rejected") {
        console.log(`  ✗ ${r.reason}`);
      }
    });
    process.exit(1);
  }

  console.log(`\nDone! Documentation saved to ${OUTPUT_DIR}/`);
}

main();
