# TasksManager Disaster Recovery & Troubleshooting Guide

Step-by-step runbooks for recovering lost commits, safely undoing mistakes, and troubleshooting Git state issues in the **TasksManager** project.

---

## 1. The Core Recovery Principle

In Git, commits are rarely deleted immediately. Whenever you commit, reset, rebase, or checkout, Git records the action in its internal audit log: the **Reflog**. Even if you accidentally run a hard reset, your previous commits remain reachable for weeks.

---

## 2. Recovering Lost Work Using `git reflog`

If you accidentally reset a branch, deleted a branch with commits, or made a mistake during a rebase:

### Step 1: Open the Reflog
```bash
git reflog -20
```
Output will look similar to:
```text
80542aa HEAD@{0}: commit: fix(status): stop password prompt on 404 page
d49b714 HEAD@{1}: commit: style(header): update New Task button design
6321437 HEAD@{2}: reset: moving to HEAD~1
```

### Step 2: Locate the Missing Snapshot
Identify the commit hash or `HEAD@{n}` where your work was last intact.

### Step 3: Recover into a New Branch
Never guess in place. Create a fresh recovery branch at that exact snapshot:

```powershell
# Windows PowerShell (quotes protect curly braces):
git checkout -b recovery-branch 'HEAD@{1}'
```

```bash
# Bash (Linux / macOS):
git checkout -b recovery-branch HEAD@{1}
```
Now inspect the recovered code. Once verified, you can re-integrate it into `main`.

---

## 3. Undoing Commits: Choosing the Right Tool

| Scenario | Recommended Command | Is It Safe for Pushed Commits? |
| :--- | :--- | :--- |
| **Fix typo in the last commit (unpushed)** | `git commit --amend` | ⚠️ Local only. Never amend pushed commits. |
| **Undo last commit, keep changes staged** | `git reset --soft HEAD~1` | ⚠️ Local only. Rewinds commit, keeps index. |
| **Undo last commit, unstage changes** | `git reset --mixed HEAD~1` | ⚠️ Local only. Keeps files on disk. |
| **Discard commit AND discard all changes** | `git reset --hard HEAD~1` | ⛔ HIGH RISK. Wipes changes from disk. |
| **Undo a commit that is already on GitHub** | `git revert <commit-hash>` | ✅ 100% SAFE. Creates an inverse commit. |

### The Safe Public Undo: `git revert`
When a commit has already been pushed to GitHub, **never use reset**. Use `git revert`:
```bash
# Revert a specific commit
git revert 63214378d43dd5c6f34fa1b39e393c2ffec966da

# Provide a clean layman commit message
# e.g.: "revert(seo): restore previous sitemap configuration"
```
This leaves previous history intact while cleanly undoing the code changes in a new snapshot.

---

## 4. Context Switching with `git stash`

When you need to switch branches urgently but have unfinished, uncommitted changes:

```bash
# 1. Save uncommitted changes to the stash stack
git stash save "WIP: working on date filter dropdown"

# 2. Verify working tree is now clean
git status

# 3. Switch branches and do the urgent task
git checkout main
# ... do urgent work ...

# 4. Switch back to your feature branch
git checkout feature/date-filters

# 5. Restore your shelved changes
git stash pop

# View all saved stashes
git stash list

# Discard a stash if no longer needed
git stash drop stash@{0}
```

---

## 5. Backporting Single Commits: `git cherry-pick`

To apply a specific bugfix from another branch without merging the whole branch:

```bash
# 1. Switch to the target branch (e.g. main)
git checkout main

# 2. Apply the specific commit
git cherry-pick 12df45a8

# 3. If conflicts occur, resolve them and continue:
git cherry-pick --continue

# To abort if things look wrong:
git cherry-pick --abort
```

---

## 6. Undoing Uncommitted File Changes

If you modified a file and want to discard your edits:

```bash
# Discard changes in a single file (resets to HEAD)
git restore client/components/modals/NewTaskModal.tsx

# Unstage a file without losing disk edits
git restore --staged client/components/modals/NewTaskModal.tsx

# Clean untracked files safely (ALWAYS test with -n dry-run first!)
git clean -nd          # Preview what would be deleted
git clean -fd          # Actually delete untracked files/folders
```
