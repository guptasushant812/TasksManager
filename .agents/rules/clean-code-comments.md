# Clean Code Commenting Rule

Always write comments like an experienced developer — simple, natural, professional, and concise.

## Rules
1. **No decorative banners**: Never generate banners like `// ── Section ────` or Unicode separator lines.
2. **No prompt or document references**: Never reference prompts, requirement files, or image specs (e.g. `MediaQueryPrompt.md`, `matching Image 2`).
3. **No promotional hype or AI jargon**: Never use terms like `MNC-grade`, `Poka-Yoke`, or `Enterprise Quality Gate`.
4. **No obvious JSX/HTML labels**: Do not add `{/* Checkbox */}`, `{/* Header */}`, `{/* Footer */}`, `{/* Title */}` above self-explanatory tags.
5. **No trivial code narrations**: Do not narrate obvious code (e.g., `// set loading to false`).
6. **Only keep meaningful comments**: Keep only non-obvious business logic, technical constraints, workarounds (e.g., race conditions, unique index collisions, ReDoS sanitization), and environment requirements.
7. **Pre-delivery check**: Always review all comments in generated code to ensure they comply with these rules before responding.
