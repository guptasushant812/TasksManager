# Git & GitHub AI Workflow Rules

Mandatory behavioral rules for AI assistants performing Git and GitHub operations in the TasksManager project. Follow these rules strictly to prevent data loss, secret leaks, and history corruption.

## 1. Safety Gates & Pre-Execution Checks

Before running any Git command that changes state:
1. **Always Inspect Status**: Run `git status` first to know exactly what is modified, untracked, or staged.
2. **Explicit User Consent for Commits**: Never commit automatically unless the user explicitly asks to commit (e.g., "commit this", "commit and push").
3. **Explicit User Consent for Pushing**: Never run `git push` unless the user explicitly requests it. A request to "commit" is NOT a permission to "push".
4. **Zero Destructive Actions**: Never run `git reset --hard`, `git clean -f`, or `git checkout -- .` without explaining the exact consequence to the user and receiving explicit confirmation.
5. **Never Force-Push to Protected Branches**: Do not run `git push --force` or `--force-with-lease` on `main` unless the user explicitly requested a history rewrite operation.

## 2. Staging Rules (Clean & Atomic)

- **Targeted Staging**: Stage only the specific files modified for the current task (e.g., `git add client/components/...`).
- **No Blind `git add .`**: Never use `git add .` or `git add -A` when untracked scratch files, experimental files, or unrelated modifications exist.
- **Inspect Staged Diffs**: Run `git diff --staged` before committing to ensure no unintended files or whitespace changes are included.
- **Atomic Commits**: Keep one logical change per commit. If two unrelated bug fixes were made, stage and commit them separately.

## 3. Secret & Hygiene Protection

- **Zero Secret Tolerance**: Never stage or commit environment files (`.env`, `.env.local`, `.env.*`), private keys, API secrets, database connection URIs, or auth tokens.
- **Ignore Temporary & Scratch Files**: Never commit files in `scratch/`, review JSON files, OS metadata (`.DS_Store`, `Thumbs.db`), or editor caches (`.vscode/`, `.idea/`).
- **Build Output Guard**: Never commit `node_modules/`, Next.js build output (`client/.next/`), or TypeScript compilation output (`server/dist/`).

## 4. Commit Message Quality Gate

Every commit message must satisfy the **50/72 Layman Rule**:
1. **Subject Line (Title)**:
   - Maximum 50 characters.
   - Start with Conventional Commit type (`feat:`, `fix:`, `refactor:`, `style:`, `chore:`, `docs:`, `perf:`).
   - Imperative present-tense mood (e.g., "add", "fix", "update", not "added" or "fixing").
   - Capitalized first letter of the description.
   - **No trailing period**.
2. **Blank Line**: Exactly one blank line between the subject and the body.
3. **Body**:
   - Wrapped cleanly at 72 characters or fewer per line.
   - Written in **simple everyday words (layman terms)** that any user or non-technical teammate can easily understand.
   - Explains **what** was changed and **why** (the problem solved or convenience added).
   - Capitalize the first letter of each sentence; end sentences with proper punctuation.
4. **Banned Words & Artifacts**:
   - Zero tolerance for AI prompt references (e.g., `MediaQueryPrompt.md`, requirement file names, mock image names).
   - Zero tolerance for corporate hype or buzzwords (`MNC`, `Poka-Yoke`, `Enterprise grade`, `Zero-defect`).
   - Zero high-English design/architecture jargon where plain words work better:
     - Replace *harmonize* $\rightarrow$ *match* or *blend*
     - Replace *prune* $\rightarrow$ *remove* or *hide*
     - Replace *ephemeral filesystems* $\rightarrow$ *temporary server storage*
     - Replace *schema markup* $\rightarrow$ *search preview details*
     - Replace *production domain* $\rightarrow$ *live website address*

## 5. Post-Operation Verification

After performing any Git operation:
1. Verify repository state using `git status` to ensure working directory is clean.
2. Verify recent history using `git log -1 --format=fuller` to confirm subject, body, author, and timestamp.
3. Report the result clearly to the user with the commit hash and the exact message used.
