# AG Literary Publication — Project Guidelines (Oct 2026 Standard)
- **Ecosystem**: Astro 5.2.0 + Sanity CMS + TypeScript + Cloudflare Quick Tunnel.
- **Status**: 131 automated regression tests passing.

## 1. Cloudflare Build Quota Conservation (CRITICAL)
- Do NOT trigger remote Cloudflare Pages builds or deploy uploads unless explicitly ordered.
- Keep all development, previews, and tests strictly local (`localhost:4321` and Wi-Fi IP).
- Ephemeral Quick Tunnels (`trycloudflare.com`) use 0 build minutes.

## 2. Privacy & Content Integrity
- Maintain strict draft isolation: draft works and private notes must NEVER leak to public routes.
- Community JSON files in `data/community/` must not be overwritten or wiped.

## 3. Judgment Boundaries & Task Pipeline
- **NEVER**: Run `rm -rf`, `git reset --hard`, or break any of the 131 existing tests.
- **ALWAYS**: Use `/plan` mode for multi-file edits. Follow Spec-on-Disk in `docs/tasks/TASK-XX.md`.
