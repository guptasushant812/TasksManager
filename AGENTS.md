# Codebase Guidelines & Quality Standards

## Commenting Standards (Strict)

Always write code comments as if you are an experienced software engineer communicating directly and concisely with another engineer. Never output AI-generated boilerplate, decorative separators, or obvious annotations.

### 1. Zero Tolerance for AI Artifacts & Promotional Hype
- **No decorative banners or section dividers**: Never use Unicode or dash lines (e.g., `// ── Section ──────────────────`, `/* ── Header ── */`).
- **No prompt or design-spec references**: Never mention prompt names, requirement docs, or mock images (e.g., `MediaQueryPrompt.md`, `matching Image 2`, `Image 1 specification`).
- **No corporate buzzwords or hype**: Never use phrases like `MNC-grade`, `Top MNC Enterprise Alert Modal`, `Poka-Yoke Zero-Defect Quality Gate`, `Tactile Brand Header`, etc.

### 2. Follow the DRY Principle — Remove Obvious Comments
- **No self-evident JSX / HTML labels**: Do not put comments directly above obvious tags (e.g., `{/* Checkbox */}`, `{/* Header */}`, `{/* Footer */}`, `{/* Title */}`, `{/* Description */}`).
- **No trivial line-by-line narrations**: Do not explain standard syntax (e.g., avoid `// set state to true` before `setState(true)`, `// increment count` before `count++`).
- **Default to clean, self-documenting code**: If variable and function names already make the intent obvious, omit the comment entirely.

### 3. What Comments to Include
Only write comments for non-obvious context, technical constraints, or domain logic:
- **Non-obvious business logic or mathematical quirks** (e.g., ISO week calculations, Sunday boundary handling).
- **Technical workarounds & race condition guards** (e.g., two-phase resequencing to prevent MongoDB unique index collision, Cloudinary streaming settle delays).
- **Environment & infrastructure constraints** (e.g., Render free-tier cold-start wake-up pings, Route mounting order dependencies).
- **Security & performance precautions** (e.g., regex escaping to avoid ReDoS, body scroll locking on mobile drawers).

### 4. Tone and Style
- **Simple, human phrasing**: Use plain words and short, natural sentences.
- **Concise**: 1 to 2 lines maximum per comment.
- **Professional**: Direct, factual, and practical.

### 5. Pre-Delivery Rule
Before presenting code to the user, inspect all modified and newly generated code to ensure every comment complies with these rules. Bulk comment cleanups should never be necessary.
