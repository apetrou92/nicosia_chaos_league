# Nicosia Chaos League — Public Deployment Guide

Version: **v12.3**

This version uses a **prebuilt client deployment** to avoid Railway npm/Vite workspace build issues.

Railway only installs the lightweight server dependencies and starts the Node server. The browser game is already built inside:

```txt
client/dist
```

## Railway variables for V12.3

Set these in Railway:

```txt
NIXPACKS_NODE_VERSION=20
NIXPACKS_INSTALL_CMD=npm install --omit=dev --no-audit --no-fund
NIXPACKS_BUILD_CMD=npm install --omit=dev --no-audit --no-fund
NIXPACKS_START_CMD=npm start
```

Delete these if present:

```txt
NPM_CONFIG_PRODUCTION
```

## Important Git note

Unlike previous versions, **client/dist must be pushed to GitHub**.

The `.gitignore` in V12.3 has been updated to allow:

```txt
client/dist
```

If Git does not include `client/dist`, Railway will start the server but the game page will not load.

## Deploy steps

```bash
git add .
git commit -m "Use prebuilt client for Railway deploy"
git push
```

Railway should redeploy automatically.

## Test

Open:

```txt
https://your-railway-url/health
```

Expected:

```json
{
  "ok": true,
  "version": "12.3"
}
```

Then open the normal URL.
