# Nicosia Chaos League — Public Deployment Guide

Version: **v12.4**

This version uses a **prebuilt client** and **pnpm** to bypass Railway's npm install issue.

Railway does not run Vite. The browser game is already built inside:

```txt
client/dist
```

Railway only needs to install the server packages and run:

```txt
node server/src/index.js
```

## Railway variables for V12.4

Use exactly these Railway variables:

```txt
NIXPACKS_NODE_VERSION=20
NIXPACKS_INSTALL_CMD=corepack enable && corepack prepare pnpm@9.15.4 --activate && pnpm install --prod --no-frozen-lockfile
NIXPACKS_BUILD_CMD=echo "Client prebuilt; skipping build"
NIXPACKS_START_CMD=node server/src/index.js
```

Delete these variables if present:

```txt
NPM_CONFIG_PRODUCTION
```

## Important

`client/dist` must be committed and pushed to GitHub.

Check before pushing:

```bash
git status
```

You should see files under:

```txt
client/dist
```

## Push patch

```bash
git add .
git commit -m "Use pnpm prebuilt Railway deploy"
git push
```

## Test

Open:

```txt
https://your-railway-url/health
```

Expected:

```json
{
  "ok": true,
  "version": "12.4"
}
```
