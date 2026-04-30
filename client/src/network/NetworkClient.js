import { io } from "socket.io-client";

function getServerUrl() {
  const configuredUrl = import.meta.env.VITE_SERVER_URL;
  if (configuredUrl) return configuredUrl;

  const { protocol, hostname, port, origin } = window.location;

  // In local Vite development, the Phaser client runs on :5173
  // and the Socket.IO server runs on :3000.
  if (port === "5173" || port === "5174" || port === "5175") {
    return `${protocol}//${hostname}:3000`;
  }

  // In production, the Node server serves the built client and Socket.IO
  // from the same origin.
  return origin;
}

export class NetworkClient {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.socket = null;
    this.connected = false;
    this.selfId = null;
  }

  connect(profile) {
    const serverUrl = getServerUrl();

    this.socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000
    });

    this.socket.on("connect", () => {
      this.connected = true;
      this.callbacks.onStatus?.("Connected to multiplayer server.");
      this.socket.emit("player:join", {
        nickname: profile.nickname,
        characterId: profile.characterId
      });
    });

    this.socket.on("disconnect", () => {
      this.connected = false;
      this.callbacks.onStatus?.("Disconnected. Trying to reconnect...");
    });

    this.socket.on("connect_error", () => {
      this.connected = false;
      this.callbacks.onStatus?.("Could not reach multiplayer server.");
    });

    this.socket.on("world:init", (payload) => {
      this.selfId = payload.selfId;
      this.callbacks.onInit?.(payload);
    });

    this.socket.on("world:update", (payload) => {
      this.callbacks.onWorldUpdate?.(payload);
    });

    this.socket.on("player:left", (payload) => {
      this.callbacks.onPlayerLeft?.(payload);
    });

    this.socket.on("game:event", (payload) => {
      this.callbacks.onGameEvent?.(payload);
    });

    this.socket.on("item:pickup:result", (payload) => {
      this.callbacks.onItemPickupResult?.(payload);
    });

    this.socket.on("challenge:result", (payload) => {
      this.callbacks.onChallengeResult?.(payload);
    });

    this.socket.on("challenge:received", (payload) => {
      this.callbacks.onChallengeReceived?.(payload);
    });

    this.socket.on("duel:resolved", (payload) => {
      this.callbacks.onDuelResolved?.(payload);
    });
  }

  sendPlayerState(state) {
    if (!this.socket || !this.connected) return;
    this.socket.emit("player:state", state);
  }

  pickupItem(instanceId) {
    if (!this.socket || !this.connected) return;
    this.socket.emit("item:pickup", { instanceId });
  }

  challengePlayer(targetId) {
    if (!this.socket || !this.connected) return;
    this.socket.emit("challenge:player", { targetId });
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
  }
}
