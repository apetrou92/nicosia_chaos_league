import Phaser from "phaser";
import "../src/styles/main.css";

import { CHARACTERS } from "@shared/characters.js";
import { getAbilityByCharacterId } from "@shared/abilities.js";
import { getFighterFaceAsset } from "@shared/fighterFaces.js";
import { GameScene } from "./scenes/GameScene.js";

const state = {
  selectedCharacterId: null
};

const landing = document.querySelector("#landing");
const gameShell = document.querySelector("#game-shell");
const characterGrid = document.querySelector("#character-grid");
const startButton = document.querySelector("#start-button");
const nicknameInput = document.querySelector("#nickname");

function createCharacterCards() {
  characterGrid.innerHTML = "";

  for (const character of CHARACTERS) {
    const button = document.createElement("button");
    button.className = "character-card";
    button.type = "button";
    button.dataset.characterId = character.id;

    const color = `#${character.color.toString(16).padStart(6, "0")}`;
    const faceAsset = getFighterFaceAsset(character.id);
    const ability = getAbilityByCharacterId(character.id);

    button.innerHTML = `
      <span class="character-portrait" style="background-image:url('${faceAsset || ""}'); border-color:${color}; background-color:${color}"></span>
      <span class="fighter-name">${character.name}</span>
      <small>${character.futureAbility}</small>
      <span class="ability-desc">${ability?.description || ""}</span>
    `;

    button.addEventListener("click", () => {
      state.selectedCharacterId = character.id;
      document.querySelectorAll(".character-card").forEach((card) => {
        card.classList.toggle("selected", card.dataset.characterId === character.id);
      });
      validateStart();
    });

    characterGrid.appendChild(button);
  }
}

function validateStart() {
  const hasName = nicknameInput.value.trim().length > 0;
  startButton.disabled = !hasName || !state.selectedCharacterId;
}

function startGame() {
  const nickname = nicknameInput.value.trim().slice(0, 14) || "Player";
  const characterId = state.selectedCharacterId || "A";

  // Important: store the profile before Phaser starts the first scene.
  // The previous version set this too late, so GameScene sometimes used "Player".
  window.__NCL_PLAYER_PROFILE__ = {
    nickname,
    characterId
  };

  landing.classList.add("hidden");
  gameShell.classList.remove("hidden");

  const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    backgroundColor: "#151830",
    // Text readability is more important now that the UI is getting richer.
    // Sprites remain simple/pixel-styled, but canvas text is rendered cleaner.
    pixelArt: false,
    roundPixels: false,
    antialias: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      parent: "game-container",
      width: window.innerWidth,
      height: window.innerHeight
    },
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
        fixedStep: false
      }
    },
    scene: [GameScene]
  };

  const game = new Phaser.Game(config);
  window.__NCL_GAME__ = game;
}

createCharacterCards();
nicknameInput.addEventListener("input", validateStart);
startButton.addEventListener("click", startGame);

nicknameInput.focus();
