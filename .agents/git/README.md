# TasksManager Git & GitHub Engineering System

Master reference guide and operational manual for Git version control and GitHub collaboration across the **TasksManager** project.

---

## 1. System Overview

This directory provides standardized reference documentation, best practices, and decision matrices for developers and AI assistants. It complements the mandatory behavioral rules defined in [`.agents/rules/git-workflow.md`](../rules/git-workflow.md).

```text
.agents/git/
├── README.md                            # Master overview & fast cheat sheet (this file)
├── commit-standards.md                  # 50/72 rule, layman phrasing, Conventional Commits & examples
├── branching-and-workflows.md           # Branch taxonomy, merging vs. rebasing, conflict resolution
├── repository-hygiene-and-security.md   # .gitignore rules, secret leak prevention, staging hygiene
├── github-collaboration-and-prs.md      # Pull requests, reviews, releases, and CI status checks
└── disaster-recovery.md                 # Reflog, undos, safe resets, reverts, and recovery runbooks
```

---

## 2. Fast Command Cheat Sheet

### Everyday Workflow (Edit $\rightarrow$ Stage $\rightarrow$ Commit $\rightarrow$ Push)
```bash
# 1. Check current state
git status

# 2. Stage specific modified files
git add client/components/modals/NewTaskModal.tsx

# 3. Verify exactly what is staged
git diff --staged

# 4. Commit with subject and multi-line body
git commit -m "fix(tasks): fix date formatting on new tasks" -m "Format dates using local timezone settings so tasks display the correct date on cards and reports."

# 5. Push only when explicitly requested
git push origin <branch-name>
```

### Safe Inspection & History
```bash
# Clean one-line log with graph
git log --oneline --graph --decorate -10

# View full commit details including author date and body
git log -1 --format=fuller

# Inspect file changes without line diffs
git show --stat <commit-hash>
```

---

## 3. Decision Matrix: Git Operations

| Situation | Recommended Action | Why |
| :--- | :--- | :--- |
| **New feature or bug fix** | Create a short-lived branch (`feature/...` or `fix/...`) | Keeps `main` stable, deployable, and easy to review. |
| **Bringing branch up to date with `main`** | `git rebase main` (on local unpushed branch) | Maintains a clean, linear commit history without merge bubbles. |
| **Integrating finished branch into `main`** | Merge with Pull Request on GitHub | Preserves review comments, CI test checks, and team traceability. |
| **Fixing a mistake in the last commit (unpushed)** | `git commit --amend` | Replaces the last commit cleanly before anyone else sees it. |
| **Undoing a commit that is already pushed to GitHub** | `git revert <commit-hash>` | Creates a safe, non-destructive undo commit without rewriting history. |
| **Switching tasks with half-finished work** | `git stash` $\rightarrow$ switch $\rightarrow$ `git stash pop` | Shelves uncommitted work safely without creating messy WIP commits. |
| **Accidentally lost a commit or reset wrong** | `git reflog` | Recovers the lost commit hash from Git's internal safety log. |

---

## 4. Architectural Rules Cross-Reference

- **AI Behavioral Rules**: [`.agents/rules/git-workflow.md`](../rules/git-workflow.md)
- **Code Commenting Standards**: [`.agents/rules/clean-code-comments.md`](../rules/clean-code-comments.md)
- **Karpathy Engineering Guidelines**: [`.agents/rules/karpathy-guidelines.md`](../rules/karpathy-guidelines.md)
- **Project Master Rules**: [`AGENTS.md`](../../AGENTS.md)
