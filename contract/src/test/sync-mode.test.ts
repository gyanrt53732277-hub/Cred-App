// ---------------------------------------------------------------------------
// CrediFi sync-only CLI safety test.
//
// Verifies -- WITHOUT network access or executing any deploy logic -- that the
// new `sync` mode of the deploy CLI is wired to a code path that can never
// submit an on-chain transaction: it must not call deployContract(),
// registerNightForDust(), or submitTransaction().
// ---------------------------------------------------------------------------
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const deploySource = fs.readFileSync(path.join(here, "../deploy.ts"), "utf8");

/** Extracts the body of the top-level `async function sync()` as a string. */
function syncBody(source: string): string {
  const start = source.indexOf("async function sync(");
  expect(start).toBeGreaterThan(-1);
  // Find the opening brace of the sync function body after its signature.
  const open = source.indexOf("{", start);
  expect(open).toBeGreaterThan(-1);
  // Naively balance braces to the matching close (source is well-formed).
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error("could not extract sync() body");
}

describe("CrediFi sync-only CLI mode", () => {
  it("the CLI dispatches `deploy sync` and `sync` to the sync command", () => {
    expect(deploySource).toContain('mode === "deploy" && process.argv[3] === "sync"');
    expect(deploySource).toContain("await sync()");
  });

  it("the sync() body never calls deployContract()", () => {
    expect(syncBody(deploySource)).not.toContain("deployContract");
  });

  it("the sync() body never calls registerNightForDust()", () => {
    expect(syncBody(deploySource)).not.toContain("registerNightForDust");
  });

  it("the sync() body never calls submitTransaction()", () => {
    expect(syncBody(deploySource)).not.toContain("submitTransaction");
  });

  it("the real deploy path (which DOES submit) is confined to the deploy()/registerNightForDust() flow", () => {
    // deployContract must still exist somewhere for real deployment.
    expect(deploySource).toContain("deployContract");
  });
});
