# TasksManager Repository Hygiene & Security Guide

Guidelines for keeping the **TasksManager** repository clean, lean, and free of secret leaks or unnecessary build artifacts.

---

## 1. Zero-Leak Security Policy

The TasksManager project handles sensitive configuration items, including:
- MongoDB connection strings (`MONGODB_URI`).
- Cloudinary credentials (`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
- Authentication passcode tokens & salt keys.
- Application environment variables.

### Non-Negotiable Rules
1. **Never commit `.env` or `.env.local` files**:
   - `server/.env` and `client/.env.local` must remain strictly local and untracked.
   - Use `.env.example` to document required variable keys with empty or placeholder values.
2. **Never hardcode secrets in source code**:
   - Always access secrets through `process.env`.
   - Never paste API keys into tests, scripts, or comments.
3. **Inspect Before Staging**:
   - Always verify what you are staging with `git status` and `git diff --staged`.

---

## 2. TasksManager `.gitignore` Standards

The project `.gitignore` must protect against four categories of files:

```gitignore
# 1. Environment & Secrets
.env
.env*.local
*.pem
*.key

# 2. Dependencies & Package Caches
node_modules/
.npm/

# 3. Build & Compilation Outputs
client/.next/
client/out/
server/dist/
*.tsbuildinfo

# 4. Local Testing & Agent Scratch
scratch/
test-results/
playwright-report/
*.log
npm-debug.log*
.DS_Store
Thumbs.db
```

---

## 3. Staging Hygiene: Selective vs. Blanket Staging

### ❌ The Dangerous Practice: Blanket Staging
```bash
git add .
# OR
git add -A
```
*Why this is dangerous*: If a temporary file, test report, or environment file was created, blanket staging silently captures it into Git history.

### ✅ The Safe Practice: Intentional Staging
```bash
# Stage only the specific files you modified
git add client/components/modals/NewTaskModal.tsx
git add client/app/tasks/page.tsx

# Verify the exact staged diff
git diff --staged
```

---

## 4. How to Safely Untrack Mistakenly Added Files

If a file was tracked by mistake (or should now be ignored), remove it from Git tracking **without** deleting it from your local disk:

```bash
# Untrack a single file (keeps local file untouched on disk)
git rm --cached server/.env

# Untrack an entire folder (e.g. scratch or build output)
git rm -r --cached scratch/

# Commit the removal
git commit -m "chore(git): remove mistakenly tracked local files from Git"
```

---

## 5. Emergency Incident Response: Leaked Secrets

If a sensitive token or password was accidentally committed and pushed to GitHub:

1. **Rotate the Secret Immediately**:
   - Invalidate the compromised MongoDB password, Cloudinary API key, or JWT secret right away in your cloud dashboard.
   - *Assume any secret pushed to GitHub is permanently compromised within seconds.*
2. **Remove from Git History**:
   - Do not just delete the file in a new commit (the secret remains readable in past history).
   - Use `git filter-repo` to replace the secret across all historical commits:

   **Cross-Platform (Windows PowerShell, macOS, Linux):**
   ```bash
   # 1. Create a replacement file expressions.txt with format: target==>replacement
   echo "my_compromised_secret==>REDACTED" > expressions.txt

   # 2. Run git-filter-repo using the expressions file
   git filter-repo --replace-text expressions.txt

   # 3. Clean up the expressions file after scrubbing
   rm expressions.txt
   ```
3. **Force-Push with Caution**:
   - Update remote branches and notify teammates to re-clone or re-fetch.
