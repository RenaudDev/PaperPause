# Antigravity Rules & Workflows (PaperPause)

This repo contains the **canonical, versioned** Workspace Rules and Workflows for Antigravity IDE. They live under `.agent/` and are meant to be imported/created as **Workspace** customizations in Antigravity.

## Why this exists
- **Speed**: reduce repeated “how do we do X in this repo?” overhead.
- **Precision**: prevent common high-cost mistakes (theme shadowing, broken pipeline invariants, leaked secrets).
- **Consistency**: make pipeline + template changes follow stable contracts.

## Where the canonical files live
- **Rules**: `.agent/rules/`
- **Workflows**: `.agent/workflows/`
- **Repo map (human quick reference)**: `.docs/docs/REPO_KNOWLEDGE_MAP.md`

Antigravity rules/workflows are Markdown files and can be defined as Global or Workspace customizations. Workspace rules live in `.agent/rules` according to the docs.  
Reference: `https://antigravity.google/docs/rules-workflows`

## How to use in Antigravity
### Rules
1. Open the **Customizations** panel via the `...` menu at the top of the editor’s agent panel.
2. Go to **Rules**.
3. Create Workspace rules that mirror the files in `.agent/rules/`.

Rules support activation modes (Manual / Always On / Model Decision / Glob).  
Reference: `https://antigravity.google/docs/rules-workflows`

### Workflows
1. Open **Customizations** → **Workflows**.
2. Create Workspace workflows that mirror the files in `.agent/workflows/`.
3. Invoke a workflow with `/workflow-name` (e.g., `/dev-cycle`).

Workflows can call other workflows and run steps sequentially.  
Reference: `https://antigravity.google/docs/rules-workflows`

### Agent conversations and “roles”
Antigravity supports multiple agent conversations (including in parallel), and the Agent Manager gives a higher-level view across them.  
References:
- `https://antigravity.google/docs/agent`
- `https://antigravity.google/docs/agent-manager`

Antigravity also supports **conversation-level modes**: Planning vs Fast.  
Reference: `https://antigravity.google/docs/agent-modes-settings`

In this repo we implement “Architect / Task Planner / Researcher” as **manual-activation role rules** (and optional helper workflows), because the docs describe multiple agent conversations rather than a separate persisted “persona object”.

## Rule catalog (what to create as Workspace rules)
### Always On
- `.agent/rules/00-repo-invariants.md`
  - Theme-first layouts
  - Secrets policy
  - Baseline pipeline invariants

### Globbed
- `.agent/rules/10-hugo-theme-layouts.md`
  - Glob Pattern(s) to paste:
    - `themes/visual-sanctuary-theme/layouts/**`
    - `hugo.toml`
- `.agent/rules/20-ts-automation-pipeline.md`
  - Glob Pattern(s) to paste:
    - `scripts/**/*.ts`
    - `.github/workflows/**`
- `.agent/rules/30-ci-mission-control.md`
  - Glob Pattern(s) to paste:
    - `.github/workflows/**`
    - `mission-control/**`

### Manual (use when needed)
- `.agent/rules/90-pr-hygiene.md`

#### If Antigravity only accepts one Glob Pattern per rule
If the UI only allows a single value, you have two safe options:
- Create **duplicate Workspace rules** (same contents) and assign **one glob per rule**, or
- Use a broader single glob when acceptable (e.g., for TS + CI you can use `**/*` only if you are confident the rule won’t add noise; generally not recommended).

## Workflow catalog (what to create as Workspace workflows)
- `.agent/workflows/dev-cycle.md` → `/dev-cycle`
- `.agent/workflows/hugo-template-change.md` → `/hugo-template-change`
- `.agent/workflows/pipeline-debug.md` → `/pipeline-debug`
- `.agent/workflows/add-new-collection.md` → `/add-new-collection`
- `.agent/workflows/seo-metadata-pass.md` → `/seo-metadata-pass`

## Recommended “default setup”
1. Turn on **Repo Invariants** as **Always On**.
2. Add Hugo + TS + CI rules as **Globbed** (reduces irrelevant instruction bleed).
3. Keep PR hygiene as **Manual**.
4. Use workflows for repeatable processes instead of cramming procedures into Always On rules.

## Governance (keep it maintainable)
- Keep **Always On** rules minimal (only true invariants).
- Prefer **Glob** rules for language/tooling specifics.
- Add a short doc note in `.docs/` when you introduce a new invariant or workflow that changes team behavior.
- Avoid contradictory rules; have a single source of truth per domain (templates, pipeline, CI, etc.).


