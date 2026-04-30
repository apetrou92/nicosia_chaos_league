import Phaser from "phaser";

import { GAME_CONSTANTS } from "@shared/constants.js";
import { getCharacterById, CHARACTERS } from "@shared/characters.js";
import { ITEMS, getItemById } from "@shared/items.js";
import { MAP_LOCATIONS, ROADS, START_POSITION } from "@shared/map.js";
import { getNpcById } from "@shared/npcs.js";
import { FIGHTER_FACE_ASSETS } from "@shared/fighterFaces.js";
import { NetworkClient } from "../network/NetworkClient.js";

const GAME_VERSION = "12.3";
const UI_FONT = "Inter, Segoe UI, Arial, Helvetica, sans-serif";
const MAKIS_TEXT_COLOR = "#ff2d2d";
const ITEM_TEXT_COLOR = "#c084fc";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("npc_makis_face", "/assets/makis-face.png");

    for (const [characterId, assetPath] of Object.entries(FIGHTER_FACE_ASSETS)) {
      this.load.image(`fighter_face_${characterId}`, assetPath);
    }
  }

  create() {
    this.profile = window.__NCL_PLAYER_PROFILE__ || {
      nickname: "Player",
      characterId: "A"
    };

    this.character = getCharacterById(this.profile.characterId);

    this.score = 0;
    this.inventory = [];
    this.feedMessages = [];
    this.playerColorsByName = new Map();
    this.playerColorsById = new Map();
    this.selfNameColor = "#ffffff";
    this.nearbyLocation = null;
    this.nearestChallengeTarget = null;
    this.lastNearestChallengeTargetId = null;
    this.tapTarget = null;

    this.selfId = null;
    this.onlineCount = 1;
    this.makisDangerActive = false;
    this.lastMakisWarningAt = 0;
    this.leaderboard = [];
    this.duelHistory = [];
    this.mobileDrawerMode = null;
    this.mobileDrawerCloseEvent = null;
    this.domDrawerMode = null;
    this.domFeedOpen = false;
    this.domRankOpen = false;
    this.domDrawerCloseTimer = null;
    this.domUi = null;
    this.remotePlayers = new Map();
    this.npcSprites = new Map();
    this.itemSprites = new Map();
    this.pendingPickups = new Set();
    this.nextNetworkSendAt = 0;
    this.nextChallengeAt = 0;
    this.wins = 0;
    this.losses = 0;
    this.streak = 0;
    this.lastDuelId = null;

    this.createTextures();
    this.createWorld();
    this.createPlayer();
    this.createItems();
    this.createHud();
    this.createDomLandscapeUi();
    this.createDuelOverlay();
    this.createInput();
    this.createNetwork();

    this.addFeedMessage(`${this.profile.nickname} entered Nicosia as ${this.character.id}.`);
    this.addFeedMessage("V12.3: prebuilt Railway deploy.");
  }

  createTextures() {
    for (const character of CHARACTERS) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });

      g.fillStyle(character.outline, 1);
      g.fillRect(2, 0, 20, 24);
      g.fillStyle(character.color, 1);
      g.fillRect(4, 2, 16, 20);

      g.fillStyle(0xf8f1d8, 1);
      g.fillRect(7, 7, 3, 3);
      g.fillRect(14, 7, 3, 3);

      g.fillStyle(0x11142c, 1);
      g.fillRect(8, 8, 1, 1);
      g.fillRect(15, 8, 1, 1);

      g.fillStyle(character.outline, 1);
      g.fillRect(7, 17, 10, 2);

      g.generateTexture(`player_${character.id}`, 24, 24);
      g.destroy();
    }

    for (const item of ITEMS) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });

      // Outer pixel frame so every item still reads as a collectible.
      g.fillStyle(0x000000, 0.32);
      g.fillEllipse(17, 30, 28, 8);
      g.fillStyle(item.outline, 1);
      g.fillRoundedRect(1, 1, 32, 32, 6);
      g.fillStyle(0xfff3b0, 1);
      g.fillRoundedRect(3, 3, 28, 28, 5);

      if (item.id === "lost_found_shot") {
        // Wray bottle
        g.fillStyle(0x11142c, 1);
        g.fillRect(14, 5, 7, 5);
        g.fillStyle(0x795548, 1);
        g.fillRect(12, 10, 11, 17);
        g.fillStyle(0xfff8dc, 1);
        g.fillRect(14, 14, 7, 7);
        g.fillStyle(0xe74c3c, 1);
        g.fillRect(15, 15, 5, 2);
        g.fillStyle(0xffffff, 0.75);
        g.fillRect(13, 11, 2, 14);
      } else if (item.id === "istorjia_special") {
        // Wet splash / slime
        g.fillStyle(0xf8bbd0, 1);
        g.fillEllipse(17, 20, 19, 11);
        g.fillCircle(10, 17, 5);
        g.fillCircle(23, 16, 4);
        g.fillCircle(14, 25, 4);
        g.fillStyle(0xffffff, 0.88);
        g.fillEllipse(17, 19, 11, 5);
        g.fillCircle(26, 24, 2);
        g.fillCircle(8, 24, 2);
      } else if (item.id === "apoel_powder") {
        // Baggie of white powder
        g.lineStyle(2, 0x154360, 1);
        g.fillStyle(0xd6eaf8, 1);
        g.fillTriangle(9, 9, 25, 9, 17, 27);
        g.strokeTriangle(9, 9, 25, 9, 17, 27);
        g.fillStyle(0xffffff, 1);
        g.fillEllipse(17, 19, 12, 7);
        g.lineStyle(1, 0x154360, 0.7);
        g.beginPath();
        g.moveTo(11, 12);
        g.lineTo(23, 12);
        g.strokePath();
      } else if (item.id === "gsp_fireworks") {
        // Firework rocket
        g.fillStyle(0xe74c3c, 1);
        g.fillTriangle(17, 5, 11, 13, 23, 13);
        g.fillStyle(0xf39c12, 1);
        g.fillRect(12, 13, 10, 13);
        g.fillStyle(0xffffff, 1);
        g.fillRect(15, 15, 4, 8);
        g.lineStyle(2, 0x11142c, 1);
        g.beginPath();
        g.moveTo(17, 26);
        g.lineTo(17, 31);
        g.strokePath();
        g.fillStyle(0xfff3b0, 1);
        g.fillTriangle(14, 28, 20, 28, 17, 33);
      } else if (item.id === "new_division_malaria") {
        // Toxic icon
        g.fillStyle(0x27ae60, 1);
        g.fillCircle(17, 17, 11);
        g.lineStyle(2, 0x145a32, 1);
        g.strokeCircle(17, 17, 11);
        g.fillStyle(0x11142c, 1);
        g.fillCircle(17, 17, 3);
        g.fillTriangle(17, 7, 13, 15, 21, 15);
        g.fillTriangle(7, 22, 14, 18, 15, 26);
        g.fillTriangle(27, 22, 20, 18, 19, 26);
        g.fillStyle(0xb8ffce, 0.9);
        g.fillCircle(23, 9, 2);
        g.fillCircle(10, 11, 2);
      } else {
        g.fillStyle(item.color, 1);
        g.fillRect(8, 8, 18, 18);
      }

      g.generateTexture(`item_${item.id}`, 34, 34);
      g.destroy();
    }

    const shadow = this.make.graphics({ x: 0, y: 0, add: false });
    shadow.fillStyle(0x000000, 0.24);
    shadow.fillEllipse(14, 8, 28, 12);
    shadow.generateTexture("soft_shadow", 28, 16);
    shadow.destroy();

    const npc = this.make.graphics({ x: 0, y: 0, add: false });
    npc.fillStyle(0x000000, 1);
    npc.fillRect(1, 0, 26, 30);
    npc.fillStyle(0xf1c40f, 1);
    npc.fillRect(4, 3, 20, 24);
    npc.fillStyle(0x11142c, 1);
    npc.fillRect(6, 6, 16, 18);
    npc.fillStyle(0xffffff, 1);
    npc.fillRect(8, 10, 4, 4);
    npc.fillRect(16, 10, 4, 4);
    npc.fillStyle(0xe74c3c, 1);
    npc.fillRect(9, 21, 10, 3);
    npc.generateTexture("npc_makis", 28, 30);
    npc.destroy();

    const marker = this.make.graphics({ x: 0, y: 0, add: false });
    marker.lineStyle(3, 0xf8f1d8, 1);
    marker.strokeCircle(16, 16, 13);
    marker.lineStyle(3, 0x11142c, 1);
    marker.strokeCircle(16, 16, 9);
    marker.generateTexture("tap_marker", 32, 32);
    marker.destroy();

    const sparkle = this.make.graphics({ x: 0, y: 0, add: false });
    sparkle.lineStyle(2, 0xffffff, 1);
    sparkle.beginPath();
    sparkle.moveTo(8, 0);
    sparkle.lineTo(8, 16);
    sparkle.moveTo(0, 8);
    sparkle.lineTo(16, 8);
    sparkle.strokePath();
    sparkle.fillStyle(0xfff3b0, 1);
    sparkle.fillCircle(8, 8, 2);
    sparkle.generateTexture("item_sparkle", 16, 16);
    sparkle.destroy();

    const tree = this.make.graphics({ x: 0, y: 0, add: false });
    tree.fillStyle(0x000000, 0.25);
    tree.fillEllipse(18, 28, 26, 10);
    tree.fillStyle(0x7a4a21, 1);
    tree.fillRect(15, 17, 6, 14);
    tree.fillStyle(0x1f8f3a, 1);
    tree.fillCircle(18, 14, 13);
    tree.fillStyle(0x2ecc71, 1);
    tree.fillCircle(12, 18, 9);
    tree.fillCircle(24, 18, 9);
    tree.generateTexture("map_tree", 36, 34);
    tree.destroy();
  }

  createWorld() {
    const { WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE } = GAME_CONSTANTS;

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor("#7fcf6f");

    const ground = this.add.graphics();
    ground.fillStyle(0x7fcf6f, 1);
    ground.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    for (let x = 0; x < WORLD_WIDTH; x += TILE_SIZE) {
      for (let y = 0; y < WORLD_HEIGHT; y += TILE_SIZE) {
        const isAlt = ((x / TILE_SIZE) + (y / TILE_SIZE)) % 2 === 0;
        ground.fillStyle(isAlt ? 0x78c968 : 0x86d676, 1);
        ground.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }

    const roadGraphics = this.add.graphics();
    for (const road of ROADS) {
      roadGraphics.fillStyle(0xc2b280, 1);
      roadGraphics.fillRect(road.x, road.y, road.width, road.height);
      roadGraphics.lineStyle(3, 0x8f7d55, 0.75);
      roadGraphics.strokeRect(road.x, road.y, road.width, road.height);
    }

    this.add.text(1160, 815, "STASIKRATOUS", {
      fontFamily: UI_FONT,
      fontSize: "28px",
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
      align: "center",
      backgroundColor: "#11142c",
      padding: { x: 16, y: 10 },
      resolution: 4
    }).setOrigin(0.5).setDepth(3);

    this.locationZones = [];

    for (const location of MAP_LOCATIONS) {
      this.drawLocation(location);
    }

    this.drawRoadDetails();
    this.drawMapDecorations();
    this.drawMapBorder();
  }

  drawLocation(location) {
    const x = location.x;
    const y = location.y;
    const w = location.width;
    const h = location.height;

    this.add.rectangle(x + w / 2 + 10, y + h / 2 + 10, w, h, 0x000000, 0.22).setDepth(1);

    const roof = this.add.rectangle(x + w / 2, y + 24, w + 28, 48, location.roofColor, 1);
    roof.setDepth(4);

    const building = this.add.rectangle(x + w / 2, y + h / 2, w, h, location.color, 1);
    building.setDepth(2);
    building.setStrokeStyle(5, 0x1c1c1c, 1);

    const door = this.add.rectangle(x + w / 2, y + h - 22, 46, 44, 0x4a2c1a, 1);
    door.setDepth(5);
    door.setStrokeStyle(3, 0x1c1c1c, 1);

    this.add.text(x + w / 2, y - 28, location.name, {
      fontFamily: UI_FONT,
      fontSize: "22px",
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
      align: "center",
      backgroundColor: "#11142c",
      padding: { x: 10, y: 6 },
      resolution: 4
    }).setOrigin(0.5).setDepth(10);

    this.add.text(x + w / 2, y + h + 24, location.subtitle, {
      fontFamily: UI_FONT,
      fontSize: "15px",
      fontStyle: "900",
      color: "#11142c",
      align: "center",
      backgroundColor: "#fff3b0",
      padding: { x: 10, y: 4 },
      resolution: 4
    }).setOrigin(0.5).setDepth(10);

    const trigger = new Phaser.Geom.Rectangle(x - 55, y - 55, w + 110, h + 110);
    this.locationZones.push({ location, trigger });
  }

  drawRoadDetails() {
    const roadDetails = this.add.graphics();
    roadDetails.setDepth(0.8);

    // Sidewalks and road-edge highlights.
    for (const road of ROADS) {
      roadDetails.lineStyle(7, 0xf8f1d8, 0.42);
      roadDetails.strokeRect(road.x + 4, road.y + 4, road.width - 8, road.height - 8);

      roadDetails.lineStyle(2, 0x6f6244, 0.45);
      roadDetails.strokeRect(road.x + 12, road.y + 12, road.width - 24, road.height - 24);
    }

    // Stasikratous center strip.
    roadDetails.fillStyle(0xd5c58e, 0.42);
    roadDetails.fillRect(820, 780, 720, 80);

    // Crosswalk stripes.
    roadDetails.fillStyle(0xffffff, 0.38);
    for (let i = 0; i < 7; i += 1) {
      roadDetails.fillRect(1010 + i * 22, 760, 10, 120);
      roadDetails.fillRect(1320 + i * 22, 760, 10, 120);
    }
  }

  drawMapDecorations() {
    const treePositions = [
      [210, 250], [320, 360], [510, 215], [1770, 310],
      [1885, 430], [310, 1080], [500, 1170], [1760, 1120],
      [1900, 1030], [760, 420], [1590, 520], [740, 1120],
      [1540, 1160], [980, 590], [1420, 600]
    ];

    for (const [x, y] of treePositions) {
      this.add.image(x, y, "map_tree").setDepth(2.2).setAlpha(0.95);
    }

    const decor = this.add.graphics();
    decor.setDepth(2);

    // Small pavement / grass flecks to reduce flatness.
    for (let i = 0; i < 130; i += 1) {
      const x = Phaser.Math.Between(80, GAME_CONSTANTS.WORLD_WIDTH - 80);
      const y = Phaser.Math.Between(80, GAME_CONSTANTS.WORLD_HEIGHT - 80);
      const onRoad = ROADS.some((road) =>
        x >= road.x && x <= road.x + road.width && y >= road.y && y <= road.y + road.height
      );

      if (onRoad) {
        decor.fillStyle(0x9b8b61, 0.22);
        decor.fillRect(x, y, 10, 3);
      } else {
        decor.fillStyle(0x4fae55, 0.2);
        decor.fillCircle(x, y, Phaser.Math.Between(2, 4));
      }
    }
  }

  drawMapBorder() {
    const { WORLD_WIDTH, WORLD_HEIGHT } = GAME_CONSTANTS;
    const border = this.add.graphics();
    border.lineStyle(12, 0x1c1c1c, 1);
    border.strokeRect(6, 6, WORLD_WIDTH - 12, WORLD_HEIGHT - 12);

    border.lineStyle(5, 0xf8f1d8, 1);
    border.strokeRect(24, 24, WORLD_WIDTH - 48, WORLD_HEIGHT - 48);
  }

  createPlayer() {
    const { x, y } = START_POSITION;

    this.playerShadow = this.add.image(x, y + 17, "soft_shadow");
    this.playerShadow.setDepth(GAME_CONSTANTS.PLAYER_DEPTH - 1);

    this.player = this.physics.add.sprite(x, y, `fighter_face_${this.character.id}`);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(GAME_CONSTANTS.PLAYER_DEPTH);
    this.player.setDisplaySize(46, 46);

    const namePlateWidth = Phaser.Math.Clamp(this.profile.nickname.length * 12 + 30, 92, 190);

    this.playerNameBg = this.add.rectangle(x, y - 39, namePlateWidth + 10, 31, 0x02030c, 0.96);
    this.playerNameBg.setStrokeStyle(2, 0xfff3b0, 0.9);
    this.playerNameBg.setDepth(GAME_CONSTANTS.PLAYER_DEPTH + 1);
    this.playerNameBg.setVisible(false);

    this.playerName = this.add.text(x, y - 40, this.profile.nickname, {
      fontFamily: UI_FONT,
      fontSize: "16px",
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
      resolution: 4
    }).setOrigin(0.5).setDepth(GAME_CONSTANTS.PLAYER_DEPTH + 2);

    this.challengeRadiusCircle = this.add.circle(x, y, GAME_CONSTANTS.CHALLENGE_RADIUS, 0xf1c40f, 0.05);
    this.challengeRadiusCircle.setStrokeStyle(2, 0xf1c40f, 0.16);
    this.challengeRadiusCircle.setDepth(GAME_CONSTANTS.PLAYER_DEPTH - 2);

    this.tapMarker = this.add.image(x, y, "tap_marker").setDepth(50).setVisible(false);

    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
    this.updateCameraZoom();
  }

  createItems() {
    this.itemSprites = new Map();
  }

  createHud() {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(1000);

    this.topPanel = this.add.rectangle(0, 0, 440, 126, 0x000000, 0.5);
    this.topPanel.setOrigin(0, 0);

    this.scoreText = this.add.text(0, 0, "", {
      fontFamily: UI_FONT,
      fontSize: "18px",
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
      resolution: 4
    });

    this.inventoryText = this.add.text(0, 0, "", {
      fontFamily: UI_FONT,
      fontSize: "16px",
      fontStyle: "900",
      color: "#ffe082",
      stroke: "#000000",
      strokeThickness: 2,
      resolution: 4
    });

    this.locationText = this.add.text(0, 0, "", {
      fontFamily: UI_FONT,
      fontSize: "15px",
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
      resolution: 4
    });

    this.eventBox = this.add.rectangle(0, 0, 560, 134, 0x000000, 0.5);
    this.eventBox.setOrigin(0, 0);

    this.eventText = this.add.text(0, 0, "", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
      lineSpacing: 5,
      wordWrap: { width: 390 },
      resolution: 4
    });

    this.dangerText = this.add.text(0, 0, "MAKIS NEARBY", {
      fontFamily: UI_FONT,
      fontSize: "18px",
      fontStyle: "900",
      color: "#ffffff",
      backgroundColor: "#e74c3c",
      stroke: "#000000",
      strokeThickness: 3,
      padding: { x: 12, y: 6 },
      resolution: 4
    }).setOrigin(0.5, 0).setVisible(false);

    this.versionBadge = this.add.text(0, 0, `Game v${GAME_VERSION}`, {
      fontFamily: UI_FONT,
      fontSize: "13px",
      fontStyle: "900",
      color: "#07101f",
      backgroundColor: "#2ecc71",
      padding: { x: 7, y: 4 },
      resolution: 4
    }).setOrigin(1, 0);

    this.toggleFeedButton = this.add.text(0, 0, "FEED", {
      fontFamily: UI_FONT,
      fontSize: "13px",
      fontStyle: "900",
      color: "#07101f",
      backgroundColor: "#f1c40f",
      padding: { x: 8, y: 5 },
      resolution: 4
    }).setOrigin(1, 0);

    this.toggleRankButton = this.add.text(0, 0, "RANK", {
      fontFamily: UI_FONT,
      fontSize: "13px",
      fontStyle: "900",
      color: "#07101f",
      backgroundColor: "#8fd3ff",
      padding: { x: 8, y: 5 },
      resolution: 4
    }).setOrigin(1, 0);

    this.toggleFeedHitZone = this.add.rectangle(0, 0, 74, 34, 0xffffff, 0.001)
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    this.toggleRankHitZone = this.add.rectangle(0, 0, 74, 34, 0xffffff, 0.001)
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    this.feedCollapsed = false;
    this.leaderboardCollapsed = this.getUiMetrics().phone;

    this.toggleFeedHitZone.on("pointerdown", (_pointer, _localX, _localY, event) => {
      event?.stopPropagation?.();
      this.handleFeedButton();
    });

    this.toggleRankHitZone.on("pointerdown", (_pointer, _localX, _localY, event) => {
      event?.stopPropagation?.();
      this.handleRankButton();
    });

    this.leaderboardBox = this.add.rectangle(0, 0, 340, 312, 0x000000, 0.5);
    this.leaderboardBox.setOrigin(0, 0);

    this.leaderboardTitle = this.add.text(0, 0, "LEADERBOARD", {
      fontFamily: UI_FONT,
      fontSize: "16px",
      fontStyle: "900",
      color: "#8fd3ff",
      resolution: 4
    });

    this.leaderboardText = this.add.text(0, 0, "", {
      fontFamily: UI_FONT,
      fontSize: "13px",
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
      lineSpacing: 4,
      wordWrap: { width: 290 },
      resolution: 4
    });

    this.historyTitle = this.add.text(0, 0, "RECENT DUELS", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      fontStyle: "900",
      color: "#ffe082",
      resolution: 4
    });

    this.historyText = this.add.text(0, 0, "", {
      fontFamily: UI_FONT,
      fontSize: "12px",
      fontStyle: "900",
      color: "#f8f1d8",
      stroke: "#000000",
      strokeThickness: 2,
      lineSpacing: 4,
      wordWrap: { width: 290 },
      resolution: 4
    });

    this.hud.add([
      this.topPanel,
      this.scoreText,
      this.inventoryText,
      this.locationText,
      this.eventBox,
      this.eventText,
      this.dangerText,
      this.versionBadge,
      this.toggleFeedHitZone,
      this.toggleRankHitZone,
      this.toggleFeedButton,
      this.toggleRankButton,
      this.leaderboardBox,
      this.leaderboardTitle,
      this.leaderboardText,
      this.historyTitle,
      this.historyText
    ]);

    this.actionButton = this.add.container(0, 0).setScrollFactor(0).setDepth(1100);

    this.actionCircle = this.add.circle(0, 0, 52, 0xf1c40f, 0.96);
    this.actionCircle.setStrokeStyle(5, 0x11142c);

    this.actionLabel = this.add.text(0, 0, "ACT", {
      fontFamily: UI_FONT,
      fontSize: "16px",
      fontStyle: "900",
      color: "#11142c",
      resolution: 4
    }).setOrigin(0.5);

    this.actionButton.add([this.actionCircle, this.actionLabel]);
    this.actionButton.on("pointerdown", () => this.handleAction());

    this.layoutHud();
    this.layoutLeaderboard();
    this.layoutControls();
    this.updateHud();

    this.scale.on("resize", () => {
      this.layoutHud();
      this.layoutLeaderboard();
      this.layoutControls();
      this.layoutDuelOverlay();
      this.updateCameraZoom();
      this.updateHud();
      this.updateDomLandscapeUi();
    });
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    this.joystick = {
      active: false,
      pointerId: null,
      baseX: 0,
      baseY: 0,
      radius: 46,
      baseRadius: 56,
      vector: new Phaser.Math.Vector2(0, 0)
    };

    this.joystickBase = this.add.circle(0, 0, 56, 0x060817, 0.62)
      .setScrollFactor(0)
      .setDepth(1100)
      .setStrokeStyle(5, 0xf8f1d8, 0.85);

    this.joystickThumb = this.add.circle(0, 0, 23, 0xf8f1d8, 0.9)
      .setScrollFactor(0)
      .setDepth(1101)
      .setStrokeStyle(4, 0x11142c, 0.95);

    this.layoutControls();

    this.input.on("pointerdown", (pointer) => {
      if (this.handleUiPointer(pointer)) return;

      const d = Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        this.joystick.baseX,
        this.joystick.baseY
      );

      const actionDistance = Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        this.actionButton.x,
        this.actionButton.y
      );

      // V10.9: joystick is now on the right, so do not restrict it to the left half.
      // The old left-side guard blocked the swapped joystick from activating.
      if (d <= this.joystick.baseRadius + 28) {
        this.joystick.active = true;
        this.joystick.pointerId = pointer.id;
        this.tapTarget = null;
        this.tapMarker.setVisible(false);
        this.updateJoystick(pointer);
        return;
      }

      if (actionDistance <= this.actionButton.radius + 20) return;

      if (this.isPointerOverUi(pointer)) return;

      this.setTapTargetFromPointer(pointer);
    });

    this.input.on("pointermove", (pointer) => {
      if (this.joystick.active && pointer.id === this.joystick.pointerId) {
        this.updateJoystick(pointer);
      }
    });

    this.input.on("pointerup", (pointer) => {
      if (pointer.id === this.joystick.pointerId) {
        this.resetJoystick();
      }
    });

    this.input.keyboard.on("keydown-SPACE", () => this.handleAction());
  }

  createNetwork() {
    this.network = new NetworkClient({
      onStatus: (message) => this.addFeedMessage(message),
      onInit: (payload) => {
        this.selfId = payload.selfId;
        this.onlineCount = payload.players?.length || 1;

        if (payload.self) {
          this.player.setPosition(payload.self.x, payload.self.y);
          this.tapTarget = null;
          this.applyServerSelf(payload.self);
        }

        this.leaderboard = payload.leaderboard || [];
        this.duelHistory = payload.duelHistory || [];
        this.syncRemotePlayers(payload.players || []);
        this.syncWorldItems(payload.items || []);
        this.syncNpcs(payload.npcs || []);
        this.addFeedMessage(`Online players: ${this.onlineCount}`);
        this.updateHud();
      },
      onWorldUpdate: (payload) => {
        this.onlineCount = payload.players?.length || 1;

        const selfState = payload.players?.find((player) => player.id === this.selfId);
        if (selfState) {
          this.applyServerSelf(selfState);
        }

        this.leaderboard = payload.leaderboard || [];
        this.duelHistory = payload.duelHistory || [];
        this.syncRemotePlayers(payload.players || []);
        this.syncWorldItems(payload.items || []);
        this.syncNpcs(payload.npcs || []);
        this.updateHud();
      },
      onPlayerLeft: (payload) => {
        this.removeRemotePlayer(payload.id);
      },
      onGameEvent: (payload) => {
        if (payload?.message) this.addFeedMessage(payload.message);
        if (payload?.type === "npc-steal") {
          this.showNpcSpeech(payload.npcId || "makis", "Efa sou ta");
        }

        if (payload?.type === "npc-steal" && payload.player?.id === this.selfId) {
          this.applyServerSelf(payload.player);
          this.cameras.main.shake(260, 0.006);
          this.cameras.main.flash(140, 241, 196, 15);
        }
      },
      onItemPickupResult: (payload) => {
        if (!payload) return;

        if (payload.ok && payload.player) {
          this.applyServerSelf(payload.player);
          this.pendingPickups.delete(payload.item?.instanceId);
          this.updateHud();
          return;
        }

        if (!payload.ok && payload.reason) {
          this.addFeedMessage(payload.reason);
        }

        if (payload.item?.instanceId) {
          this.pendingPickups.delete(payload.item.instanceId);
        }
      },
      onChallengeResult: (payload) => {
        if (!payload) return;

        if (payload.ok) {
          this.nextChallengeAt = this.time.now + GAME_CONSTANTS.CHALLENGE_COOLDOWN_MS;
          this.flashActionButton(0x2ecc71);
          if (payload.duel) {
            this.showDuelOverlay(payload.duel);
          }
          return;
        }

        this.addFeedMessage(payload.reason || "Challenge failed.");
        this.flashActionButton(0xe74c3c);
      },
      onChallengeReceived: (payload) => {
        if (payload?.message) {
          this.addFeedMessage(payload.message);
          this.cameras.main.shake(180, 0.004);
        }
      },
      onDuelResolved: (payload) => {
        if (payload) {
          this.showDuelOverlay(payload);
        }
      }
    });

    this.network.connect(this.profile);
  }

  registerPlayerColor(playerState) {
    if (!playerState) return;

    const color = playerState.nameColor;
    if (!color) return;

    if (playerState.id) {
      this.playerColorsById.set(playerState.id, color);
    }

    if (playerState.nickname) {
      this.playerColorsByName.set(playerState.nickname, color);
    }
  }

  escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  colorizePlayerNamesHtml(message) {
    let html = this.escapeHtml(message);

    const names = [...this.playerColorsByName.keys()]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    for (const name of names) {
      const color = this.playerColorsByName.get(name);
      const escapedName = this.escapeHtml(name);
      const safePattern = escapedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^\\p{L}\\p{N}_-])(${safePattern})(?=$|[^\\p{L}\\p{N}_-])`, "gu");
      html = html.replace(regex, `$1<span class="ml-player-name" style="color:${color}">$2</span>`);
    }

    html = this.colorizeMakisHtml(html);
    html = this.colorizeItemNamesHtml(html);

    return html;
  }

  colorizeMakisHtml(html) {
    return html.replace(
      /(^|[^\p{L}\p{N}_-])(Makis)(?=$|[^\p{L}\p{N}_-])/gu,
      `$1<span class="ml-makis-name" style="color:${MAKIS_TEXT_COLOR}">$2</span>`
    );
  }

  colorizeItemNamesHtml(html) {
    const itemNames = ["Wray", "Pouttozoumo", "Malaria", "Shonia", "Tsakra"];

    for (const itemName of itemNames) {
      const safePattern = itemName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^\\p{L}\\p{N}_-])(${safePattern})(?=$|[^\\p{L}\\p{N}_-])`, "gu");
      html = html.replace(regex, `$1<span class="ml-item-name" style="color:${ITEM_TEXT_COLOR}">$2</span>`);
    }

    return html;
  }

  getInventoryHtml() {
    if (!this.inventory.length) {
      return "empty";
    }

    return this.inventory
      .map((itemId) => {
        const itemName = this.escapeHtml(getItemById(itemId)?.shortName || itemId);
        return `<span class="ml-item-name" style="color:${ITEM_TEXT_COLOR}">${itemName}</span>`;
      })
      .join(", ");
  }

  createDomLandscapeUi() {
    this.domUi = {
      root: document.querySelector("#mobile-landscape-ui"),
      hud: document.querySelector("#ml-hud"),
      feedDrawer: document.querySelector("#ml-drawer"),
      feedDrawerTitle: document.querySelector("#ml-drawer-title"),
      feedDrawerContent: document.querySelector("#ml-drawer-content"),
      rankDrawer: document.querySelector("#ml-rank-drawer"),
      rankDrawerTitle: document.querySelector("#ml-rank-drawer-title"),
      rankDrawerContent: document.querySelector("#ml-rank-drawer-content"),
      feedButton: document.querySelector("#ml-feed-btn"),
      rankButton: document.querySelector("#ml-rank-btn")
    };

    this.domUi.feedButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggleDomDrawer("feed");
    });

    this.domUi.rankButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggleDomDrawer("rank");
    });

    const preventSelection = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    for (const element of [
      this.domUi.root,
      this.domUi.hud,
      this.domUi.feedDrawer,
      this.domUi.feedDrawerContent,
      this.domUi.rankDrawer,
      this.domUi.rankDrawerContent
    ]) {
      element?.addEventListener("selectstart", preventSelection);
      element?.addEventListener("dragstart", preventSelection);
      element?.addEventListener("contextmenu", preventSelection);
    }

    this.updateDomLandscapeUi();
  }

  isDomLandscapeUiActive() {
    const viewportWidth = window.innerWidth || this.scale.width;
    const viewportHeight = window.innerHeight || this.scale.height;
    return viewportWidth > viewportHeight && viewportHeight <= 720;
  }

  toggleDomDrawer(mode) {
    if (mode === "feed") {
      this.domFeedOpen = !this.domFeedOpen;
    }

    if (mode === "rank") {
      this.domRankOpen = !this.domRankOpen;
    }

    // Keep backwards-compatible field for older Phaser layout helpers, but
    // do not use it to make feed/rank mutually exclusive.
    if (!this.domFeedOpen && !this.domRankOpen) {
      this.domDrawerMode = null;
    } else if (this.domRankOpen) {
      this.domDrawerMode = "rank";
    } else {
      this.domDrawerMode = "feed";
    }

    if (this.domDrawerCloseTimer) {
      clearTimeout(this.domDrawerCloseTimer);
      this.domDrawerCloseTimer = null;
    }

    if (this.domFeedOpen || this.domRankOpen) {
      this.mobileDrawerMode = null;
    }

    this.updateDomLandscapeUi();
  }

  updateDomLandscapeUi() {
    if (!this.domUi?.root) return;

    const active = this.isDomLandscapeUiActive();
    this.domUi.root.setAttribute("aria-hidden", active ? "false" : "true");

    if (!active) {
      this.domUi.feedDrawer?.classList.add("hidden");
      this.domUi.rankDrawer?.classList.add("hidden");
      return;
    }

    const inventoryHtml = this.getInventoryHtml();

    if (this.domUi.hud) {
      this.domUi.hud.innerHTML = `<span class="ml-hud-row">Score ${this.score} | W${this.wins}/L${this.losses}</span><span class="ml-hud-row">Items: ${inventoryHtml}</span>`;
    }

    if (this.domUi.feedButton) {
      this.domUi.feedButton.textContent = this.domFeedOpen ? "HIDE" : "FEED";
    }

    if (this.domUi.rankButton) {
      this.domUi.rankButton.textContent = this.domRankOpen ? "HIDE" : "RANK";
    }

    if (this.domFeedOpen) {
      this.domUi.feedDrawer?.classList.remove("hidden");
      if (this.domUi.feedDrawerTitle) this.domUi.feedDrawerTitle.textContent = "";
      const lines = this.feedMessages.length
        ? this.feedMessages.slice(0, 8).map((message) => `<span class="ml-feed-line">• ${this.colorizePlayerNamesHtml(message)}</span>`)
        : ['<span class="ml-feed-line">No events yet.</span>'];
      if (this.domUi.feedDrawerContent) this.domUi.feedDrawerContent.innerHTML = lines.join("");
    } else {
      this.domUi.feedDrawer?.classList.add("hidden");
    }

    if (this.domRankOpen) {
      this.domUi.rankDrawer?.classList.remove("hidden");
      if (this.domUi.rankDrawerTitle) this.domUi.rankDrawerTitle.textContent = "RANK";
      const lines = this.leaderboard.length
        ? this.leaderboard.slice(0, 3).map((player) => {
          const crown = player.rank === 1 ? "👑 " : "";
          const streak = player.streak > 1 ? ` 🔥${player.streak}` : "";
          const name = `<span class="ml-player-name" style="color:${player.nameColor || "#ffffff"}">${this.escapeHtml(player.nickname)}</span>`;
          return `${player.rank}. ${crown}${name} ${player.score} W${player.wins}/L${player.losses}${streak}`;
        })
        : ["No rankings yet."];
      if (this.domUi.rankDrawerContent) this.domUi.rankDrawerContent.innerHTML = lines.join("<br>");
    } else {
      this.domUi.rankDrawer?.classList.add("hidden");
    }
  }

  handleFeedButton() {
    const { landscapePhone } = this.getUiMetrics();

    if (landscapePhone) {
      this.openMobileDrawer(this.mobileDrawerMode === "feed" ? null : "feed");
      return;
    }

    this.feedCollapsed = !this.feedCollapsed;
    this.layoutHud();
    this.layoutLeaderboard();
    this.updateHud();
  }

  handleRankButton() {
    const { landscapePhone } = this.getUiMetrics();

    if (landscapePhone) {
      this.openMobileDrawer(this.mobileDrawerMode === "rank" ? null : "rank");
      return;
    }

    this.leaderboardCollapsed = !this.leaderboardCollapsed;
    this.layoutLeaderboard();
    this.updateHud();
  }

  openMobileDrawer(mode) {
    if (this.mobileDrawerCloseEvent) {
      this.mobileDrawerCloseEvent.remove(false);
      this.mobileDrawerCloseEvent = null;
    }

    this.mobileDrawerMode = mode;

    if (mode) {
      this.feedCollapsed = true;
      this.leaderboardCollapsed = true;
      this.mobileDrawerCloseEvent = this.time.delayedCall(5000, () => {
        this.mobileDrawerMode = null;
        this.layoutHud();
        this.layoutLeaderboard();
        this.updateHud();
      });
    }

    this.layoutHud();
    this.layoutLeaderboard();
    this.updateHud();
  }

  getUiMetrics() {
    const width = this.scale.width;
    const height = this.scale.height;

    const viewportWidth = Math.max(window.innerWidth || width, width);
    const viewportHeight = Math.max(window.innerHeight || height, height);

    // The previous landscape check was too strict: some phones report a
    // canvas height above 500px in landscape because of browser chrome,
    // browser zoom, or Phaser RESIZE scaling. This catches common phone
    // landscape sizes without affecting normal desktop windows.
    const isLandscape = width > height;
    const looksLikePhoneViewport =
      Math.min(viewportWidth, viewportHeight) <= 700 ||
      Math.max(viewportWidth, viewportHeight) <= 1050;

    const phone = width < 760 || height < 700 || looksLikePhoneViewport;
    const tiny = width < 430 || height < 460;
    const landscapePhone = isLandscape && phone && height <= 720;
    const edgeMargin = tiny ? 14 : phone ? 18 : 28;

    return {
      width,
      height,
      phone,
      tiny,
      landscapePhone,
      edgeMargin
    };
  }

  layoutHud() {
    if (!this.topPanel || !this.eventBox) return;

    if (this.isDomLandscapeUiActive()) {
      const hudElements = [
        this.topPanel,
        this.scoreText,
        this.inventoryText,
        this.locationText,
        this.eventBox,
        this.eventText,
        this.dangerText,
        this.versionBadge,
        this.toggleFeedButton,
        this.toggleRankButton,
        this.toggleFeedHitZone,
        this.toggleRankHitZone
      ];

      for (const element of hudElements) {
        element?.setVisible?.(false);
      }

      this.updateDomLandscapeUi();
      return;
    }

    const restoreHudElements = [
      this.topPanel,
      this.scoreText,
      this.inventoryText,
      this.locationText,
      this.versionBadge,
      this.toggleFeedButton,
      this.toggleRankButton,
      this.toggleFeedHitZone,
      this.toggleRankHitZone
    ];

    for (const element of restoreHudElements) {
      element?.setVisible?.(true);
    }

    const { width, height, phone, tiny, landscapePhone, edgeMargin } = this.getUiMetrics();

    if (landscapePhone) {
      // Phone landscape: small top bar + top-right controls + bottom-center drawer.
      // This avoids the feed floating in the middle of the map.
      const top = edgeMargin;
      const left = edgeMargin;
      const buttonY = top + 34;
      const rankButtonX = width - edgeMargin;
      const feedButtonX = rankButtonX - 76;
      const barRightLimit = Math.max(left + 220, feedButtonX - 14);
      const barW = Math.max(230, Math.min(barRightLimit - left, width - edgeMargin * 2));
      const barH = 46;

      this.topPanel.setPosition(left, top);
      this.topPanel.setDisplaySize(barW, barH);

      this.scoreText.setPosition(left + 11, top + 7);
      this.scoreText.setFontSize("13px");

      this.inventoryText.setPosition(left + 11, top + 26);
      this.inventoryText.setFontSize("10px");

      this.locationText.setVisible(false);

      this.versionBadge.setPosition(width - edgeMargin, top);
      this.versionBadge.setFontSize("10px");

      this.toggleFeedButton.setPosition(feedButtonX, buttonY);
      this.toggleFeedButton.setFontSize("11px");
      this.toggleFeedButton.setText(this.mobileDrawerMode === "feed" ? "CLOSE" : "FEED");

      this.toggleRankButton.setPosition(rankButtonX, buttonY);
      this.toggleRankButton.setFontSize("11px");
      this.toggleRankButton.setText(this.mobileDrawerMode === "rank" ? "CLOSE" : "RANK");

      if (this.toggleFeedHitZone) {
        this.toggleFeedHitZone.setPosition(feedButtonX + 8, buttonY - 10);
        this.toggleFeedHitZone.setDisplaySize(76, 44);
      }

      if (this.toggleRankHitZone) {
        this.toggleRankHitZone.setPosition(rankButtonX + 8, buttonY - 10);
        this.toggleRankHitZone.setDisplaySize(76, 44);
      }

      if (this.dangerText) {
        this.dangerText.setVisible(false);
      }

      const drawerVisible = this.mobileDrawerMode === "feed";
      this.eventBox.setVisible(drawerVisible);
      this.eventText.setVisible(drawerVisible);

      if (drawerVisible) {
        const joystickRight = edgeMargin + (tiny ? 92 : 112);
        const actionLeft = width - edgeMargin - (tiny ? 106 : 122);
        const availableW = Math.max(260, actionLeft - joystickRight - 22);
        const drawerW = Math.min(availableW, 460);
        const drawerH = Math.min(104, Math.max(82, height * 0.26));
        const drawerX = Phaser.Math.Clamp((width - drawerW) / 2, joystickRight + 10, width - drawerW - edgeMargin);
        const drawerY = Math.max(top + 84, height - drawerH - 16);

        this.eventBox.setPosition(drawerX, drawerY);
        this.eventBox.setDisplaySize(drawerW, drawerH);

        this.eventText.setPosition(drawerX + 12, drawerY + 10);
        this.eventText.setFontSize("11px");
        this.eventText.setWordWrapWidth(drawerW - 24);
      }

      return;
    }

    if (this.mobileDrawerMode) {
      this.mobileDrawerMode = null;
    }

    this.locationText.setVisible(true);

    const landscapeCompact = landscapePhone;
    const panelW = phone
      ? Math.min(width - edgeMargin * 2, landscapeCompact ? 300 : tiny ? 292 : 330)
      : 470;
    const panelH = landscapeCompact ? 76 : tiny ? 84 : phone ? 96 : 132;

    const left = edgeMargin;
    const top = edgeMargin;

    this.topPanel.setPosition(left, top);
    this.topPanel.setDisplaySize(panelW, panelH);

    const scoreFont = landscapeCompact ? "13px" : tiny ? "13px" : phone ? "15px" : "19px";
    const smallFont = landscapeCompact ? "11px" : tiny ? "12px" : phone ? "13px" : "16px";

    this.scoreText.setPosition(left + 16, top + 12);
    this.scoreText.setFontSize(scoreFont);

    this.inventoryText.setPosition(left + 16, top + (landscapeCompact ? 37 : tiny ? 43 : phone ? 49 : 61));
    this.inventoryText.setFontSize(smallFont);

    this.locationText.setPosition(left + 16, top + (landscapeCompact ? 57 : tiny ? 66 : phone ? 74 : 94));
    this.locationText.setFontSize(smallFont);
    this.locationText.setWordWrapWidth(panelW - 32);

    this.versionBadge.setPosition(width - edgeMargin, edgeMargin);
    this.versionBadge.setFontSize(phone ? "11px" : "13px");

    const feedButtonX = width - edgeMargin;
    const feedButtonY = edgeMargin + (phone ? 31 : 37);

    this.toggleFeedButton.setPosition(feedButtonX, feedButtonY);
    this.toggleFeedButton.setFontSize(phone ? "11px" : "13px");
    this.toggleFeedButton.setText(this.feedCollapsed ? "SHOW" : "FEED");

    if (this.toggleFeedHitZone) {
      this.toggleFeedHitZone.setPosition(feedButtonX + 6, feedButtonY - 10);
      this.toggleFeedHitZone.setDisplaySize(phone ? 92 : 98, phone ? 44 : 48);
    }

    if (this.dangerText) {
      this.dangerText.setPosition(width / 2, edgeMargin + (phone ? 8 : 12));
      this.dangerText.setFontSize(phone ? "13px" : "18px");
    }

    const feedAllowed = !this.feedCollapsed && height > 330 && width > 360;
    this.eventBox.setVisible(feedAllowed);
    this.eventText.setVisible(feedAllowed);

    if (feedAllowed) {
      const availableSideWidth = width - panelW - edgeMargin * 3;
      const placeOnRight = landscapeCompact && availableSideWidth >= 250;

      const eventW = placeOnRight
        ? Math.min(360, availableSideWidth)
        : phone
          ? Math.min(width - edgeMargin * 2, 330)
          : 560;

      const eventH = landscapeCompact ? 64 : phone ? 88 : 140;

      const eventX = placeOnRight ? left + panelW + edgeMargin : left;
      const eventY = placeOnRight ? top + 62 : top + panelH + 10;

      this.eventBox.setPosition(eventX, eventY);
      this.eventBox.setDisplaySize(eventW, eventH);

      this.eventText.setPosition(eventX + 14, eventY + 10);
      this.eventText.setFontSize(landscapeCompact ? "11px" : phone ? "13px" : "16px");
      this.eventText.setWordWrapWidth(eventW - 28);
    }
  }

  layoutLeaderboard() {
    if (!this.leaderboardBox) return;

    if (this.isDomLandscapeUiActive()) {
      const leaderboardElements = [
        this.leaderboardBox,
        this.leaderboardTitle,
        this.leaderboardText,
        this.historyTitle,
        this.historyText
      ];

      for (const element of leaderboardElements) {
        element?.setVisible?.(false);
      }

      this.updateDomLandscapeUi();
      return;
    }

    const { width, height, phone, tiny, landscapePhone, edgeMargin } = this.getUiMetrics();

    if (landscapePhone) {
      const buttonY = edgeMargin + 34;
      const rankButtonX = width - edgeMargin;
      const feedButtonX = rankButtonX - 76;

      this.toggleFeedButton.setPosition(feedButtonX, buttonY);
      this.toggleFeedButton.setFontSize("11px");
      this.toggleFeedButton.setText(this.mobileDrawerMode === "feed" ? "CLOSE" : "FEED");

      this.toggleRankButton.setPosition(rankButtonX, buttonY);
      this.toggleRankButton.setFontSize("11px");
      this.toggleRankButton.setText(this.mobileDrawerMode === "rank" ? "CLOSE" : "RANK");

      if (this.toggleFeedHitZone) {
        this.toggleFeedHitZone.setPosition(feedButtonX + 8, buttonY - 10);
        this.toggleFeedHitZone.setDisplaySize(76, 44);
      }

      if (this.toggleRankHitZone) {
        this.toggleRankHitZone.setPosition(rankButtonX + 8, buttonY - 10);
        this.toggleRankHitZone.setDisplaySize(76, 44);
      }

      const visible = this.mobileDrawerMode === "rank";

      this.leaderboardBox.setVisible(visible);
      this.leaderboardTitle.setVisible(visible);
      this.leaderboardText.setVisible(visible);
      this.historyTitle.setVisible(false);
      this.historyText.setVisible(false);

      if (!visible) return;

      const joystickRight = edgeMargin + (tiny ? 92 : 112);
      const actionLeft = width - edgeMargin - (tiny ? 106 : 122);
      const availableW = Math.max(270, actionLeft - joystickRight - 22);
      const drawerW = Math.min(availableW, 480);
      const drawerH = Math.min(122, Math.max(96, height * 0.30));
      const drawerX = Phaser.Math.Clamp((width - drawerW) / 2, joystickRight + 10, width - drawerW - edgeMargin);
      const drawerY = Math.max(edgeMargin + 84, height - drawerH - 16);

      this.leaderboardBox.setPosition(drawerX, drawerY);
      this.leaderboardBox.setDisplaySize(drawerW, drawerH);

      this.leaderboardTitle.setPosition(drawerX + 14, drawerY + 10);
      this.leaderboardTitle.setFontSize("12px");

      this.leaderboardText.setPosition(drawerX + 14, drawerY + 34);
      this.leaderboardText.setFontSize("11px");
      this.leaderboardText.setWordWrapWidth(drawerW - 28);

      return;
    }

    this.toggleRankButton.setPosition(width - edgeMargin, edgeMargin + (phone ? 61 : 72));
    this.toggleRankButton.setFontSize(phone ? "11px" : "13px");
    this.toggleRankButton.setText(this.leaderboardCollapsed ? "RANK" : "HIDE");

    if (this.toggleRankHitZone) {
      this.toggleRankHitZone.setPosition(width - edgeMargin + 6, edgeMargin + (phone ? 61 : 72) - 10);
      this.toggleRankHitZone.setDisplaySize(phone ? 92 : 98, phone ? 44 : 48);
    }

    const visible = !this.leaderboardCollapsed && width > 340 && height > 360;

    this.leaderboardBox.setVisible(visible);
    this.leaderboardTitle.setVisible(visible);
    this.leaderboardText.setVisible(visible);
    this.historyTitle.setVisible(visible);
    this.historyText.setVisible(visible);

    if (!visible) return;

    const panelW = phone ? Math.min(width - edgeMargin * 2, landscapePhone ? 360 : 330) : 330;
    const panelH = phone ? (landscapePhone ? 225 : 300) : 310;

    const panelX = phone
      ? Math.max(edgeMargin, width - panelW - edgeMargin)
      : width - panelW - edgeMargin;

    const panelY = phone
      ? (landscapePhone ? edgeMargin + 95 : edgeMargin + 126)
      : edgeMargin + 112;

    this.leaderboardBox.setPosition(panelX, panelY);
    this.leaderboardBox.setDisplaySize(panelW, panelH);

    this.leaderboardTitle.setPosition(panelX + 16, panelY + 12);
    this.leaderboardTitle.setFontSize(phone ? "14px" : "16px");

    this.leaderboardText.setPosition(panelX + 16, panelY + 40);
    this.leaderboardText.setFontSize(phone ? "12px" : "14px");
    this.leaderboardText.setWordWrapWidth(panelW - 32);

    this.historyTitle.setPosition(panelX + 16, panelY + (phone ? (landscapePhone ? 132 : 168) : 176));
    this.historyTitle.setFontSize(phone ? "12px" : "14px");

    this.historyText.setPosition(panelX + 16, panelY + (phone ? (landscapePhone ? 156 : 194) : 204));
    this.historyText.setFontSize(phone ? "11px" : "13px");
    this.historyText.setWordWrapWidth(panelW - 32);
  }

  updateLeaderboardPanel() {
    if (!this.leaderboardText || !this.historyText) return;

    const { phone, landscapePhone } = this.getUiMetrics();
    const maxLeaders = landscapePhone ? 3 : phone ? 4 : 5;
    const maxHistory = landscapePhone ? 0 : phone ? 3 : 4;

    if (!this.leaderboard.length) {
      this.leaderboardText.setText("No rankings yet. Start fighting.");
    } else {
      const lines = this.leaderboard.slice(0, maxLeaders).map((player) => {
        const crown = player.rank === 1 ? "👑 " : "";
        const streak = player.streak > 1 ? ` 🔥${player.streak}` : "";
        return `${player.rank}. ${crown}${player.nickname}  ${player.score}  W${player.wins}/L${player.losses}${streak}`;
      });

      this.leaderboardText.setText(lines.join("\n"));
    }

    if (landscapePhone) {
      this.historyText.setText("");
      return;
    }

    if (!this.duelHistory.length) {
      this.historyText.setText("No duels yet.");
    } else {
      const historyLines = this.duelHistory.slice(0, maxHistory).map((duel) => {
        const detail = duel.winner.comboName
          ? ` ${duel.winner.comboIcon || "⚡"} ${duel.winner.comboName}`
          : duel.winner.abilityName
            ? ` (${duel.winner.abilityName})`
            : "";
        return `${duel.winner.nickname} > ${duel.loser.nickname}${detail}`;
      });

      this.historyText.setText(historyLines.join("\n"));
    }
  }

  layoutControls() {
    const { width, height, phone, tiny, edgeMargin } = this.getUiMetrics();

    const domLandscape = this.isDomLandscapeUiActive();
    const baseRadius = domLandscape ? 44 : tiny ? 46 : phone ? 54 : 62;
    const thumbRadius = domLandscape ? 18 : tiny ? 18 : phone ? 22 : 26;
    const moveRadius = domLandscape ? 34 : tiny ? 36 : phone ? 44 : 52;
    const actionRadius = domLandscape ? 40 : tiny ? 40 : phone ? 46 : 52;

    // V10.8: swapped mobile/desktop control sides.
    // Joystick is now on the right; ACT/DUEL is now on the left.
    const inwardShift = domLandscape ? 86 : phone ? 44 : 0;
    const upwardShift = domLandscape ? 24 : phone ? 18 : 0;

    const leftControlX = edgeMargin + actionRadius + inwardShift;
    const rightControlX = width - edgeMargin - baseRadius - inwardShift;
    const controlYForJoystick = height - edgeMargin - baseRadius - upwardShift;
    const controlYForAction = height - edgeMargin - actionRadius - upwardShift;

    if (this.joystick) {
      this.joystick.radius = moveRadius;
      this.joystick.baseRadius = baseRadius;
      this.joystick.baseX = rightControlX;
      this.joystick.baseY = controlYForJoystick;
    }

    if (this.joystickBase) {
      this.joystickBase.setRadius(baseRadius);
      this.joystickBase.setPosition(this.joystick.baseX, this.joystick.baseY);
    }

    if (this.joystickThumb) {
      this.joystickThumb.setRadius(thumbRadius);
      if (!this.joystick.active) {
        this.joystickThumb.setPosition(this.joystick.baseX, this.joystick.baseY);
      }
    }

    if (this.actionButton && this.actionCircle && this.actionLabel) {
      this.actionButton.radius = actionRadius;
      this.actionButton.setPosition(leftControlX, controlYForAction);
      this.actionCircle.setRadius(actionRadius);
      this.actionLabel.setFontSize(phone ? "13px" : "16px");

      this.actionButton.removeInteractive();
      this.actionButton.setInteractive(
        new Phaser.Geom.Circle(0, 0, actionRadius),
        Phaser.Geom.Circle.Contains
      );
    }
  }

  createDuelOverlay() {
    const { width, height } = this.getUiMetrics();

    this.duelOverlay = this.add.container(width / 2, height / 2)
      .setScrollFactor(0)
      .setDepth(1600)
      .setVisible(false);

    this.duelOverlayBg = this.add.rectangle(0, 0, 336, 380, 0x000000, 0.5);

    this.duelBanner = this.add.rectangle(0, -150, 300, 44, 0xe74c3c, 0.92);
    this.duelBanner.setStrokeStyle(3, 0xffffff, 0.86);

    this.duelTitle = this.add.text(0, -150, "DUEL RESULT", {
      fontFamily: UI_FONT,
      fontSize: "24px",
      fontStyle: "900",
      color: "#ffffff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 3,
      resolution: 4
    }).setOrigin(0.5);

    this.duelWinnerCard = this.add.rectangle(-145, -55, 205, 124, 0x02030c, 0)
      .setVisible(false);

    this.duelLoserCard = this.add.rectangle(145, -55, 205, 124, 0x02030c, 0)
      .setVisible(false);

    this.duelWinnerFace = this.add.image(-145, -78, "fighter_face_A")
      .setDisplaySize(70, 70)
      .setVisible(false);

    this.duelLoserFace = this.add.image(145, -78, "fighter_face_A")
      .setDisplaySize(70, 70)
      .setVisible(false);

    this.duelWinnerNameText = this.add.text(-145, -22, "", {
      fontFamily: UI_FONT,
      fontSize: "17px",
      fontStyle: "900",
      color: "#ffffff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 3,
      resolution: 4
    }).setOrigin(0.5).setVisible(false);

    this.duelLoserNameText = this.add.text(145, -22, "", {
      fontFamily: UI_FONT,
      fontSize: "17px",
      fontStyle: "900",
      color: "#ffffff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 3,
      resolution: 4
    }).setOrigin(0.5).setVisible(false);

    this.duelWinnerPowerText = this.add.text(-145, 6, "", {
      fontFamily: UI_FONT,
      fontSize: "15px",
      fontStyle: "900",
      color: "#fff3b0",
      align: "center",
      stroke: "#000000",
      strokeThickness: 2,
      resolution: 4
    }).setOrigin(0.5).setVisible(false);

    this.duelLoserPowerText = this.add.text(145, 6, "", {
      fontFamily: UI_FONT,
      fontSize: "15px",
      fontStyle: "900",
      color: "#fff3b0",
      align: "center",
      stroke: "#000000",
      strokeThickness: 2,
      resolution: 4
    }).setOrigin(0.5).setVisible(false);

    this.duelWinnerItemsText = this.add.text(-145, 32, "", {
      fontFamily: UI_FONT,
      fontSize: "11px",
      fontStyle: "900",
      color: ITEM_TEXT_COLOR,
      align: "center",
      wordWrap: { width: 150 },
      lineSpacing: 3,
      stroke: "#000000",
      strokeThickness: 3,
      resolution: 4
    }).setOrigin(0.5, 0).setVisible(false);

    this.duelLoserItemsText = this.add.text(145, 32, "", {
      fontFamily: UI_FONT,
      fontSize: "11px",
      fontStyle: "900",
      color: ITEM_TEXT_COLOR,
      align: "center",
      wordWrap: { width: 150 },
      lineSpacing: 3,
      stroke: "#000000",
      strokeThickness: 3,
      resolution: 4
    }).setOrigin(0.5, 0).setVisible(false);

    this.duelBeatText = this.add.text(0, -48, "BEAT", {
      fontFamily: UI_FONT,
      fontSize: "16px",
      fontStyle: "900",
      color: "#ffffff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 3,
      resolution: 4
    }).setOrigin(0.5).setVisible(false);

    this.duelMainText = this.add.text(0, 34, "", {
      fontFamily: UI_FONT,
      fontSize: "18px",
      fontStyle: "900",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: 540 },
      stroke: "#000000",
      strokeThickness: 2,
      resolution: 4
    }).setOrigin(0.5);

    this.duelComboBadgeBg = this.add.rectangle(0, 72, 250, 30, 0xf1c40f, 0.86)
      .setVisible(false);

    this.duelComboBadgeText = this.add.text(0, 72, "", {
      fontFamily: UI_FONT,
      fontSize: "13px",
      fontStyle: "900",
      color: "#11142c",
      align: "center",
      stroke: "#ffffff",
      strokeThickness: 1,
      resolution: 4
    }).setOrigin(0.5).setVisible(false);

    this.duelVsText = this.add.text(0, 104, "", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      fontStyle: "900",
      color: "#ffe082",
      align: "center",
      wordWrap: { width: 540 },
      resolution: 4
    }).setOrigin(0.5);

    this.duelComboText = this.add.text(0, 136, "", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      fontStyle: "900",
      color: "#d7ecff",
      align: "center",
      wordWrap: { width: 540 },
      lineSpacing: 5,
      stroke: "#000000",
      strokeThickness: 3,
      resolution: 4
    }).setOrigin(0.5);

    this.duelBreakdownText = this.add.text(0, 172, "", {
      fontFamily: UI_FONT,
      fontSize: "12px",
      fontStyle: "900",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: 540 },
      lineSpacing: 4,
      resolution: 4
    }).setOrigin(0.5);

    this.duelFooterText = this.add.text(0, 196, "", {
      fontFamily: UI_FONT,
      fontSize: "11px",
      fontStyle: "900",
      color: "#ffe082",
      align: "center",
      resolution: 4
    }).setOrigin(0.5);

    this.duelOverlay.add([
      this.duelOverlayBg,
      this.duelBanner,
      this.duelTitle,
      this.duelWinnerCard,
      this.duelLoserCard,
      this.duelWinnerFace,
      this.duelLoserFace,
      this.duelWinnerNameText,
      this.duelLoserNameText,
      this.duelWinnerPowerText,
      this.duelLoserPowerText,
      this.duelWinnerItemsText,
      this.duelLoserItemsText,
      this.duelBeatText,
      this.duelMainText,
      this.duelComboBadgeBg,
      this.duelComboBadgeText,
      this.duelVsText,
      this.duelComboText,
      this.duelBreakdownText,
      this.duelFooterText
    ]);

    this.layoutDuelOverlay();
  }

  layoutDuelOverlay() {
    if (!this.duelOverlay) return;

    const { width, height, phone, landscapePhone } = this.getUiMetrics();

    this.duelOverlay.setPosition(width / 2, height / 2);

    // V11.9: reduce duel overlay width by a further 30%.
    const maxOverlayWidth = phone
      ? (landscapePhone ? 315 : 235)
      : 336;
    const overlayWidth = phone
      ? Math.min(width - 34, maxOverlayWidth)
      : Math.min(336, width - 80);
    const overlayHeight = phone
      ? Math.min(height - 34, landscapePhone ? 310 : 386)
      : 400;
    const compact = phone && landscapePhone;
    const bannerWidth = overlayWidth - 24;

    this.duelOverlayBg.setDisplaySize(overlayWidth, overlayHeight);
    this.duelBanner.setDisplaySize(bannerWidth, phone ? 36 : 44);

    const top = -overlayHeight / 2;
    const cardW = compact
      ? Math.min(118, (overlayWidth - 54) / 2)
      : phone
        ? Math.min(112, (overlayWidth - 50) / 2)
        : Math.min(128, (overlayWidth - 50) / 2);
    const cardH = compact ? 128 : phone ? 142 : 160;
    const faceSize = compact ? 48 : phone ? 54 : 62;
    const cardGap = compact ? 18 : phone ? 18 : 22;
    const cardCenterOffset = cardW / 2 + cardGap / 2;
    const cardY = top + (compact ? 140 : phone ? 166 : 188);
    const faceY = cardY - (compact ? 58 : phone ? 66 : 76);
    const nameY = cardY - (compact ? 24 : phone ? 26 : 32);
    const powerY = cardY + (compact ? 0 : phone ? 2 : 4);
    const itemsY = cardY + (compact ? 20 : phone ? 24 : 30);

    this.duelTitle.setFontSize(phone ? "18px" : "24px");
    this.duelMainText.setFontSize(compact ? "14px" : phone ? "15px" : "18px");
    this.duelWinnerNameText.setFontSize(compact ? "12px" : phone ? "13px" : "16px");
    this.duelLoserNameText.setFontSize(compact ? "12px" : phone ? "13px" : "16px");
    this.duelWinnerPowerText.setFontSize(compact ? "11px" : phone ? "12px" : "14px");
    this.duelLoserPowerText.setFontSize(compact ? "11px" : phone ? "12px" : "14px");
    this.duelWinnerItemsText.setFontSize(compact ? "10px" : phone ? "11px" : "13px");
    this.duelLoserItemsText.setFontSize(compact ? "10px" : phone ? "11px" : "13px");
    this.duelWinnerItemsText.setLineSpacing(compact ? 5 : 6);
    this.duelLoserItemsText.setLineSpacing(compact ? 5 : 6);
    this.duelBeatText.setFontSize(compact ? "13px" : phone ? "13px" : "17px");
    this.duelComboBadgeText.setFontSize(compact ? "10px" : phone ? "11px" : "13px");
    this.duelVsText.setFontSize(compact ? "10px" : phone ? "11px" : "14px");
    this.duelComboText.setFontSize(compact ? "14px" : phone ? "14px" : "17px");
    this.duelBreakdownText.setFontSize(compact ? "10px" : phone ? "10px" : "12px");
    this.duelFooterText.setFontSize(phone ? "10px" : "11px");

    this.duelBanner.setY(top + (phone ? 32 : 38));
    this.duelTitle.setY(top + (phone ? 32 : 38));

    this.duelWinnerCard.setDisplaySize(cardW, cardH).setPosition(-cardCenterOffset, cardY);
    this.duelLoserCard.setDisplaySize(cardW, cardH).setPosition(cardCenterOffset, cardY);
    this.duelWinnerFace.setDisplaySize(faceSize, faceSize).setPosition(-cardCenterOffset, faceY);
    this.duelLoserFace.setDisplaySize(faceSize, faceSize).setPosition(cardCenterOffset, faceY);
    this.duelWinnerNameText.setPosition(-cardCenterOffset, nameY);
    this.duelLoserNameText.setPosition(cardCenterOffset, nameY);
    this.duelWinnerPowerText.setPosition(-cardCenterOffset, powerY);
    this.duelLoserPowerText.setPosition(cardCenterOffset, powerY);
    this.duelWinnerItemsText.setPosition(-cardCenterOffset, itemsY);
    this.duelLoserItemsText.setPosition(cardCenterOffset, itemsY);
    this.duelWinnerItemsText.setWordWrapWidth(cardW + 14);
    this.duelLoserItemsText.setWordWrapWidth(cardW + 14);
    this.duelBeatText.setPosition(0, cardY - (compact ? 4 : 0));

    this.duelMainText.setY(top + (compact ? 200 : phone ? 238 : 268));
    this.duelComboBadgeBg.setDisplaySize(compact ? 190 : phone ? 210 : 250, compact ? 24 : 28);
    this.duelComboBadgeBg.setY(top + (compact ? 200 : phone ? 250 : 282));
    this.duelComboBadgeText.setY(this.duelComboBadgeBg.y);
    this.duelVsText.setY(top + (compact ? 216 : phone ? 262 : 292));
    this.duelComboText.setY(top + (compact ? 256 : phone ? 310 : 346));
    this.duelBreakdownText.setY(top + (compact ? 270 : phone ? 330 : 362));
    this.duelFooterText.setY(overlayHeight / 2 - 20);

    const wrapWidth = overlayWidth - 24;
    this.duelMainText.setWordWrapWidth(wrapWidth);
    this.duelVsText.setWordWrapWidth(wrapWidth);
    this.duelComboText.setWordWrapWidth(wrapWidth);
    this.duelBreakdownText.setWordWrapWidth(wrapWidth);

    this.duelWinnerNameText.setWordWrapWidth(cardW - 12);
    this.duelLoserNameText.setWordWrapWidth(cardW - 12);
  }

  getSavageDuelQuote(duel, winnerBreakdown, loserBreakdown) {
    const winnerName = duel.winner?.nickname || "Winner";
    const loserName = duel.loser?.nickname || "Loser";
    const gap = Number((winnerBreakdown.total - loserBreakdown.total).toFixed(1));

    if (duel.winner?.characterId === "J") {
      return "Pollis pressed God. The rules resigned.";
    }

    if (duel.loser?.characterId === "G") {
      return "Hohos activated Hapeshis and fulfilled the prophecy.";
    }

    if (winnerBreakdown.comboName) {
      return `${winnerName} pulled a combo and chose public humiliation.`;
    }

    if (gap >= 25) {
      return `This was not a duel. ${loserName} got deleted.`;
    }

    if (gap <= 3) {
      return `${winnerName} barely survived. Still talking like it was easy.`;
    }

    const abilityMessage = winnerBreakdown.abilityResult?.message;
    if (abilityMessage && abilityMessage.length <= 105) {
      return abilityMessage;
    }

    return `${winnerName} handled business. ${loserName} has homework.`;
  }

  formatDuelItemList(breakdown = {}) {
    const inventory = Array.isArray(breakdown.inventory) ? breakdown.inventory : [];
    const itemLines = inventory.length
      ? inventory.map((itemId) => getItemById(itemId)?.shortName || itemId)
      : ["empty"];

    if (breakdown.comboName) {
      itemLines.push(`${breakdown.comboIcon || "⚡"} ${breakdown.comboName}`);
    }

    return itemLines.join("\n");
  }

  showDuelOverlay(duel) {
    if (!duel || duel.id === this.lastDuelId) return;

    this.lastDuelId = duel.id;

    const iWon = duel.winner?.id === this.selfId;
    const iLost = duel.loser?.id === this.selfId;

    const winnerBreakdown = duel.winner?.breakdown || {};
    const loserBreakdown = duel.loser?.breakdown || {};

    const duelQuote = this.getSavageDuelQuote(duel, winnerBreakdown, loserBreakdown);

    // Phase 1: neutral pre-result state. No outcome or winner data visible yet.
    this.duelBanner.setFillStyle(0xffffff, 0.96);
    this.duelTitle.setColor("#11142c");
    this.duelTitle.setStroke("#ffffff", 0);
    this.duelTitle.setText("⚔️ DUEL STARTING");

    for (const element of [
      this.duelWinnerCard,
      this.duelLoserCard,
      this.duelWinnerFace,
      this.duelLoserFace,
      this.duelWinnerNameText,
      this.duelLoserNameText,
      this.duelWinnerPowerText,
      this.duelLoserPowerText,
      this.duelWinnerItemsText,
      this.duelLoserItemsText,
      this.duelBeatText,
      this.duelComboBadgeBg,
      this.duelComboBadgeText
    ]) {
      element.setVisible(false);
    }

    this.duelMainText.setColor("#ffffff");
    this.duelMainText.setText(`${duel.challenger.nickname} vs ${duel.target.nickname}`);
    this.duelVsText.setText("Both players are making terrible decisions...");
    this.duelComboText.setText("Calculating items, combos, abilities and luck...");
    this.duelBreakdownText.setText("");
    this.duelFooterText.setText("Outcome reveals in a moment.");

    this.duelOverlay.setVisible(true);
    this.duelOverlay.setAlpha(1);
    this.duelOverlay.setScale(0.92);
    this.layoutDuelOverlay();

    this.tweens.killTweensOf(this.duelOverlay);
    this.tweens.killTweensOf(this.duelBanner);

    this.tweens.add({
      targets: this.duelOverlay,
      scale: 1,
      duration: 180,
      ease: "Back.Out"
    });

    this.cameras.main.flash(120, 255, 243, 176);
    this.cameras.main.shake(iWon || iLost ? 190 : 130, 0.0035);

    // Phase 2: reveal the actual result.
    this.time.delayedCall(1000, () => {
      if (!this.duelOverlay.visible || this.lastDuelId !== duel.id) return;

      const revealTitle = iWon
        ? "YOU WON"
        : iLost
          ? "YOU LOST"
          : "DUEL RESULT";

      const revealBannerColor = iWon ? 0x2ecc71 : iLost ? 0xe74c3c : comboColor;

      this.duelBanner.setFillStyle(revealBannerColor, 0.96);
      this.duelTitle.setColor("#ffffff");
      this.duelTitle.setStroke("#000000", 3);
      this.duelTitle.setText(revealTitle);

      this.duelWinnerFace
        .setTexture(`fighter_face_${duel.winner?.characterId || "A"}`)
        .setVisible(true);
      this.duelLoserFace
        .setTexture(`fighter_face_${duel.loser?.characterId || "A"}`)
        .setVisible(true);

      this.duelWinnerCard.setVisible(true);
      this.duelLoserCard.setVisible(true);

      this.duelWinnerNameText
        .setText(duel.winner?.nickname || "Winner")
        .setColor(duel.winner?.nameColor || "#ffffff")
        .setVisible(true);

      this.duelLoserNameText
        .setText(duel.loser?.nickname || "Loser")
        .setColor(duel.loser?.nameColor || "#ffffff")
        .setVisible(true);

      this.duelWinnerPowerText
        .setText(`${winnerBreakdown.total} POWER`)
        .setVisible(true);

      this.duelLoserPowerText
        .setText(`${loserBreakdown.total} POWER`)
        .setVisible(true);

      this.duelWinnerItemsText
        .setText(this.formatDuelItemList(winnerBreakdown))
        .setColor(ITEM_TEXT_COLOR)
        .setVisible(true);

      this.duelLoserItemsText
        .setText(this.formatDuelItemList(loserBreakdown))
        .setColor(ITEM_TEXT_COLOR)
        .setVisible(true);

      this.duelBeatText.setText("BEAT").setVisible(true);

      this.duelMainText.setColor("#ffffff");
      this.duelMainText.setText("");

      this.duelComboBadgeBg.setVisible(false);
      this.duelComboBadgeText.setVisible(false);

      this.duelVsText.setText("");
      this.duelComboText.setText(duelQuote);
      this.duelBreakdownText.setText("");
      this.duelFooterText.setText("");

      this.layoutDuelOverlay();

      this.cameras.main.shake(iWon ? 260 : iLost ? 220 : 160, iWon ? 0.007 : 0.0045);
      this.tweens.add({
        targets: [
          this.duelWinnerCard,
          this.duelLoserCard
        ],
        scale: { from: 0.92, to: 1 },
        duration: 190,
        ease: "Back.Out"
      });

      this.tweens.add({
        targets: this.duelBanner,
        alpha: 0.45,
        duration: 120,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          this.duelBanner.setAlpha(1);
        }
      });
    });

    this.tweens.add({
      targets: this.duelOverlay,
      alpha: 0,
      duration: 500,
      delay: 6600,
      onComplete: () => {
        this.duelOverlay.setVisible(false);
        this.duelOverlay.setAlpha(1);
        this.duelOverlay.setScale(1);
        this.duelBanner.setAlpha(1);

        for (const element of [
          this.duelWinnerCard,
          this.duelLoserCard,
          this.duelWinnerNameText,
          this.duelLoserNameText,
          this.duelWinnerPowerText,
          this.duelLoserPowerText,
          this.duelWinnerItemsText,
          this.duelLoserItemsText,
          this.duelBeatText,
          this.duelComboBadgeBg,
          this.duelComboBadgeText
        ]) {
          element.setVisible(false);
          element.setScale(1);
        }

        this.duelWinnerFace.setVisible(false);
        this.duelLoserFace.setVisible(false);
      }
    });
  }

  updateCameraZoom() {
    if (!this.cameras?.main) return;
    const { phone, landscapePhone } = this.getUiMetrics();
    const domLandscape = this.isDomLandscapeUiActive();
    this.cameras.main.setZoom(domLandscape || landscapePhone ? 1.08 : phone ? 0.95 : 1.25);
  }

  updateJoystick(pointer) {
    const dx = pointer.x - this.joystick.baseX;
    const dy = pointer.y - this.joystick.baseY;
    const distance = Math.min(this.joystick.radius, Math.sqrt(dx * dx + dy * dy));
    const angle = Math.atan2(dy, dx);

    const thumbX = this.joystick.baseX + Math.cos(angle) * distance;
    const thumbY = this.joystick.baseY + Math.sin(angle) * distance;

    this.joystickThumb.setPosition(thumbX, thumbY);

    this.joystick.vector.set(
      Math.cos(angle) * (distance / this.joystick.radius),
      Math.sin(angle) * (distance / this.joystick.radius)
    );
  }

  resetJoystick() {
    this.joystick.active = false;
    this.joystick.pointerId = null;
    this.joystick.vector.set(0, 0);
    this.joystickThumb.setPosition(this.joystick.baseX, this.joystick.baseY);
  }

  isPointerInRect(pointer, rect) {
    return (
      pointer.x >= rect.x &&
      pointer.x <= rect.x + rect.width &&
      pointer.y >= rect.y &&
      pointer.y <= rect.y + rect.height
    );
  }

  getUiButtonRects() {
    const { width, phone, landscapePhone, edgeMargin } = this.getUiMetrics();

    if (landscapePhone) {
      const rankButtonX = width - edgeMargin;
      const feedButtonX = rankButtonX - 76;
      const buttonY = edgeMargin + 34;

      return {
        feed: {
          x: feedButtonX - 74,
          y: buttonY - 12,
          width: 84,
          height: 48
        },
        rank: {
          x: rankButtonX - 74,
          y: buttonY - 12,
          width: 84,
          height: 48
        }
      };
    }

    const right = width - edgeMargin;
    const feedY = edgeMargin + (phone ? 31 : 37);
    const rankY = edgeMargin + (phone ? 61 : 72);

    return {
      feed: {
        x: right - (phone ? 86 : 92),
        y: feedY - 10,
        width: phone ? 92 : 98,
        height: phone ? 44 : 48
      },
      rank: {
        x: right - (phone ? 86 : 92),
        y: rankY - 10,
        width: phone ? 92 : 98,
        height: phone ? 44 : 48
      }
    };
  }

  handleUiPointer(pointer) {
    const rects = this.getUiButtonRects();

    if (this.isPointerInRect(pointer, rects.feed)) {
      this.feedCollapsed = !this.feedCollapsed;
      this.layoutHud();
      this.layoutLeaderboard();
      this.updateHud();
      return true;
    }

    if (this.isPointerInRect(pointer, rects.rank)) {
      this.leaderboardCollapsed = !this.leaderboardCollapsed;
      this.layoutLeaderboard();
      this.updateHud();
      return true;
    }

    return this.isPointerOverUi(pointer);
  }

  isPointerOverUi(pointer) {
    if (this.duelOverlay?.visible) {
      return true;
    }

    const { width, height, edgeMargin, phone, tiny, landscapePhone } = this.getUiMetrics();

    if (landscapePhone || this.isDomLandscapeUiActive()) {
      if (pointer.y <= edgeMargin + 84) return true;

      if (this.mobileDrawerMode) {
        const joystickRight = edgeMargin + (tiny ? 92 : 112);
        const actionLeft = width - edgeMargin - (tiny ? 106 : 122);
        const availableW = Math.max(260, actionLeft - joystickRight - 22);
        const drawerW = this.mobileDrawerMode === "rank"
          ? Math.min(availableW, 480)
          : Math.min(availableW, 460);
        const drawerH = this.mobileDrawerMode === "rank"
          ? Math.min(122, Math.max(96, height * 0.30))
          : Math.min(104, Math.max(82, height * 0.26));
        const drawerX = Phaser.Math.Clamp((width - drawerW) / 2, joystickRight + 10, width - drawerW - edgeMargin);
        const drawerY = Math.max(edgeMargin + 84, height - drawerH - 16);

        if (this.isPointerInRect(pointer, {
          x: drawerX,
          y: drawerY,
          width: drawerW,
          height: drawerH
        })) {
          return true;
        }
      }

      return false;
    }

    const panelW = phone
      ? Math.min(width - edgeMargin * 2, width < 430 || height < 460 ? 292 : 330)
      : 450;
    const panelH = width < 430 || height < 460 ? 78 : phone ? 90 : 120;

    if (this.isPointerInRect(pointer, {
      x: edgeMargin,
      y: edgeMargin,
      width: panelW,
      height: panelH
    })) {
      return true;
    }

    if (pointer.x >= width - 130 && pointer.y <= edgeMargin + 125) {
      return true;
    }

    if (this.eventBox?.visible && this.eventBox.getBounds) {
      const bounds = this.eventBox.getBounds();
      if (bounds.contains(pointer.x, pointer.y)) return true;
    }

    if (this.leaderboardBox?.visible && this.leaderboardBox.getBounds) {
      const bounds = this.leaderboardBox.getBounds();
      if (bounds.contains(pointer.x, pointer.y)) return true;
    }

    return false;
  }

  setTapTargetFromPointer(pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.tapTarget = {
      x: Phaser.Math.Clamp(worldPoint.x, 32, GAME_CONSTANTS.WORLD_WIDTH - 32),
      y: Phaser.Math.Clamp(worldPoint.y, 32, GAME_CONSTANTS.WORLD_HEIGHT - 32)
    };

    this.tapMarker.setPosition(this.tapTarget.x, this.tapTarget.y);
    this.tapMarker.setVisible(true);
    this.tweens.killTweensOf(this.tapMarker);
    this.tapMarker.setScale(0.8);
    this.tapMarker.setAlpha(1);
    this.tweens.add({
      targets: this.tapMarker,
      scale: 1.25,
      alpha: 0.65,
      duration: 420,
      yoyo: true,
      repeat: -1
    });
  }

  update() {
    this.updateMovement();
    this.updatePlayerLabels();
    this.updateRemotePlayers();
    this.updateNpcs();
    this.updateChallengeTarget();
    this.checkItemPickups();
    this.checkNearbyLocation();
    this.sendNetworkState();
  }

  updateMovement() {
    const move = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.left.isDown || this.keys.left.isDown) move.x -= 1;
    if (this.cursors.right.isDown || this.keys.right.isDown) move.x += 1;
    if (this.cursors.up.isDown || this.keys.up.isDown) move.y -= 1;
    if (this.cursors.down.isDown || this.keys.down.isDown) move.y += 1;

    const hasKeyboardMovement = move.lengthSq() > 0;
    const hasJoystickMovement = this.joystick.vector.lengthSq() > 0.01;

    if (hasJoystickMovement) {
      const joystickMove = this.joystick.vector.clone();

      if (joystickMove.length() > 0.18) {
        joystickMove.normalize();
      }

      move.x += joystickMove.x;
      move.y += joystickMove.y;
      this.tapTarget = null;
      this.tapMarker.setVisible(false);
    }

    if (!hasKeyboardMovement && !hasJoystickMovement && this.tapTarget) {
      const dx = this.tapTarget.x - this.player.x;
      const dy = this.tapTarget.y - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= 8) {
        this.tapTarget = null;
        this.tapMarker.setVisible(false);
        this.player.setVelocity(0, 0);
        return;
      }

      move.set(dx / distance, dy / distance);
    }

    if (move.lengthSq() > 1) move.normalize();

    this.currentMoveVector = move.clone();

    const speed = this.character.stats.speed;
    this.player.setVelocity(move.x * speed, move.y * speed);

    if (move.x !== 0 || move.y !== 0) {
      this.player.setFlipX(move.x < 0);
    }
  }

  updatePlayerLabels() {
    this.playerShadow.setPosition(this.player.x, this.player.y + 17);
    this.playerNameBg.setPosition(this.player.x, this.player.y - 38);
    this.playerName.setPosition(this.player.x, this.player.y - 40);
    this.challengeRadiusCircle.setPosition(this.player.x, this.player.y);
  }

  sendNetworkState() {
    if (!this.network || this.time.now < this.nextNetworkSendAt) return;

    this.nextNetworkSendAt = this.time.now + 50;

    this.network.sendPlayerState({
      x: this.player.x,
      y: this.player.y,
      vx: this.currentMoveVector?.x || 0,
      vy: this.currentMoveVector?.y || 0,
      flipX: this.player.flipX
    });
  }

  applyServerSelf(playerState) {
    this.registerPlayerColor(playerState);
    this.score = Number(playerState.score || 0);
    this.selfNameColor = playerState.nameColor || this.selfNameColor;
    if (this.playerName) this.playerName.setColor(this.selfNameColor);
    this.wins = Number(playerState.wins || 0);
    this.losses = Number(playerState.losses || 0);
    this.streak = Number(playerState.streak || 0);
    this.inventory = Array.isArray(playerState.inventory) ? [...playerState.inventory] : [];
  }

  syncRemotePlayers(players) {
    const seen = new Set();

    for (const playerState of players) {
      if (!playerState?.id) continue;
      this.registerPlayerColor(playerState);
      seen.add(playerState.id);

      if (playerState.id === this.selfId) continue;

      if (!this.remotePlayers.has(playerState.id)) {
        this.createRemotePlayer(playerState);
      }

      this.updateRemotePlayerTarget(playerState);
    }

    for (const id of [...this.remotePlayers.keys()]) {
      if (!seen.has(id)) {
        this.removeRemotePlayer(id);
      }
    }
  }

  createRemotePlayer(playerState) {
    const character = getCharacterById(playerState.characterId);
    const x = playerState.x || START_POSITION.x;
    const y = playerState.y || START_POSITION.y;
    const nickname = playerState.nickname || "Player";

    const shadow = this.add.image(x, y + 17, "soft_shadow")
      .setDepth(GAME_CONSTANTS.PLAYER_DEPTH - 1)
      .setAlpha(0.75);

    const sprite = this.add.sprite(x, y, `fighter_face_${playerState.characterId}`)
      .setDepth(GAME_CONSTANTS.PLAYER_DEPTH)
      .setDisplaySize(44, 44)
      .setAlpha(0.92);

    const plateWidth = Phaser.Math.Clamp(nickname.length * 11 + 28, 86, 180);

    const nameBg = this.add.rectangle(x, y - 38, plateWidth, 26, 0x02030c, 0)
      .setDepth(GAME_CONSTANTS.PLAYER_DEPTH + 1)
      .setVisible(false);
    nameBg.setStrokeStyle(0, 0x95a5a6, 0);

    const name = this.add.text(x, y - 40, nickname, {
      fontFamily: UI_FONT,
      fontSize: "14px",
      fontStyle: "900",
      color: playerState.nameColor || "#eaf2f8",
      stroke: "#000000",
      strokeThickness: 3,
      resolution: 4
    }).setOrigin(0.5).setDepth(GAME_CONSTANTS.PLAYER_DEPTH + 2);

    const targetRing = this.add.circle(x, y, 28, 0xf1c40f, 0.08)
      .setDepth(GAME_CONSTANTS.PLAYER_DEPTH - 2)
      .setVisible(false);
    targetRing.setStrokeStyle(3, 0xf1c40f, 0.9);

    this.remotePlayers.set(playerState.id, {
      id: playerState.id,
      nickname,
      nameColor: playerState.nameColor || "#eaf2f8",
      sprite,
      shadow,
      nameBg,
      name,
      targetRing,
      targetX: x,
      targetY: y,
      flipX: false,
      highlighted: false
    });

    this.addFeedMessage(`${nickname} appeared on the map.`);
  }

  updateRemotePlayerTarget(playerState) {
    const remote = this.remotePlayers.get(playerState.id);
    if (!remote) return;

    remote.nickname = playerState.nickname || remote.nickname;
    remote.nameColor = playerState.nameColor || remote.nameColor;
    remote.name.setColor(remote.nameColor);
    this.registerPlayerColor(playerState);
    remote.targetX = playerState.x;
    remote.targetY = playerState.y;
    remote.flipX = Boolean(playerState.flipX);
  }

  updateRemotePlayers() {
    for (const remote of this.remotePlayers.values()) {
      remote.sprite.x = Phaser.Math.Linear(remote.sprite.x, remote.targetX, 0.32);
      remote.sprite.y = Phaser.Math.Linear(remote.sprite.y, remote.targetY, 0.32);
      remote.sprite.setFlipX(remote.flipX);

      remote.shadow.setPosition(remote.sprite.x, remote.sprite.y + 17);
      remote.nameBg.setPosition(remote.sprite.x, remote.sprite.y - 38);
      remote.name.setPosition(remote.sprite.x, remote.sprite.y - 40);
      remote.targetRing.setPosition(remote.sprite.x, remote.sprite.y);
    }
  }

  removeRemotePlayer(id) {
    const remote = this.remotePlayers.get(id);
    if (!remote) return;

    remote.sprite.destroy();
    remote.shadow.destroy();
    remote.nameBg.destroy();
    remote.name.destroy();
    remote.targetRing.destroy();

    this.remotePlayers.delete(id);
    this.onlineCount = Math.max(1, this.onlineCount - 1);
    this.updateHud();
  }

  updateChallengeTarget() {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const remote of this.remotePlayers.values()) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        remote.sprite.x,
        remote.sprite.y
      );

      if (distance <= GAME_CONSTANTS.CHALLENGE_RADIUS && distance < nearestDistance) {
        nearest = remote;
        nearestDistance = distance;
      }
    }

    this.nearestChallengeTarget = nearest;

    for (const remote of this.remotePlayers.values()) {
      const isTarget = nearest && remote.id === nearest.id;

      if (remote.highlighted !== isTarget) {
        remote.highlighted = isTarget;
        remote.targetRing.setVisible(isTarget);
        remote.name.setColor(isTarget ? "#fff3b0" : remote.nameColor || "#eaf2f8");
      }
    }

    const nearestId = nearest?.id || null;
    if (nearestId !== this.lastNearestChallengeTargetId) {
      this.lastNearestChallengeTargetId = nearestId;
      this.updateActionButtonLabel();
      this.updateHud();
    }
  }

  updateActionButtonLabel() {
    if (!this.actionLabel || !this.actionCircle) return;

    if (this.nearestChallengeTarget) {
      this.actionLabel.setText("DUEL");
      this.actionCircle.setFillStyle(0xe74c3c, 0.96);
      return;
    }

    this.actionLabel.setText("ACT");
    this.actionCircle.setFillStyle(0xf1c40f, 0.96);
  }

  flashActionButton(color) {
    if (!this.actionCircle) return;

    const originalColor = this.nearestChallengeTarget ? 0xe74c3c : 0xf1c40f;
    this.actionCircle.setFillStyle(color, 0.96);

    this.time.delayedCall(250, () => {
      this.actionCircle.setFillStyle(originalColor, 0.96);
    });
  }

  syncNpcs(npcs) {
    const seen = new Set();

    for (const npcState of npcs) {
      if (!npcState?.id) continue;
      seen.add(npcState.id);

      if (!this.npcSprites.has(npcState.id)) {
        this.createNpcSprite(npcState);
      }

      this.updateNpcTarget(npcState);
    }

    for (const id of [...this.npcSprites.keys()]) {
      if (!seen.has(id)) {
        const npc = this.npcSprites.get(id);
        npc.sprite.destroy();
        npc.shadow.destroy();
        npc.nameBg.destroy();
        npc.name.destroy();
        npc.warningRing.destroy();
        npc.speechBg?.destroy();
        npc.speechText?.destroy();
        this.npcSprites.delete(id);
      }
    }
  }

  createNpcSprite(npcState) {
    const config = getNpcById(npcState.id);
    const name = npcState.name || config?.name || "NPC";
    const x = npcState.x || 860;
    const y = npcState.y || 820;

    const shadow = this.add.image(x, y + 19, "soft_shadow")
      .setDepth(GAME_CONSTANTS.PLAYER_DEPTH - 1)
      .setAlpha(0.82);

    const warningRing = this.add.circle(x, y, npcState.collisionRadius || 34, 0xe74c3c, 0.08)
      .setDepth(GAME_CONSTANTS.PLAYER_DEPTH - 2);
    warningRing.setStrokeStyle(3, 0xe74c3c, 0.9);

    const sprite = this.add.sprite(x, y, "npc_makis_face")
      .setDepth(GAME_CONSTANTS.PLAYER_DEPTH + 4)
      .setDisplaySize(44, 44);

    const nameBg = this.add.rectangle(x, y - 44, 74, 26, 0x02030c, 0)
      .setDepth(GAME_CONSTANTS.PLAYER_DEPTH + 5)
      .setVisible(false);
    nameBg.setStrokeStyle(0, 0xe74c3c, 0);

    const nameText = this.add.text(x, y - 46, `${name}`, {
      fontFamily: UI_FONT,
      fontSize: "13px",
      fontStyle: "900",
      color: MAKIS_TEXT_COLOR,
      stroke: "#000000",
      strokeThickness: 3,
      resolution: 4
    }).setOrigin(0.5).setDepth(GAME_CONSTANTS.PLAYER_DEPTH + 6);

    this.tweens.add({
      targets: warningRing,
      scale: { from: 0.94, to: 1.16 },
      alpha: { from: 0.8, to: 0.25 },
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    const speechBg = this.add.rectangle(x, y + 58, 104, 26, 0x02030c, 0)
      .setDepth(GAME_CONSTANTS.PLAYER_DEPTH + 7)
      .setVisible(false);
    speechBg.setStrokeStyle(0, 0xfff3b0, 0);

    const speechText = this.add.text(x, y + 56, "", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      fontStyle: "900",
      color: MAKIS_TEXT_COLOR,
      stroke: "#000000",
      strokeThickness: 3,
      resolution: 4
    }).setOrigin(0.5).setDepth(GAME_CONSTANTS.PLAYER_DEPTH + 8).setVisible(false);

    this.npcSprites.set(npcState.id, {
      id: npcState.id,
      name,
      sprite,
      shadow,
      warningRing,
      nameBg,
      name: nameText,
      speechBg,
      speechText,
      targetX: x,
      targetY: y,
      direction: npcState.direction || 1
    });

    this.addFeedMessage(`${name} is patrolling Stasikratous.`);
  }

  updateNpcTarget(npcState) {
    const npc = this.npcSprites.get(npcState.id);
    if (!npc) return;

    npc.targetX = npcState.x;
    npc.targetY = npcState.y;
    npc.direction = npcState.direction || npc.direction;
  }

  updateNpcs() {
    if (this.dangerText) {
      this.dangerText.setVisible(false);
    }

    for (const npc of this.npcSprites.values()) {
      npc.sprite.x = Phaser.Math.Linear(npc.sprite.x, npc.targetX, 0.35);
      npc.sprite.y = Phaser.Math.Linear(npc.sprite.y, npc.targetY, 0.35);
      npc.sprite.setFlipX(false);

      npc.shadow.setPosition(npc.sprite.x, npc.sprite.y + 19);
      npc.warningRing.setPosition(npc.sprite.x, npc.sprite.y);
      npc.nameBg.setPosition(npc.sprite.x, npc.sprite.y - 44);
      npc.name.setPosition(npc.sprite.x, npc.sprite.y - 46);

      if (npc.speechBg && npc.speechText) {
        npc.speechBg.setPosition(npc.sprite.x, npc.sprite.y + 58);
        npc.speechText.setPosition(npc.sprite.x, npc.sprite.y + 56);
      }
    }
  }

  showNpcSpeech(npcId, message) {
    const npc = this.npcSprites.get(npcId);
    if (!npc || !npc.speechBg || !npc.speechText) return;

    npc.speechText.setText(message);
    npc.speechBg.setVisible(true).setAlpha(1);
    npc.speechText.setVisible(true).setAlpha(1);

    this.tweens.killTweensOf(npc.speechBg);
    this.tweens.killTweensOf(npc.speechText);

    this.tweens.add({
      targets: [npc.speechBg, npc.speechText],
      y: "-=6",
      duration: 160,
      yoyo: true,
      repeat: 1,
      ease: "Sine.InOut"
    });

    this.tweens.add({
      targets: [npc.speechBg, npc.speechText],
      alpha: 0,
      duration: 350,
      delay: 2200,
      onComplete: () => {
        npc.speechBg.setVisible(false).setAlpha(1);
        npc.speechText.setVisible(false).setAlpha(1);
      }
    });
  }

  syncWorldItems(items) {
    const visibleItemIds = new Set();

    for (const itemState of items) {
      if (!itemState?.instanceId) continue;

      if (!itemState.available) {
        this.removeItemSprite(itemState.instanceId);
        continue;
      }

      visibleItemIds.add(itemState.instanceId);

      if (!this.itemSprites.has(itemState.instanceId)) {
        this.createItemSprite(itemState);
      } else {
        const itemSprite = this.itemSprites.get(itemState.instanceId);
        itemSprite.sprite.setPosition(itemState.x, itemState.y);
        itemSprite.label.setPosition(itemState.x, itemState.y + 30);
        itemSprite.glow?.setPosition(itemState.x, itemState.y);
        itemSprite.sparkle?.setPosition(itemState.x + 18, itemState.y - 18);
      }
    }

    for (const instanceId of [...this.itemSprites.keys()]) {
      if (!visibleItemIds.has(instanceId)) {
        this.removeItemSprite(instanceId);
      }
    }
  }

  createItemSprite(itemState) {
    const item = getItemById(itemState.itemId);
    if (!item) return;

    const glow = this.add.circle(itemState.x, itemState.y, 24, item.color || 0xfff3b0, 0.18)
      .setDepth(11);

    const sprite = this.physics.add.sprite(
      itemState.x,
      itemState.y,
      `item_${item.id}`
    );

    sprite.setData("instanceId", itemState.instanceId);
    sprite.setData("item", item);
    sprite.setDepth(12);

    const label = this.add.text(sprite.x, sprite.y + 30, item.shortName, {
      fontFamily: UI_FONT,
      fontSize: item.shortName.length > 8 ? "10px" : "12px",
      fontStyle: "900",
      color: "#11142c",
      backgroundColor: "#fff3b0",
      padding: { x: 5, y: 3 },
      resolution: 4
    }).setOrigin(0.5).setDepth(13);

    const sparkle = this.add.image(sprite.x + 18, sprite.y - 18, "item_sparkle")
      .setDepth(14)
      .setAlpha(0.8);

    this.tweens.add({
      targets: [sprite, label, sparkle],
      y: "-=6",
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    this.tweens.add({
      targets: [glow, sparkle],
      alpha: { from: 0.18, to: 0.55 },
      scale: { from: 0.9, to: 1.18 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    this.itemSprites.set(itemState.instanceId, {
      sprite,
      label,
      glow,
      sparkle,
      item
    });
  }

  removeItemSprite(instanceId) {
    const itemSprite = this.itemSprites.get(instanceId);
    if (!itemSprite) return;

    itemSprite.sprite.destroy();
    itemSprite.label.destroy();
    itemSprite.glow?.destroy();
    itemSprite.sparkle?.destroy();

    this.itemSprites.delete(instanceId);
    this.pendingPickups.delete(instanceId);
  }

  checkItemPickups() {
    for (const [instanceId, itemSprite] of this.itemSprites.entries()) {
      if (this.pendingPickups.has(instanceId)) continue;

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        itemSprite.sprite.x,
        itemSprite.sprite.y
      );

      if (distance <= GAME_CONSTANTS.ITEM_PICKUP_RADIUS) {
        this.pendingPickups.add(instanceId);
        this.network?.pickupItem(instanceId);

        this.tweens.add({
          targets: itemSprite.sprite,
          alpha: 0.35,
          duration: 100,
          yoyo: true,
          repeat: 1
        });

        this.time.delayedCall(1200, () => {
          this.pendingPickups.delete(instanceId);
        });
      }
    }
  }

  checkNearbyLocation() {
    const point = new Phaser.Geom.Point(this.player.x, this.player.y);
    const found = this.locationZones.find(({ trigger }) => Phaser.Geom.Rectangle.ContainsPoint(trigger, point));

    if (found?.location?.id !== this.nearbyLocation?.id) {
      this.nearbyLocation = found?.location || null;
      this.updateHud();
    }
  }

  handleAction() {
    if (this.nearestChallengeTarget) {
      if (this.time.now < this.nextChallengeAt) {
        const remaining = Math.ceil((this.nextChallengeAt - this.time.now) / 1000);
        this.addFeedMessage(`Challenge cooldown: ${remaining}s.`);
        return;
      }

      this.network?.challengePlayer(this.nearestChallengeTarget.id);
      this.addFeedMessage(`Called out ${this.nearestChallengeTarget.nickname}.`);
      this.cameras.main.shake(120, 0.0035);
      return;
    }

    if (this.nearbyLocation) {
      this.addFeedMessage(`${this.profile.nickname} caused drama at ${this.nearbyLocation.name}.`);
      this.cameras.main.shake(140, 0.0035);
    } else {
      this.addFeedMessage("Move near a player. ACT becomes DUEL.");
    }

    this.updateHud();
  }

  addFeedMessage(message) {
    this.feedMessages.unshift(message);
    this.feedMessages = this.feedMessages.slice(0, 8);
    this.updateHud();
  }

  updateHud() {
    if (!this.scoreText || !this.eventText) return;

    const { phone, landscapePhone } = this.getUiMetrics();

    const inventoryText = this.inventory.length
      ? this.inventory.map((itemId) => getItemById(itemId)?.shortName || itemId).join(" | ")
      : "empty";

    this.scoreText.setText(`Score: ${this.score}   W:${this.wins} L:${this.losses}   Online:${this.onlineCount}`);
    this.inventoryText.setText(`Items: ${inventoryText}`);

    if (this.nearestChallengeTarget) {
      this.locationText.setText(`Near: ${this.nearestChallengeTarget.nickname} • press DUEL`);
    } else if (this.nearbyLocation) {
      this.locationText.setText(`Near: ${this.nearbyLocation.name}`);
    } else {
      this.locationText.setText("Avoid Makis. Collect items. Move near players.");
    }

    const visibleEvents = landscapePhone
      ? this.feedMessages.slice(0, 4)
      : phone
        ? this.feedMessages.slice(0, 3)
        : this.feedMessages.slice(0, 8);

    this.eventText.setText(visibleEvents.map((event) => `• ${event}`).join("\n\n"));
    this.updateLeaderboardPanel();
    this.updateDomLandscapeUi();
  }
}
