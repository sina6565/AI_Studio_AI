#!/usr/bin/env node
/**
 * Production deployment smoke checks for SINA AI STUDIO.
 *
 * Usage:
 *   node tools/release-smoke.mjs https://your-deployed-host.example
 *
 * Uses only the Node.js built-in fetch API. It does not create users, enqueue
 * jobs, call paid providers, or mutate production data.
 */

const input = process.argv[2];

if (!input || input.startsWith("-")) {
  console.error("Usage: node tools/release-smoke.mjs <base-url>");
  process.exit(2);
}

let baseUrl;
try {
  baseUrl = new URL(input);
  if (!["http:", "https:"].includes(baseUrl.protocol)) {
    throw new Error("Only HTTP(S) URLs are supported.");
  }
  baseUrl.pathname = baseUrl.pathname.replace(/\/$/, "");
  baseUrl.search = "";
  baseUrl.hash = "";
} catch (error) {
  console.error(`Invalid base URL: ${error.message}`);
  process.exit(2);
}

const checks = [
  {
    name: "Public homepage",
    path: "/",
    validate: async (response, body) =>
      response.ok &&
      response.headers.get("content-type")?.includes("text/html") &&
      /<!doctype html|<html[\s>]/i.test(body),
    expected: "HTTP 200 HTML document",
  },
  {
    name: "Liveness probe",
    path: "/health",
    validate: async (response, body) => {
      if (!response.ok) return false;
      try {
        return JSON.parse(body).status === "ok";
      } catch {
        return false;
      }
    },
    expected: 'HTTP 200 JSON with status "ok"',
  },
  {
    name: "Versioned API health",
    path: "/api/v1/health",
    validate: async (response, body) => {
      if (!response.ok) return false;
      try {
        return JSON.parse(body).status === "ok";
      } catch {
        return false;
      }
    },
    expected: 'HTTP 200 JSON with status "ok"',
  },
  {
    name: "SPA deep-link fallback",
    path: "/preorder",
    validate: async (response, body) =>
      response.ok &&
      response.headers.get("content-type")?.includes("text/html") &&
      /<!doctype html|<html[\s>]/i.test(body),
    expected: "HTTP 200 HTML application shell",
  },
  {
    name: "Unknown API route contract",
    path: "/api/v1/__release_smoke_not_found__",
    validate: async (response, body) => {
      if (response.status !== 404) return false;
      try {
        const payload = JSON.parse(body);
        return payload.success === false && payload.error?.code === "NOT_FOUND";
      } catch {
        return false;
      }
    },
    expected: 'HTTP 404 JSON with error.code "NOT_FOUND"',
  },
];

let failures = 0;

console.log(`SINA AI STUDIO deployment smoke test: ${baseUrl.origin}`);

for (const check of checks) {
  const url = new URL(`${baseUrl.pathname}${check.path}`, baseUrl.origin);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { accept: check.path === "/" || check.path === "/preorder" ? "text/html" : "application/json" },
    });
    const body = await response.text();
    const passed = await check.validate(response, body);
    if (passed) {
      console.log(`PASS  ${check.name} (${response.status})`);
    } else {
      failures += 1;
      console.error(`FAIL  ${check.name}: expected ${check.expected}; received HTTP ${response.status}`);
    }
  } catch (error) {
    failures += 1;
    console.error(`FAIL  ${check.name}: ${error.name === "TimeoutError" ? "request timed out after 10 seconds" : error.message}`);
  }
}

console.log(`\nResult: ${checks.length - failures}/${checks.length} checks passed.`);
if (failures > 0) process.exitCode = 1;
