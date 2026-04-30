import express from "express";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";

import { GameState } from "./gameState.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";
const GAME_VERSION = "12.3";

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"]
  }
});

const gameState = new GameState();

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    version: GAME_VERSION,
    players: gameState.players.size,
    items: gameState.items.size,
    duels: gameState.duelHistory.length,
    npcs: gameState.npcs.size,
    uptime: Math.round(process.uptime())
  });
});

app.get("/version", (_req, res) => {
  res.json({
    name: "Nicosia Chaos League",
    version: GAME_VERSION
  });
});

const clientDist = path.resolve(__dirname, "../../client/dist");

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.send(`
      <h1>Nicosia Chaos League server is running</h1>\n      <p>Version: <strong>${GAME_VERSION}</strong></p>
      <p>For local development, open the Vite client at <strong>http://localhost:5173</strong>.</p>
      <p>Health check: <a href="/health">/health</a></p>
    `);
  });
}

io.on("connection", (socket) => {
  socket.on("player:join", (profile) => {
    const existing = gameState.getPlayer(socket.id);
    if (existing) {
      gameState.removePlayer(socket.id);
    }

    const player = gameState.addPlayer(socket.id, profile);

    socket.emit("world:init", {
      selfId: socket.id,
      self: player,
      players: gameState.listPlayers(),
      items: gameState.listItems()
    });

    socket.broadcast.emit("game:event", {
      type: "join",
      player: gameState.getPublicPlayer(player),
      message: `${player.nickname} joined as ${player.characterId}.`
    });

    io.emit("world:update", gameState.getWorldPayload());

    console.log(`[join] ${player.nickname} (${player.characterId}) ${socket.id}`);
  });

  socket.on("player:state", (state) => {
    gameState.updatePlayer(socket.id, state);
  });

  socket.on("item:pickup", (payload = {}) => {
    const result = gameState.pickupItem(socket.id, payload.instanceId);

    socket.emit("item:pickup:result", result);

    if (result.ok) {
      io.emit("game:event", {
        type: "item-pickup",
        player: result.player,
        message: result.message
      });

      io.emit("world:update", gameState.getWorldPayload());

      console.log(`[item] ${result.message}`);
    }
  });

  socket.on("challenge:player", (payload = {}) => {
    const result = gameState.challengePlayer(socket.id, payload.targetId);

    socket.emit("challenge:result", result);

    if (result.ok) {
      const targetSocket = io.sockets.sockets.get(result.target.id);

      if (targetSocket) {
        targetSocket.emit("challenge:received", {
          challenger: result.challenger,
          target: result.target,
          locationName: result.locationName,
          duel: result.duel,
          message: `${result.challenger.nickname} challenged you near ${result.locationName}.`
        });
      }

      io.emit("duel:resolved", result.duel);

      io.emit("game:event", {
        type: "duel",
        duel: result.duel,
        message: result.message
      });

      io.emit("world:update", gameState.getWorldPayload());

      console.log(`[duel] ${result.message}`);
    }
  });

  socket.on("disconnect", () => {
    const player = gameState.removePlayer(socket.id);

    if (player) {
      socket.broadcast.emit("player:left", {
        id: socket.id
      });

      socket.broadcast.emit("game:event", {
        type: "leave",
        player: gameState.getPublicPlayer(player),
        message: `${player.nickname} left the map.`
      });

      io.emit("world:update", gameState.getWorldPayload());

      console.log(`[leave] ${player.nickname} ${socket.id}`);
    }
  });
});

// Broadcast the world 20 times per second.
// This is enough for a prototype and keeps mobile data usage reasonable.
setInterval(() => {
  const events = gameState.tick();

  for (const event of events) {
    io.emit("game:event", event);
  }

  io.emit("world:update", gameState.getWorldPayload());
}, 50);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Nicosia Chaos League server running on http://localhost:${PORT}`);
});
