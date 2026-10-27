# Cloudflare Deployment & Build Quota Policy

## Rule: Conserve Cloudflare Build Quota / Tokens
1. **Never Trigger Remote Cloudflare Builds Automatically:**
   - Do NOT run `wrangler pages deploy`, Git-based deployment pushes, or any remote build-consuming pipelines without explicit, on-demand user instructions.
   - The user strictly manages their Cloudflare Pages build quota (500 builds/mo on Free Tier).

2. **Default to Local & Zero-Build Networking:**
   - For desktop testing: Use `http://localhost:4321`.
   - For same-network mobile testing: Use `http://<local-wifi-ip>:4321` (e.g., `http://10.47.25.200:4321`).
   - For remote/cellular mobile preview (when not on the same Wi-Fi): Only use ephemeral Quick Tunnels (`trycloudflare.com` via `cloudflared tunnel`), which stream directly from local port 4321 and consume **0 build minutes / 0 build tokens**.
   - Remote production deployments to Cloudflare Pages must only happen when the user explicitly requests: *"deploy to Cloudflare"* or *"upload data to burn build tokens"*.
