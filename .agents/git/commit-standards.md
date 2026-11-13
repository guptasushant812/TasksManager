# TasksManager Commit Message Standards

This guide defines the formatting, phrasing, tone, and quality standards for all Git commit messages in the **TasksManager** project. Every commit message serves as permanent documentation for your team, collaborators, and future self.

---

## 1. The Anatomy of a Commit Message

A well-crafted commit message consists of three distinct parts separated by blank lines:

```text
type(scope): concise imperative subject line <= 50 chars

Detailed explanatory body written in everyday layman terms. Explain
what was changed and why this change was needed. Keep each line
wrapped cleanly at 72 characters or fewer.

Fixes #123 (optional issue footer)
```

### The 50/72 Rule
1. **Subject Line ($\le 50$ Characters)**:
   - Must be 50 characters or fewer.
   - Start with Conventional Commit type and optional scope (e.g., `feat(tasks):`, `fix(auth):`).
   - Use the **imperative mood** (e.g., "add", "fix", "update", "remove" — as if completing the sentence: *"If applied, this commit will..."*).
   - Capitalize the first word of the description.
   - **Never end with a period (`.`)**.
2. **Blank Line**:
   - Always place one blank line between the subject and the body. Without this blank line, Git tools like `rebase`, `log --oneline`, and GitHub UI cannot distinguish the title from the body.
3. **Body (Wrapped at $\le 72$ Characters per line)**:
   - Explains **what** was changed and **why** (the problem solved or convenience provided).
   - Does not explain the code line-by-line (the diff already shows that).
   - Written in **everyday layman terms** (plain English).
   - Wrapped cleanly at 72 characters so it renders comfortably across terminals, emails, and web interfaces.
4. **Footer (Optional)**:
   - Issue references (e.g., `Fixes #42`, `Closes #18`).
   - Breaking changes marked with `BREAKING CHANGE: description`.

---

## 2. Conventional Commit Types for TasksManager

| Type | Purpose | TasksManager Example |
| :--- | :--- | :--- |
| **`feat`** | A new user-facing feature or capability | `feat(tasks): add week drilldown to timeline` |
| **`fix`** | A bug fix or correction | `fix(status): stop password prompt on 404 page` |
| **`refactor`**| Code change that neither fixes a bug nor adds a feature | `refactor(auth): remove help link from lock screen` |
| **`style`** | Visual UI styling, padding, colors, fonts (no logic change) | `style(header): update New Task button design` |
| **`perf`** | Performance improvement (speed, loading, payload size) | `perf(auth): speed up password verification check` |
| **`docs`** | Documentation updates, FAQ guides, README edits | `docs(help): update FAQ answers for task export` |
| **`chore`** | Maintenance, package updates, gitignore rules | `chore(git): ignore temporary scratch review files` |

---

## 3. The Layman Translation Guide

Never use difficult design jargon, high English, or raw implementation mechanics when simple everyday words explain the change better.

| Avoid (High English / Jargon) | Use Instead (Everyday Layman Terms) | Why |
| :--- | :--- | :--- |
| *harmonize geometry, sheen, aesthetic* | *update button colors, borders, and hover look* | Everyday users and teammates understand visual elements, not design buzzwords. |
| *prune private routes from sitemap* | *remove private pages from public search listings* | Plain words clearly explain what happened to search listings. |
| *schema markup / structured JSON-LD* | *search preview details / search engine info* | Focuses on the user outcome (search results) rather than technical tags. |
| *ephemeral filesystems / buffers* | *temporary server storage / database storage* | Explains where files are saved in simple terms. |
| *production domain* | *live website address* | Plain language. |
| *token-optimized single-task regeneration* | *faster single task updates with AI helper* | Focuses on the user benefit (speed) rather than token economics. |
| *persistent draft recovery* | *save unfinished task drafts automatically* | Describes the behavior clearly. |
| *deduplication & distinct field contracts* | *remove duplicate tasks and clean up form fields* | Clear and direct. |
| *debounced search* | *search that waits briefly as you type* | Explains the action in human terms. |
| *hydration mismatch / warning* | *display sync warning on page load* | Plain description of the visual issue. |
| *soft-delete protection* | *keep deleted tasks safely archived* | Plain explanation of safety. |

---

## 4. Zero Tolerance: Banned AI Artifacts & Promotional Hype

Commit messages must **never** contain:
- **Prompt filenames**: `MediaQueryPrompt.md`, `Prompt_v2.md`, `RequirementDoc.md`.
- **Mock image references**: `matching Image 1`, `per screenshot 2`.
- **Corporate hype**: `MNC-grade`, `Top MNC Enterprise`, `Poka-Yoke Zero-Defect`, `Tactile Brand Header`.
- **Technical error codes in subjects**: `fix: resolve TypeScript TS2790 error by making...`.

---

## 5. Practical Good vs. Bad Examples

### Example 1: UI Styling
- ❌ **Bad (High English & Jargon)**:
  ```text
  fix(ui): harmonize new task button hierarchy, geometry, and hover sheen with dashboard aesthetic
  ```
- ✅ **Good (Clean Layman Terms)**:
  ```text
  style(header): update New Task button design

  Update the New Task button in the top header with better colors,
  rounded corners, and smooth hover effects so it matches the rest
  of the dashboard design.
  ```

### Example 2: SEO & Web Configuration
- ❌ **Bad (Overly Technical)**:
  ```text
  fix(seo): configure production domain, prune private routes from sitemap, and add schema markup
  ```
- ✅ **Good (Clean Layman Terms)**:
  ```text
  fix(seo): update website address and search info

  Set the correct live website address for search engines. Remove
  private task pages from public search listings so user data stays
  private, and add helpful details so the site looks good in search
  results.
  ```

### Example 3: File Attachments & Downloads
- ❌ **Bad (Raw Technical Errors)**:
  ```text
  Fix: resolve TypeScript TS2790 error by making Buffer data optional and using destructuring
  ```
- ✅ **Good (Clean Layman Terms)**:
  ```text
  fix(attachments): fix file download type error

  Make attachment file data optional when preparing file downloads.
  This prevents build errors during deployment and ensures files
  download smoothly.
  ```

### Example 4: AI Task Drafting
- ❌ **Bad (Vague & Jargon)**:
  ```text
  feat(ai): enforce DRY principle, distinct field contracts, and deduplication
  ```
- ✅ **Good (Clean Layman Terms)**:
  ```text
  feat(ai): clean up task draft generation

  Clean up AI task generation so fields are not repeated and duplicate
  tasks are avoided. Keep each task input clear and organized.
  ```

---

## 6. How to Commit via Terminal

Use multiple `-m` arguments to separate the subject and paragraphs cleanly without opening an interactive editor:

#### Windows PowerShell
```powershell
git commit -m "fix(status): stop password prompt on 404 page" `
           -m "Opening /status briefly showed a password box before showing the 404 page. This happened because the website was treating /status as a missing page and loading the password gate by default." `
           -m "Add a direct status page that shows the 404 screen right away, and make error pages public. Now visitors only see the 404 page without any password popups."
```

#### Bash (Linux / macOS)
```bash
git commit -m "fix(status): stop password prompt on 404 page" \
           -m "Opening /status briefly showed a password box before showing the 404 page. This happened because the website was treating /status as a missing page and loading the password gate by default." \
           -m "Add a direct status page that shows the 404 screen right away, and make error pages public. Now visitors only see the 404 page without any password popups."
```
