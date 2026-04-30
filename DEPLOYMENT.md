# Nicosia Chaos League — Public Deployment Guide

Version: **v12.0**

This version is deployment-ready: the Node.js server serves both the Phaser game client and Socket.IO multiplayer from the same public URL.

## Local production test

From the project root:

```bash
npm install
npm run build
npm start
```

Then open:

```txt
http://localhost:3000
```

Health check:

```txt
http://localhost:3000/health
```

Version check:

```txt
http://localhost:3000/version
```

## Local development mode

For normal development:

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:5173
```

In development, Vite runs the client on `5173` and the Socket.IO server runs on `3000`.

## Deploy on Railway

1. Create a GitHub repository.
2. Push this project to GitHub.
3. Go to Railway.
4. Create a new project.
5. Select **Deploy from GitHub repo**.
6. Choose this repository.
7. Railway will use `railway.json`.

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

After deployment, Railway gives you a public URL. Share that link with your friends.

## Deploy on Render

This repo includes `render.yaml`.

You can either use Blueprint deployment or create a Web Service manually with:

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Health check path:

```txt
/health
```

## Important notes

- The game has no login.
- Anyone with the link can join.
- Scores are stored in server memory only.
- Scores reset when the server restarts.
- If the host goes to sleep on a free tier, the first load may take time.
- Multiplayer works best when the frontend and backend are served from the same URL, which this version does.

## Files added for deployment

```txt
railway.json
render.yaml
Procfile
.env.example
.gitignore
DEPLOYMENT.md
```
