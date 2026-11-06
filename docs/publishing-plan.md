# Publishing plan

How to put Where Was I in production: the API and dashboard on a host, and the extension on the Chrome Web Store.

**Open decision:** which host to deploy to (Cloud Run is the current recommendation).

## 1. Serve the dashboard from the Go server

The auth uses `HttpOnly` cookies with `SameSite=Lax` and the API has no CORS. The dashboard already calls `/api` on its own origin (via the Vite proxy in dev). Serving both from one service keeps production identical to dev:

- No CORS setup and no cookie domain tricks.
- One deploy, one domain, one host permission for the extension.

To do:

- [ ] Go server serves `dashboard/dist`, falling back to `index.html` for SPA routes.
- [ ] Multi-stage `Dockerfile`: build the dashboard with Node, build the Go binary, run both on a small image.

## 2. Deploy

| Option | Why | Caveat |
|---|---|---|
| **Google Cloud Run** (recommended) | Generous free tier, scales to zero, deploys from a Dockerfile; Go cold starts ~1 s | Use the same region as the Neon database |
| Fly.io | Simple, always-on small machines | Paid (a few dollars a month) |
| Railway | Very easy setup | ~$5/month |
| Render (free tier) | Free | Sleeps when idle and takes ~30–60 s to wake, which breaks autosave |

Neon stays as is. Keep using the **pooled** connection string (the API already uses pgx's simple protocol for it).

Checklist:

- [ ] Set secrets on the host: `DATABASE_URL`, `YOUTUBE_API_KEY`, `GOOGLE_CLIENT_ID` and a **new** `JWT_SECRET` (`openssl rand -base64 48`).
- [ ] Optional: custom domain (e.g. `wherewasi.yourdomain.com`). A `*.run.app` URL also works.
- [ ] Google Auth Platform → Clients: add the production URL to **Authorized JavaScript origins**.
- [ ] Google Auth Platform → Audience: **publish the app**. In "Testing" only the listed test users can sign in. With only basic scopes (email, profile) no verification review is needed.
- [ ] YouTube Data API quota: default 10,000 units/day; adding a video costs 1 unit, so no action needed.

## 3. Privacy policy

- [ ] Add a `/privacy` page to the dashboard. The Chrome Web Store requires a privacy policy URL because the extension handles user data.

## 4. Publish the extension on the Chrome Web Store

1. Register on the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole): one-time $5 fee, 2-step verification required.
2. Build against production (the URLs are baked in at build time, and `host_permissions` will point to the production domain instead of `localhost`):

   ```sh
   cd extension
   WXT_API_URL=https://your-domain WXT_DASHBOARD_URL=https://your-domain pnpm zip
   ```

   Output: `.output/where-was-i-extension-<version>-chrome.zip`.
3. Store listing: description, 128 px icon (`public/icon/128.png`), at least one 1280×800 screenshot, and a 440×280 promo tile.
4. Privacy practices tab (most rejections come from here):
   - **Single purpose:** "Remember and resume your position in YouTube videos."
   - **Permission justifications:**
     - `storage`: caches the user and lists so the popup opens instantly.
     - Host permission for the API: to save progress.
     - Content script on `youtube.com`: to read the player's position.
   - **Data disclosure:** account info (email, name) and the tracked videos; certify the data is not sold or used for unrelated purposes.
   - **Privacy policy URL:** the `/privacy` page from step 3.
5. Visibility: start as **Unlisted** (only people with the link can install it); switch to Public later.
6. Review usually takes a few days to a week. The narrow permissions (one site plus the API) help.
7. Updates: bump `version` in `extension/package.json`, run `pnpm zip` again and upload the new zip.

A Firefox build is available later with `pnpm zip:firefox`.

## Order

1. Serve the dashboard from Go and add the Dockerfile.
2. Deploy, set the secrets, and configure Google OAuth for the production origin.
3. Add the `/privacy` page.
4. Build the extension against production and publish it as Unlisted.
