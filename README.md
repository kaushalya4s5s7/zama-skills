# FHEVM Skills — AI Agent Skill System for Zama Protocol

> Drop-in skill files for Claude Code, Cursor, Windsurf, and Gemini that enable AI agents to correctly build, test, and deploy FHEVM confidential smart contracts — from ideation to production.

## Quick Install

Run this in any FHEVM/Hardhat project:

```bash
npx skills add kaushaly4s5s7/zama-skills
```

That's it. The CLI fetches all skill files from GitHub and writes them into your project.

## What Gets Installed

```
CLAUDE.md                    ← Claude Code reads this automatically
GEMINI.md                    ← Gemini reads this automatically
.cursorrules                 ← Cursor reads this automatically
.windsurfrules               ← Windsurf reads this automatically
.fhevm/
  ├── ORCHESTRATION.md       ← Full 5-phase agent workflow
  ├── INVARIANTS.md          ← 10 safety checks with fix patterns
  ├── PRIVACY-SPEC-TEMPLATE.md
  ├── UPDATE-MAP.md
  └── directives/
      ├── SKILL-ARCHITECTURE.md
      ├── SKILL-TYPES.md
      ├── SKILL-OPERATIONS.md
      ├── SKILL-ACL.md
      ├── SKILL-DECRYPTION.md
      ├── SKILL-INPUTS.md
      ├── SKILL-TESTING.md
      ├── SKILL-DEPLOY.md
      ├── SKILL-BACKEND.md
      ├── SKILL-FRONTEND.md
      └── SKILL-ERC7984.md
templates/
  ├── confidential-token-scaffold.sol
  ├── confidential-vote-scaffold.sol
  ├── sealed-bid-auction-scaffold.sol
  ├── acl-value-scaffold.sol
  ├── public-decrypt-scaffold.sol
  ├── fhevm-test-scaffold.ts
  ├── deploy-scaffold.ts
  ├── keeper-service-scaffold.ts
  └── fhevm-frontend-hooks-scaffold.ts
```

## After Install

```bash
# Install FHEVM packages
npm install @fhevm/solidity@^0.11.1 \
            @fhevm/hardhat-plugin@^0.4.2 \
            @openzeppelin/confidential-contracts \
            @zama-fhe/relayer-sdk@^0.4.1

# Add to hardhat.config.ts
# import "@fhevm/hardhat-plugin";
```

Then open your AI agent and say:
```
"Write me a confidential sealed-bid auction using FHEVM"
```

The agent will guide you through the full 5-phase flow:
- **Phase 0** — Ideation (asks 6 questions)
- **Phase 1** — Contract (Privacy Spec → scaffold → 10-invariant check)
- **Phase 2** — Testing (Hardhat test scaffold)
- **Phase 3** — Deployment (deploy script → records contract address)
- **Phase 4** — Backend? (keeper/relayer service — asks after deploy)
- **Phase 5** — Frontend? (React hooks — asks after deploy)

## CLI Options

```bash
npx skills add kaushaly4s5s7/zama-skills              # install from main
npx skills add kaushaly4s5s7/zama-skills --branch=dev # specific branch
npx skills add youruser/your-skill-repo    # any GitHub repo
```

## Validated Versions
| Package | Version |
|---|---|
| `@fhevm/solidity` | `^0.11.1` |
| `@fhevm/hardhat-plugin` | `^0.4.2` |
| `@openzeppelin/confidential-contracts` | `latest` |
| `@zama-fhe/relayer-sdk` | `^0.4.1` |

## Docs
Full documentation: [INSTALL.md](./INSTALL.md)
Source: [github.com/kaushalchaudhari/zama-skills](https://github.com/kaushalchaudhari/zama-skills)
