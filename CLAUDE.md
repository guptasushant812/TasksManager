# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Git & GitHub Engineering Guidelines

Always follow safe, professional, and disciplined version control practices. Detailed operational manuals and cheat sheets are located in [`.agents/git/`](.agents/git/README.md).

### 1. Safety Gates
- **Explicit Consent**: Never commit or push without explicit user instruction. A request to "commit" is strictly NEVER permission to "push".
- **Inspect Status First**: Always run `git status` before staging, committing, or pushing.
- **Never Run Destructive Commands**: Never execute `git reset --hard`, `git clean -f`, or `git checkout -- .` without explaining the consequences and receiving explicit confirmation.
- **No Force-Pushes on Protected Branches**: Never run `git push --force` or `--force-with-lease` on `main` unless the user explicitly requested a history rewrite.
- **Targeted Staging Only**: Avoid `git add .` or `git add -A` when untracked scratch or unrelated files are present. Stage only task-specific files and inspect with `git diff --staged`.

### 2. Commit Message Standards (The 50/72 Layman Rule)
Every commit message must follow the structure detailed in [`.agents/git/commit-standards.md`](.agents/git/commit-standards.md):
- **Subject Line**: Maximum 50 characters, imperative mood, capitalized, no trailing period. Conventional prefix (`feat:`, `fix:`, `style:`, `refactor:`, `chore:`, `perf:`, `docs:`).
- **Blank Line**: Exactly one blank line separating subject and body.
- **Body**: Wrapped at 72 characters or fewer per line. Written in **simple everyday words (layman terms)** explaining what changed and why.
- **Zero Artifacts & Buzzwords**: Never include prompt filenames (`MediaQueryPrompt.md`), test image names, or corporate hype (`MNC`, `Poka-Yoke`, `Enterprise`). Replace technical jargon with plain English.

### 3. Secret & Repository Hygiene
- **Never Commit Secrets**: Strictly protect `.env`, `.env.local`, API keys, MongoDB URIs, and auth tokens.
- **Ignore Scratch Files**: Never commit files in `scratch/`, review JSON files, build outputs (`client/.next/`, `server/dist/`), or test artifacts.

### 4. Supporting Documentation Manuals
- [Overview & Quick Reference](.agents/git/README.md)
- [Commit Message Standards](.agents/git/commit-standards.md)
- [Branching & Workflow Guide](.agents/git/branching-and-workflows.md)
- [Repository Hygiene & Security](.agents/git/repository-hygiene-and-security.md)
- [GitHub Collaboration & Pull Requests](.agents/git/github-collaboration-and-prs.md)
- [Disaster Recovery & Troubleshooting](.agents/git/disaster-recovery.md)

