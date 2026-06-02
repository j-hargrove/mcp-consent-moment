# MCP Consent Moment

> Agents move fast. Humans decide slowly. This is the system that reconciles them.

**Live demo:** https://mcp-consent-moment.vercel.app

## The problem

When an AI agent connects to tools, most hosts ask for blanket trust upfront. The user clicks through it like a cookie banner. Once granted, the trust is permanent and invisible.

The real problem isn't the dialog. It's this: an agent fires tool calls at machine speed; a human makes trust decisions at human speed. Prompt on every call and the agent becomes useless. Prompt once at connection and the human is uninformed.

This artifact designs the system that resolves that tension.

## Five theses

1. Defer the grant to first meaningful use, not connection
2. Tier by risk, not by tool — reads flow silently, writes prompt once, destructive actions hard-gate every time
3. The tool schema is the consent payload — the card renders what the tool will do before it runs
4. Consent is a budget, not a switch — visible, attributable, revocable; scope creep re-prompts
5. The system matches the human to the right tempo — not the user

## What's in this repo

- `packages/consent-core` — framework-agnostic consent lifecycle state machine, zero dependencies
- `packages/consent-react` — React bindings: useConsentGate hook, ConsentCard, BudgetPanel
- `demo` — interactive Vite + React demo running four scenarios against three mock MCP servers
- `docs/a-consent-pattern-for-mcp.md` — position piece

## How it was built

Designed and specified by Jonathan Hargrove. Built autonomously by Claude Code from CLAUDE.md in a single session. The spec was tight enough that the agent made decisions — the human reviewed what mattered.
