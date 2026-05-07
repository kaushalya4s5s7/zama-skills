#!/usr/bin/env node
// bin/skills.js — FHEVM Skill Installer CLI
// Usage: npx skills add <github-user>/<repo>
// Example: npx skills add kc/zama-skills

"use strict";

const https = require("https");
const fs    = require("fs");
const path  = require("path");
const zlib  = require("zlib");

// ── Colours (no deps) ──────────────────────────────────────
const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  green:  "\x1b[32m",
  cyan:   "\x1b[36m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  dim:    "\x1b[2m",
};
const ok  = (s) => console.log(`${c.green}✓${c.reset} ${s}`);
const info = (s) => console.log(`${c.cyan}→${c.reset} ${s}`);
const warn = (s) => console.log(`${c.yellow}⚠${c.reset}  ${s}`);
const err  = (s) => console.error(`${c.red}✗${c.reset} ${s}`);

// ── Files/folders to install from the skill repo ──────────
// These paths are RELATIVE to the skill repo root.
// They will be written to the same relative paths in cwd.
const SKILL_FILES = [
  "CLAUDE.md",
  "GEMINI.md",
  ".cursorrules",
  ".windsurfrules",
  "INSTALL.md",
  // .fhevm/ directory
  ".fhevm/INVARIANTS.md",
  ".fhevm/ORCHESTRATION.md",
  ".fhevm/PRIVACY-SPEC-TEMPLATE.md",
  ".fhevm/UPDATE-MAP.md",
  ".fhevm/directives/SKILL-ARCHITECTURE.md",
  ".fhevm/directives/SKILL-TYPES.md",
  ".fhevm/directives/SKILL-OPERATIONS.md",
  ".fhevm/directives/SKILL-ACL.md",
  ".fhevm/directives/SKILL-DECRYPTION.md",
  ".fhevm/directives/SKILL-INPUTS.md",
  ".fhevm/directives/SKILL-TESTING.md",
  ".fhevm/directives/SKILL-DEPLOY.md",
  ".fhevm/directives/SKILL-BACKEND.md",
  ".fhevm/directives/SKILL-FRONTEND.md",
  ".fhevm/directives/SKILL-ERC7984.md",
  // templates/
  "templates/confidential-token-scaffold.sol",
  "templates/confidential-vote-scaffold.sol",
  "templates/sealed-bid-auction-scaffold.sol",
  "templates/acl-value-scaffold.sol",
  "templates/public-decrypt-scaffold.sol",
  "templates/fhevm-test-scaffold.ts",
  "templates/deploy-scaffold.ts",
  "templates/keeper-service-scaffold.ts",
  "templates/fhevm-frontend-hooks-scaffold.ts",
];

// ── GitHub raw content fetcher ─────────────────────────────
function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "skills-cli" } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return fetchRaw(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (d) => chunks.push(d));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    }).on("error", reject);
  });
}

// ── Ensure directory exists ────────────────────────────────
function mkdirp(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Resolve repo shorthand ─────────────────────────────────
// "kc/zama-skills" → "kaushalchaudhari/zama-skills"
// For other shorthands, map here or accept full github user/repo
const ALIAS_MAP = {
  "kc": "kaushalchaudhari",
};

function resolveRepo(input) {
  const parts = input.split("/");
  if (parts.length !== 2) {
    throw new Error(`Invalid repo format "${input}". Use: <user>/<repo>`);
  }
  const [user, repo] = parts;
  const resolvedUser = ALIAS_MAP[user] ?? user;
  return { user: resolvedUser, repo };
}

// ── Main install flow ──────────────────────────────────────
async function installSkill(repoArg, branch = "main") {
  const { user, repo } = resolveRepo(repoArg);
  const baseUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}`;
  const cwd = process.cwd();

  console.log();
  console.log(`${c.bold}FHEVM Skill Installer${c.reset}`);
  console.log(`${c.dim}─────────────────────────────────────${c.reset}`);
  info(`Repo:   ${c.bold}${user}/${repo}${c.reset} (branch: ${branch})`);
  info(`Target: ${c.bold}${cwd}${c.reset}`);
  console.log();

  let installed = 0;
  let skipped   = 0;
  const errors  = [];

  for (const relPath of SKILL_FILES) {
    const url      = `${baseUrl}/${relPath}`;
    const destPath = path.join(cwd, relPath);

    process.stdout.write(`  ${c.dim}${relPath}${c.reset} ... `);

    try {
      const content = await fetchRaw(url);
      mkdirp(destPath);

      // Overwrite if already exists (update-safe)
      fs.writeFileSync(destPath, content, "utf8");
      process.stdout.write(`${c.green}done${c.reset}\n`);
      installed++;
    } catch (e) {
      process.stdout.write(`${c.red}FAILED${c.reset}\n`);
      errors.push({ file: relPath, reason: e.message });
    }
  }

  console.log();
  console.log(`${c.dim}─────────────────────────────────────${c.reset}`);

  if (errors.length > 0) {
    warn(`${errors.length} file(s) failed to install:`);
    errors.forEach(({ file, reason }) => {
      console.log(`   ${c.red}${file}${c.reset}: ${reason}`);
    });
    console.log();
  }

  ok(`${installed} skill file(s) installed successfully`);
  console.log();
  console.log(`${c.bold}Next steps:${c.reset}`);
  console.log(`  1. Install FHEVM packages:`);
  console.log(`     ${c.cyan}npm install @fhevm/solidity@^0.11.1 @fhevm/hardhat-plugin@^0.4.2 @openzeppelin/confidential-contracts @zama-fhe/relayer-sdk@^0.4.1${c.reset}`);
  console.log();
  console.log(`  2. Add to hardhat.config.ts:`);
  console.log(`     ${c.cyan}import "@fhevm/hardhat-plugin";${c.reset}`);
  console.log();
  console.log(`  3. Open your AI agent (Claude Code / Cursor / Gemini / Windsurf)`);
  console.log(`     and say: ${c.bold}"Write me a confidential <your-idea> using FHEVM"${c.reset}`);
  console.log();
  console.log(`  📄 See ${c.cyan}INSTALL.md${c.reset} for full documentation`);
  console.log();
}

// ── CLI Argument Parser ────────────────────────────────────
const [,, command, repoArg, ...flags] = process.argv;

const branch = (() => {
  const b = flags.find(f => f.startsWith("--branch="));
  return b ? b.split("=")[1] : "main";
})();

if (command === "add" && repoArg) {
  installSkill(repoArg, branch).catch((e) => {
    err(e.message);
    process.exit(1);
  });
} else {
  console.log(`
${c.bold}FHEVM Skill Installer${c.reset}

${c.bold}Usage:${c.reset}
  npx skills add <user>/<repo>           Install a skill from GitHub
  npx skills add kc/zama-skills          Install the FHEVM skill system

${c.bold}Options:${c.reset}
  --branch=<name>                        Use a specific branch (default: main)

${c.bold}Examples:${c.reset}
  npx skills add kc/zama-skills
  npx skills add kc/zama-skills --branch=dev
`);
  process.exit(command ? 1 : 0);
}
