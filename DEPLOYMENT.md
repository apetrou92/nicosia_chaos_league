# Nicosia Chaos League — Railway Dockerfile Deployment

Version: **v12.5**

This version uses a **Dockerfile** to bypass Railway/Nixpacks npm install behavior.

Railway should detect the `Dockerfile` and build using Docker. The Dockerfile:

```txt
1. Uses node:20-slim
2. Enables pnpm through corepack
3. Installs only server production dependencies
4. Copies server, shared, and prebuilt client/dist
5. Starts with: node server/src/index.js
```

## Important

The folder `client/dist` must be committed to GitHub.

## Railway variables

For V12.5, remove the previous Nixpacks variables if possible:

```txt
NIXPACKS_INSTALL_CMD
NIXPACKS_BUILD_CMD
NIXPACKS_START_CMD
NIXPACKS_NODE_VERSION
NPM_CONFIG_PRODUCTION
```

They should not be needed when Railway uses the Dockerfile.

If Railway still shows a Nixpacks table with `npm install`, it is not using the Dockerfile or the latest GitHub commit has not been deployed.

## Push commands

```bash
git add .
git commit -m "Use Dockerfile Railway deploy"
git push
```

## Expected logs

You want to see Dockerfile-style steps like:

```txt
FROM node:20-slim
RUN corepack enable
pnpm install --prod
CMD ["node", "server/src/index.js"]
```

You should **not** see:

```txt
Nixpacks v...
npm install --omit=dev
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
  "version": "12.5"
}
```
