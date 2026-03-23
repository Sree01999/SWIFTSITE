import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "src", "config", "capabilities.json");
const srcRoot = path.join(root, "src");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (/\.(tsx|ts)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectCapabilityUsages(files) {
  const pattern = /data-capability=["']([^"']+)["']/g;
  const usages = new Map();

  for (const filePath of files) {
    const text = fs.readFileSync(filePath, "utf8");
    let match = pattern.exec(text);
    while (match) {
      const capabilityId = match[1];
      const existing = usages.get(capabilityId) ?? [];
      existing.push(path.relative(root, filePath));
      usages.set(capabilityId, existing);
      match = pattern.exec(text);
    }
  }

  return usages;
}

function fail(message) {
  console.error(`\n[scope:check] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(configPath)) {
  fail(`Missing ledger: ${path.relative(root, configPath)}`);
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const capabilities = Array.isArray(config.capabilities) ? config.capabilities : [];
if (!capabilities.length) {
  fail("Capability ledger is empty.");
}

const allowedStatuses = new Set(["working", "partial", "stub", "out_of_scope"]);
const allowedScopes = new Set(["mvp", "post_mvp"]);
const idSet = new Set();

for (const capability of capabilities) {
  if (!capability.id || typeof capability.id !== "string") {
    fail("Every capability needs a string 'id'.");
  }
  if (idSet.has(capability.id)) {
    fail(`Duplicate capability id: ${capability.id}`);
  }
  idSet.add(capability.id);

  if (!allowedStatuses.has(capability.status)) {
    fail(`Invalid status for ${capability.id}: ${capability.status}`);
  }

  if (!allowedScopes.has(capability.scope)) {
    fail(`Invalid scope for ${capability.id}: ${capability.scope}`);
  }
}

const files = walk(srcRoot);
const usages = collectCapabilityUsages(files);

for (const [capabilityId, locations] of usages.entries()) {
  if (!idSet.has(capabilityId)) {
    fail(
      `UI references unknown capability '${capabilityId}' in:\n- ${locations.join("\n- ")}`,
    );
  }
}

for (const capability of capabilities) {
  if (!capability.uiRequired) continue;
  if (!usages.has(capability.id)) {
    fail(`Capability '${capability.id}' is uiRequired=true but has no data-capability usage.`);
  }
}

console.log(`[scope:check] OK. ${capabilities.length} capabilities validated.`);
