# Where Was I

Track the minute you're at in long YouTube videos. A dashboard to organize them, and a Chrome extension that saves your progress automatically and resumes where you left off.

## Setup

### 1. Google Cloud (one project for both)

- **YouTube Data API v3 key:** APIs & Services → enable "YouTube Data API v3" → Credentials → Create API key.
- **OAuth client ID:** Google Auth Platform → configure the consent screen (External, add yourself as a test user) → Clients → Create client → "Web application", with authorized JavaScript origins `http://localhost` and `http://localhost:5173`.

### 2. API

```sh
cd api
cp .env.example .env   # DATABASE_URL (Neon), YOUTUBE_API_KEY, GOOGLE_CLIENT_ID, JWT_SECRET
go run ./cmd/server    # migrates the schema and listens on :8080
```

### 3. Dashboard

```sh
cd dashboard
cp .env.example .env.local   # VITE_GOOGLE_CLIENT_ID (same client ID)
pnpm install
pnpm dev                     # http://localhost:5173 (proxies /api to :8080)
```

### 4. Extension

```sh
cd extension
pnpm install
pnpm build
```

In Chrome, open `chrome://extensions`, enable Developer mode, click "Load unpacked" and pick `extension/.output/chrome-mv3`. Sign in on the dashboard once; the extension reuses that session.

## Auth

Google sign-in only. The API sets two HttpOnly cookies: a 15-minute access token and a refresh token that rotates on every use and expires after 60 days **without activity**, so regular use never requires signing in again.

## Tests

```sh
cd api && go test ./...
cd dashboard && pnpm test
```
