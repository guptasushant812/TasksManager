# TasksManager Branching & Workflow Guide

A practical guide to branch management, integration strategies, and conflict resolution tailored for the **TasksManager** project.

---

## 1. Branch Strategy

Branches are lightweight movable pointers that isolate in-progress work from the production branch (`main`).

### The Golden Rule of `main`
- The `main` branch must **always be stable, building, and deployable**.
- Never perform experimental, half-finished, or broken work directly on `main`.
- Production deployments on Vercel and backend services trigger directly from `main`.

---

## 2. Branch Naming Taxonomy

Use clear, structured names with lowercase letters and hyphens:

| Prefix | Use Case | Example |
| :--- | :--- | :--- |
| **`feature/`** | Adding a new capability or user screen | `feature/date-filter-presets` |
| **`fix/`** | Bug fixes, edge-case corrections, or layout patches | `fix/status-route-password-prompt` |
| **`refactor/`**| Restructuring code, cleaning architecture, zero UI change | `refactor/task-modals-organization` |
| **`style/`** | Visual polishing, themes, responsiveness | `style/mobile-header-spacing` |
| **`chore/`** | Tooling, dependencies, build scripts, documentation | `chore/update-readme-instructions` |

### Creating and Switching Branches
```bash
# Create and switch to a new branch in one command
git checkout -b feature/date-filter-presets

# Or using newer Git syntax
git switch -c feature/date-filter-presets

# Verify current active branch
git branch --show-current
```

---

## 3. Merging vs. Rebasing: The Decision Framework

| Operation | Command | What It Does | When to Use | Tradeoffs |
| :--- | :--- | :--- | :--- | :--- |
| **Rebase** | `git rebase main` | Replays your feature commits on top of current `main` | **Local, unpushed branches.** Use before creating a PR to maintain clean linear history. | Rewrites commit hashes. **Never rebase commits already pushed and shared with other developers.** |
| **Merge** | `git merge <branch>` | Creates a merge commit connecting two branch tips | Integrating a reviewed branch into `main`, or pulling shared changes. | Preserves true historical context. Can clutter history if used for every minor commit. |
| **Squash Merge** | `git merge --squash` | Combines all branch commits into one single commit on target | When a branch contains many tiny exploratory commits ("fix typo", "try again"). | Clean single commit on `main`; individual micro-history is condensed. |

### Golden Rule of Rebasing
> **Never rebase commits that have been pushed to a public or shared remote.** Rebase only your own local, unshared commits to keep your work up to date before submission.

---

## 4. Keeping Your Branch Up to Date

While working on a feature branch, `main` may receive updates. Keep your feature branch current:

```bash
# 1. Fetch latest changes from remote
git fetch origin main

# 2. Rebase your current local branch on top of origin/main
git rebase origin/main

# 3. If conflicts occur, resolve them (see section 5) and continue:
git rebase --continue
```

---

## 5. Step-by-Step Conflict Resolution

Conflicts happen when two branches modify the same lines of code.

### Step 1: Identify Conflicted Files
```bash
git status
# Conflicted files appear under "Unmerged paths"
```

### Step 2: Open and Resolve Markers
Git marks conflicts directly inside the files:
```text
<<<<<<< HEAD (Current branch code)
const siteUrl = getSiteUrl();
=======
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tasksmanager.app';
>>>>>>> feature-branch (Incoming code)
```
- Decide which lines to keep, combine, or remove.
- Delete the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).

### Step 3: Test the Code
Before marking the conflict as resolved, run a quick build or test check:
```bash
# For client
cd client && npm run build
# For server
cd ../server && npm run build
```

### Step 4: Stage and Complete
```bash
# Mark as resolved
git add client/lib/siteUrl.ts

# If resolving during a merge:
git commit -m "fix(sync): resolve conflicts between main and feature branch"

# If resolving during a rebase:
git rebase --continue
```

---

## 6. Branch Cleanup

After a branch has been safely integrated into `main`, delete it to keep your workspace uncluttered:

```bash
# Switch to main
git checkout main
git pull origin main

# Delete local branch (safe delete: warns if unmerged)
git branch -d feature/date-filter-presets

# Delete remote branch on GitHub
git push origin --delete feature/date-filter-presets
```
