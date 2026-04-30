import { GAME_CONSTANTS } from "../../shared/constants.js";
import { CHARACTERS, getCharacterById } from "../../shared/characters.js";
import { ITEMS, getItemById } from "../../shared/items.js";
import { MAP_LOCATIONS, START_POSITION } from "../../shared/map.js";
import { resolveDuel } from "../../shared/duelRules.js";
import { NPCS } from "../../shared/npcs.js";
import { getAvailablePlayerColor } from "../../shared/nameColors.js";

const MAX_NICKNAME_LENGTH = 14;

const DUEL_WIN_SCORE = 100;
const DUEL_LOSS_SCORE = 20;
const COMBO_SCORE_MULTIPLIER = 3;
const NPC_STEAL_SCORE_PENALTY = 0;

const ITEM_RESPAWN_MS = {
  lost_found_shot: 15000,
  istorjia_special: 15000,
  new_division_malaria: 20000,
  apoel_powder: 20000,
  gsp_fireworks: 25000
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distanceBetween(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function sanitizeNickname(value) {
  const nickname = String(value || "Player")
    .replace(/[^\p{L}\p{N}\s_.-]/gu, "")
    .trim()
    .slice(0, MAX_NICKNAME_LENGTH);

  return nickname || "Player";
}

function sanitizeCharacterId(value) {
  const requestedId = String(value || "A").toUpperCase();
  const exists = CHARACTERS.some((character) => character.id === requestedId);
  return exists ? requestedId : "A";
}

function randomSpawn() {
  return {
    x: START_POSITION.x + Math.round((Math.random() - 0.5) * 180),
    y: START_POSITION.y + Math.round((Math.random() - 0.5) * 120)
  };
}

function getItemSpawn(item) {
  const location = MAP_LOCATIONS.find((loc) => loc.id === item.locationId);
  return location?.itemSpawn || START_POSITION;
}

function getRespawnMs(itemId) {
  return ITEM_RESPAWN_MS[itemId] || 15000;
}

function getNearestLocationName(point) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const location of MAP_LOCATIONS) {
    const locationPoint = {
      x: location.x + location.width / 2,
      y: location.y + location.height / 2
    };

    const distance = distanceBetween(point, locationPoint);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = location;
    }
  }

  return nearest?.name || "the street";
}

export class GameState {
  constructor() {
    this.players = new Map();
    this.items = new Map();
    this.duelHistory = [];
    this.npcs = new Map();
    this.initializeItems();
    this.initializeNpcs();
  }

  assignUniqueNameColor() {
    const activeColors = [...this.players.values()]
      .map((player) => player.nameColor)
      .filter(Boolean);

    return getAvailablePlayerColor(activeColors);
  }

  initializeItems() {
    for (const item of ITEMS) {
      const spawn = getItemSpawn(item);

      this.items.set(item.id, {
        instanceId: item.id,
        itemId: item.id,
        locationId: item.locationId,
        x: spawn.x,
        y: spawn.y,
        available: true,
        respawnAt: null
      });
    }
  }

  initializeNpcs() {
    const makisConfig = NPCS.makis;

    this.npcs.set(makisConfig.id, {
      id: makisConfig.id,
      name: makisConfig.name,
      x: makisConfig.minX,
      y: makisConfig.y,
      direction: 1,
      speed: makisConfig.speed,
      minX: makisConfig.minX,
      maxX: makisConfig.maxX,
      collisionRadius: makisConfig.collisionRadius,
      stealCooldownMs: makisConfig.stealCooldownMs,
      lastUpdateAt: Date.now(),
      lastStealByPlayerId: new Map()
    });
  }

  addPlayer(socketId, profile = {}) {
    const characterId = sanitizeCharacterId(profile.characterId);
    const character = getCharacterById(characterId);
    const spawn = randomSpawn();

    const player = {
      id: socketId,
      nickname: sanitizeNickname(profile.nickname),
      nameColor: this.assignUniqueNameColor(),
      characterId,
      x: clamp(spawn.x, 32, GAME_CONSTANTS.WORLD_WIDTH - 32),
      y: clamp(spawn.y, 32, GAME_CONSTANTS.WORLD_HEIGHT - 32),
      vx: 0,
      vy: 0,
      flipX: false,
      score: 0,
      wins: 0,
      losses: 0,
      streak: 0,
      inventory: [],
      speed: character.stats.speed,
      joinedAt: Date.now(),
      lastStateAt: 0,
      lastChallengeAt: 0
    };

    this.players.set(socketId, player);

    return player;
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    this.players.delete(socketId);
    return player;
  }

  updatePlayer(socketId, rawState = {}) {
    const player = this.players.get(socketId);
    if (!player) return null;

    const now = Date.now();

    if (now - player.lastStateAt < 25) {
      return player;
    }

    player.lastStateAt = now;

    const x = Number(rawState.x);
    const y = Number(rawState.y);
    const vx = Number(rawState.vx);
    const vy = Number(rawState.vy);

    if (Number.isFinite(x)) {
      player.x = clamp(x, 16, GAME_CONSTANTS.WORLD_WIDTH - 16);
    }

    if (Number.isFinite(y)) {
      player.y = clamp(y, 16, GAME_CONSTANTS.WORLD_HEIGHT - 16);
    }

    if (Number.isFinite(vx)) {
      player.vx = clamp(vx, -1, 1);
    }

    if (Number.isFinite(vy)) {
      player.vy = clamp(vy, -1, 1);
    }

    player.flipX = Boolean(rawState.flipX);

    return player;
  }

  pickupItem(socketId, instanceId) {
    this.respawnItems();

    const player = this.players.get(socketId);
    if (!player) {
      return {
        ok: false,
        reason: "Player not found."
      };
    }

    const itemState = this.items.get(String(instanceId));
    if (!itemState) {
      return {
        ok: false,
        reason: "Item does not exist."
      };
    }

    if (!itemState.available) {
      return {
        ok: false,
        reason: "Item is not available."
      };
    }

    const distance = distanceBetween(player, itemState);
    if (distance > GAME_CONSTANTS.ITEM_PICKUP_RADIUS + 18) {
      return {
        ok: false,
        reason: "Too far from item."
      };
    }

    const item = getItemById(itemState.itemId);
    if (!item) {
      return {
        ok: false,
        reason: "Item config missing."
      };
    }

    let droppedItemId = null;

    player.inventory.push(item.id);
    if (player.inventory.length > GAME_CONSTANTS.INVENTORY_LIMIT) {
      droppedItemId = player.inventory.shift();
    }

    player.score = clamp(
      player.score + GAME_CONSTANTS.BASE_SCORE_PER_ITEM,
      0,
      999999
    );

    itemState.available = false;
    itemState.respawnAt = Date.now() + getRespawnMs(item.id);

    const location = MAP_LOCATIONS.find((loc) => loc.id === item.locationId);
    const locationName = location?.name || "somewhere";

    return {
      ok: true,
      player: this.getPublicPlayer(player),
      item: this.getPublicItem(itemState),
      itemName: item.displayName,
      itemShortName: item.shortName,
      locationName,
      droppedItemId,
      message: `${player.nickname} grabbed ${item.displayName} at ${locationName}.`
    };
  }

  challengePlayer(challengerId, targetId) {
    const challenger = this.players.get(challengerId);
    const target = this.players.get(String(targetId));

    if (!challenger) {
      return {
        ok: false,
        reason: "Player not found."
      };
    }

    if (!target) {
      return {
        ok: false,
        reason: "Target player is gone."
      };
    }

    if (challenger.id === target.id) {
      return {
        ok: false,
        reason: "You cannot challenge yourself."
      };
    }

    const now = Date.now();
    const msSinceLastChallenge = now - challenger.lastChallengeAt;

    if (msSinceLastChallenge < GAME_CONSTANTS.CHALLENGE_COOLDOWN_MS) {
      return {
        ok: false,
        reason: `Challenge cooldown: ${Math.ceil((GAME_CONSTANTS.CHALLENGE_COOLDOWN_MS - msSinceLastChallenge) / 1000)}s.`
      };
    }

    const distance = distanceBetween(challenger, target);

    if (distance > GAME_CONSTANTS.CHALLENGE_RADIUS + 15) {
      return {
        ok: false,
        reason: "Too far away to challenge."
      };
    }

    challenger.lastChallengeAt = now;
    target.lastChallengeAt = now;

    const locationName = getNearestLocationName({
      x: (challenger.x + target.x) / 2,
      y: (challenger.y + target.y) / 2
    });

    const duel = resolveDuel(challenger, target);
    const winner = this.players.get(duel.winner.id);
    const loser = this.players.get(duel.loser.id);

    const winnerBonus = duel.winner.breakdown.comboBonus * COMBO_SCORE_MULTIPLIER;

    winner.score = clamp(winner.score + DUEL_WIN_SCORE + winnerBonus, 0, 999999);
    winner.wins += 1;
    winner.streak += 1;

    loser.score = clamp(loser.score + DUEL_LOSS_SCORE, 0, 999999);
    loser.losses += 1;
    loser.streak = 0;

    // V5 rule: duels consume both players' carried items.
    // This keeps the loop: collect items -> fight -> collect again.
    challenger.inventory = [];
    target.inventory = [];

    duel.locationName = locationName;
    duel.awards = {
      winnerScore: DUEL_WIN_SCORE + winnerBonus,
      loserScore: DUEL_LOSS_SCORE
    };
    duel.updatedPlayers = {
      challenger: this.getPublicPlayer(challenger),
      target: this.getPublicPlayer(target)
    };

    duel.historyEntry = this.addDuelHistory(duel);

    return {
      ok: true,
      challenger: this.getPublicPlayer(challenger),
      target: this.getPublicPlayer(target),
      distance: Math.round(distance),
      locationName,
      duel,
      message: `${duel.message} Items burned.`
    };
  }

  respawnItems() {
    const now = Date.now();

    for (const itemState of this.items.values()) {
      if (!itemState.available && itemState.respawnAt && now >= itemState.respawnAt) {
        itemState.available = true;
        itemState.respawnAt = null;
      }
    }
  }

  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  getPublicPlayer(player) {
    return {
      id: player.id,
      nickname: player.nickname,
      nameColor: player.nameColor,
      characterId: player.characterId,
      x: Math.round(player.x),
      y: Math.round(player.y),
      vx: player.vx,
      vy: player.vy,
      flipX: player.flipX,
      score: player.score,
      wins: player.wins,
      losses: player.losses,
      streak: player.streak,
      inventory: player.inventory
    };
  }

  listPlayers() {
    return [...this.players.values()].map((player) => this.getPublicPlayer(player));
  }

  getPublicItem(itemState) {
    return {
      instanceId: itemState.instanceId,
      itemId: itemState.itemId,
      locationId: itemState.locationId,
      x: itemState.x,
      y: itemState.y,
      available: itemState.available,
      respawnAt: itemState.respawnAt
    };
  }

  listItems() {
    this.respawnItems();
    return [...this.items.values()].map((itemState) => this.getPublicItem(itemState));
  }

  addDuelHistory(duel) {
    const winnerBreakdown = duel.winner?.breakdown || {};
    const loserBreakdown = duel.loser?.breakdown || {};

    const entry = {
      id: duel.id,
      createdAt: duel.createdAt || Date.now(),
      locationName: duel.locationName || "the street",
      winner: {
        id: duel.winner.id,
        nickname: duel.winner.nickname,
        nameColor: duel.winner.nameColor,
        characterId: duel.winner.characterId,
        fighterName: duel.winner.fighterName,
        abilityName: duel.winner.abilityName,
        total: winnerBreakdown.total,
        comboName: winnerBreakdown.comboName,
        comboColor: winnerBreakdown.comboColor,
        comboIcon: winnerBreakdown.comboIcon,
        abilityMessage: winnerBreakdown.abilityResult?.message
      },
      loser: {
        id: duel.loser.id,
        nickname: duel.loser.nickname,
        nameColor: duel.loser.nameColor,
        characterId: duel.loser.characterId,
        fighterName: duel.loser.fighterName,
        abilityName: duel.loser.abilityName,
        total: loserBreakdown.total,
        abilityMessage: loserBreakdown.abilityResult?.message
      },
      message: duel.message,
      commentary: duel.commentary
    };

    this.duelHistory.unshift(entry);
    this.duelHistory = this.duelHistory.slice(0, 12);

    return entry;
  }

  getLeaderboard() {
    return this.listPlayers()
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.streak - a.streak;
      })
      .slice(0, 8)
      .map((player, index) => ({
        rank: index + 1,
        id: player.id,
        nickname: player.nickname,
        characterId: player.characterId,
        score: player.score,
        wins: player.wins,
        losses: player.losses,
        streak: player.streak,
        inventory: player.inventory
      }));
  }

  getDuelHistory() {
    return this.duelHistory.slice(0, 8);
  }

  getPublicNpc(npc) {
    return {
      id: npc.id,
      name: npc.name,
      x: Math.round(npc.x),
      y: Math.round(npc.y),
      direction: npc.direction,
      collisionRadius: npc.collisionRadius
    };
  }

  listNpcs() {
    return [...this.npcs.values()].map((npc) => this.getPublicNpc(npc));
  }

  tick() {
    const now = Date.now();
    const events = [];

    for (const npc of this.npcs.values()) {
      const deltaSeconds = Math.min(0.12, Math.max(0, (now - npc.lastUpdateAt) / 1000));
      npc.lastUpdateAt = now;

      npc.x += npc.direction * npc.speed * deltaSeconds;

      if (npc.x >= npc.maxX) {
        npc.x = npc.maxX;
        npc.direction = -1;
      }

      if (npc.x <= npc.minX) {
        npc.x = npc.minX;
        npc.direction = 1;
      }

      for (const player of this.players.values()) {
        const distance = distanceBetween(npc, player);
        if (distance > npc.collisionRadius) continue;

        const lastStealAt = npc.lastStealByPlayerId.get(player.id) || 0;
        if (now - lastStealAt < npc.stealCooldownMs) continue;

        if (!player.inventory.length) {
          npc.lastStealByPlayerId.set(player.id, now);
          continue;
        }

        const stolenItems = [...player.inventory];
        player.inventory = [];
        player.score = clamp(player.score - NPC_STEAL_SCORE_PENALTY, 0, 999999);
        npc.lastStealByPlayerId.set(player.id, now);

        const stolenNames = stolenItems
          .map((itemId) => getItemById(itemId)?.shortName || itemId)
          .join(", ");

        events.push({
          type: "npc-steal",
          npcId: npc.id,
          playerId: player.id,
          player: this.getPublicPlayer(player),
          message: `${npc.name} robbed ${player.nickname} on Stasikratous and stole: ${stolenNames}.`
        });
      }
    }

    return events;
  }

  getWorldPayload() {
    return {
      serverTime: Date.now(),
      players: this.listPlayers(),
      items: this.listItems(),
      npcs: this.listNpcs(),
      leaderboard: this.getLeaderboard(),
      duelHistory: this.getDuelHistory()
    };
  }
}
