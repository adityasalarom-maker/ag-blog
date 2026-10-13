# Production Deployment Guide — Cloudflare Pages

**Publication:** Antigravity Review / एंटीग्रेविटी समीक्षा  
**Architecture:** Astro Static-First (SSG) + Cloudflare Pages Global Edge CDN  
**Last Verified:** 2026-10-14  

---

## 1. Overview & Cloudflare Free Tier Compliance

The *Antigravity Review* is engineered to operate completely within **Cloudflare Pages' generous Free Tier**:
- **Bandwidth:** Unlimited static requests and global data transfer.
- **Build Quota:** 500 builds per month (ample for creator publishing rhythms).
- **SSL / TLS:** Automated edge TLS certificates with HTTP/2 and HTTP/3 support.
- **DDoS & CDN:** Global Anycast network covering 300+ edge locations with instantaneous cache purging.
- **Cost:** **$0.00 / month** (zero paid plans, no credit card required).

---

## 2. Deployment Method A: Git-Connected Continuous Delivery (Recommended)

This is the standard, zero-maintenance approach. Once configured, every push to the `master` branch automatically builds and deploys to the global edge network.

### Step 1: Push Repository to GitHub or GitLab
Ensure your local changes are committed and pushed to your remote Git repository:
```bash
git remote add origin https://github.com/<your-username>/ag-blog.git
git push -u origin master
```

### Step 2: Create Cloudflare Pages Project
1. Log into your free [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, click **Workers & Pages**.
3. Click **Create Application** → select the **Pages** tab.
4. Click **Connect to Git** and authorize your GitHub/GitLab account.
5. Select the repository: `ag-blog` (or your chosen repository name).

### Step 3: Configure Build & Environment Settings
In the Cloudflare Pages configuration screen, set the exact parameters below:

| Setting | Value | Description |
| :--- | :--- | :--- |
| **Project Name** | `ag-literary-publication` | Forms your free `*.pages.dev` subdomain. |
| **Production Branch** | `master` (or `main`) | Deploys automatically on merge. |
| **Framework Preset** | `Astro` | Automatically configures build tools. |
| **Build Command** | `npm run build` | Builds static HTML, assets, and JSON. |
| **Build Output Directory** | `dist/client` | Directory containing production assets. |

Under **Environment Variables (Advanced)**, add:
- `NODE_VERSION`: `20` (or `22`)
- `CONTENT_SOURCE`: `local` (or `sanity` when headless CMS is active)

### Step 4: Click "Save and Deploy"
Cloudflare Pages will clone the repository, run `npm run build`, and deploy your publication to `https://ag-literary-publication.pages.dev` within 45 seconds.

---

## 3. Deployment Method B: Direct CLI Deployment via Wrangler

If you prefer to deploy directly from your local terminal without Git webhooks:

### Step 1: Authenticate Wrangler CLI
```bash
npx wrangler login
```
*A browser window will open to authenticate your Cloudflare account.*

### Step 2: Build Production Assets
```bash
npm run build
```

### Step 3: Deploy to Cloudflare Pages
```bash
npx wrangler pages deploy dist/client --project-name=ag-literary-publication
```
Wrangler will output the live deployment URL (e.g., `https://<hash>.ag-literary-publication.pages.dev`).

---

## 4. Custom Domain & DNS Configuration

You can attach a custom domain (e.g., `antigravityreview.org` or `adityavarma.in`) at any time for zero hosting cost:

1. In the Cloudflare Pages dashboard, open project **ag-literary-publication**.
2. Click **Custom Domains** → **Set up a domain**.
3. Enter your domain name (e.g., `journal.yourdomain.com` or apex `yourdomain.com`).
4. Follow the DNS instructions:
   - **For Subdomain (e.g. `journal`):** Add a `CNAME` record pointing to `ag-literary-publication.pages.dev`.
   - **For Apex Domain:** If using Cloudflare DNS, Cloudflare will automatically set up CNAME flattening.
5. Cloudflare will automatically provision an SSL/TLS certificate within 15 minutes.

---

## 5. Instant Rollback & Disaster Recovery Runbook

If a regression or formatting issue is ever detected in production:

1. **One-Click Instant Rollback:**
   - In Cloudflare Pages, open the **Deployments** tab.
   - Locate any previous green deployment.
   - Click the three dots `...` next to that deployment and click **Rollback to this deployment**.
   - The edge network immediately rolls back within 5 seconds without waiting for a re-build.

2. **Content Data Restoration:**
   - Run the local restoration script with any verified backup file:
     ```bash
     node scripts/restore_content.mjs data/backups/content_backup_<timestamp>.json
     ```
   - Re-run `npm run build` and redeploy.

---

## 6. Live Deployment Verification (Smoke Test)

After initiating or updating a deployment, verify the live deployment by running our automated verification tool:

```bash
# Test against your live Cloudflare URL:
node scripts/verify_deployment.mjs https://ag-literary-publication.pages.dev
```

This verifies:
- Homepage HTTP 200 and Masthead rendering.
- Poetry stanzas, verse line-heights, and JSON-LD structured data.
- Prose typography, drop-cap rendering, and reading progress.
- Visual art gallery zoom triggers and medium filter pills.
- Search API index and strict draft isolation.
- Robots.txt directives and XML sitemap validity.
- 404 safe fallback handling.
