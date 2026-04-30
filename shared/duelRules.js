import { getCharacterById } from "./characters.js";
import { getItemById } from "./items.js";
import {
  createEmptyAbilityResult,
  getAbilityByCharacterId,
  getFighterDisplayName
} from "./abilities.js";

export const ITEM_DUEL_EFFECTS = {
  lost_found_shot: {
    label: "Wray courage",
    power: 5,
    attack: 3,
    defense: -1,
    luck: 1
  },
  istorjia_special: {
    label: "Suspicious special",
    power: 4,
    attack: 1,
    defense: 2,
    luck: 2
  },
  new_division_malaria: {
    label: "Malaria curse",
    power: 4,
    attack: 2,
    defense: 2,
    luck: -1
  },
  apoel_powder: {
    label: "White-line speed",
    power: 5,
    attack: 2,
    speed: 4,
    luck: -1
  },
  gsp_fireworks: {
    label: "Firework violence",
    power: 6,
    attack: 4,
    defense: -1,
    luck: 1
  }
};

export const ITEM_COMBOS = [
  {
    id: "hooligan",
    name: "Hooligan Combo",
    color: 0xe74c3c,
    icon: "🏟️",
    requiredItems: ["apoel_powder", "gsp_fireworks", "lost_found_shot"],
    bonus: 14,
    message: "stadium chaos, no brakes, full bad-decision mode"
  },
  {
    id: "aloutos",
    name: "Aloutos Combo",
    color: 0x2ecc71,
    icon: "🧟",
    requiredItems: ["new_division_malaria", "lost_found_shot", "apoel_powder"],
    bonus: 13,
    message: "feral stamina and zero shame"
  },
  {
    id: "old_town_meltdown",
    name: "Old Town Meltdown",
    color: 0xf39c12,
    icon: "🍻",
    requiredItems: ["lost_found_shot", "istorjia_special", "gsp_fireworks"],
    bonus: 12,
    message: "sweet drink, bad ideas, public embarrassment"
  },
  {
    id: "toxic_pyro",
    name: "Toxic Pyro",
    color: 0x27ae60,
    icon: "☣️",
    requiredItems: ["new_division_malaria", "gsp_fireworks", "istorjia_special"],
    bonus: 12,
    message: "poison cloud with fireworks attached"
  },
  {
    id: "gsp_ultra",
    name: "GSP Ultra",
    color: 0xf1c40f,
    icon: "💥",
    requiredItems: ["apoel_powder", "gsp_fireworks", "new_division_malaria"],
    bonus: 11,
    message: "loud, unstable and impossible to ignore"
  },
  {
    id: "istorjia_afterparty",
    name: "Istorjia Afterparty",
    color: 0x9b59b6,
    icon: "🌙",
    requiredItems: ["istorjia_special", "lost_found_shot", "apoel_powder"],
    bonus: 10,
    message: "too much confidence for someone in danger"
  },
  {
    id: "bad_doctor",
    name: "Bad Doctor",
    color: 0x1abc9c,
    icon: "💊",
    requiredItems: ["new_division_malaria", "istorjia_special", "lost_found_shot"],
    bonus: 10,
    message: "medically worrying, socially unstoppable"
  },
  {
    id: "street_chemist",
    name: "Street Chemist",
    color: 0x3498db,
    icon: "🧪",
    requiredItems: ["apoel_powder", "istorjia_special", "new_division_malaria"],
    bonus: 9,
    message: "experimental chemistry from the pavement"
  }
];

function hasCombo(inventory, combo) {
  const itemSet = new Set(inventory);
  return combo.requiredItems.every((itemId) => itemSet.has(itemId));
}

export function getBestCombo(inventory = []) {
  const matchingCombos = ITEM_COMBOS
    .filter((combo) => hasCombo(inventory, combo))
    .sort((a, b) => b.bonus - a.bonus);

  return matchingCombos[0] || null;
}

export function summarizeInventory(inventory = []) {
  if (!inventory.length) return "empty pockets";

  return inventory
    .map((itemId) => getItemById(itemId)?.shortName || itemId)
    .join(" + ");
}

export function buildDuelBreakdown(player) {
  const character = getCharacterById(player.characterId);
  const stats = character.stats;
  const inventory = Array.isArray(player.inventory) ? player.inventory : [];
  const ability = getAbilityByCharacterId(player.characterId);

  const statPower =
    stats.attack * 2.2 +
    stats.defense * 1.6 +
    stats.luck * 1.5 +
    stats.speed / 60;

  let itemPower = 0;
  const itemLabels = [];

  for (const itemId of inventory) {
    const effect = ITEM_DUEL_EFFECTS[itemId];
    if (!effect) continue;

    itemPower += effect.power;
    itemLabels.push(effect.label);
  }

  const combo = getBestCombo(inventory);
  const comboBonus = combo?.bonus || 0;

  const randomMax = 12 + Math.max(0, stats.luck);
  const roll = 1 + Math.floor(Math.random() * randomMax);

  const baseTotal = statPower + itemPower + comboBonus + roll;

  return {
    characterId: player.characterId,
    fighterName: getFighterDisplayName(player.characterId),
    abilityName: ability?.name || null,
    nickname: player.nickname,
    score: player.score || 0,
    stats,
    inventory: [...inventory],
    inventorySummary: summarizeInventory(inventory),
    statPower: Number(statPower.toFixed(1)),
    itemPower,
    effectiveItemPower: itemPower,
    itemLabels,
    comboId: combo?.id || null,
    comboName: combo?.name || null,
    comboColor: combo?.color || null,
    comboIcon: combo?.icon || null,
    comboBonus,
    effectiveComboBonus: comboBonus,
    comboMessage: combo?.message || null,
    roll,
    baseTotal: Number(baseTotal.toFixed(1)),
    abilityResult: createEmptyAbilityResult(player.characterId),
    total: Number(baseTotal.toFixed(1))
  };
}

function hasItem(breakdown, itemId) {
  return Array.isArray(breakdown.inventory) && breakdown.inventory.includes(itemId);
}

function applySingleAbility(player, opponent, playerBreakdown, opponentBreakdown) {
  const result = createEmptyAbilityResult(player.characterId);
  const ability = getAbilityByCharacterId(player.characterId);

  if (!ability) return result;

  switch (player.characterId) {
    case "A": {
      result.abilityBonus = 5;
      result.message = "Piskalies landed clean. Simple violence, effective outcome.";
      break;
    }

    case "B": {
      const faster = playerBreakdown.stats.speed > opponentBreakdown.stats.speed;
      result.abilityBonus = faster ? 7 : 2;
      result.message = faster
        ? "Pikla triggered. Que te la Pompos moved first and caused problems."
        : "Pikla tried to trigger, but the speed advantage was not there.";
      break;
    }

    case "C": {
      const reduction = Number((opponentBreakdown.itemPower * 0.25).toFixed(1));
      opponentBreakdown.effectiveItemPower = Number((opponentBreakdown.effectiveItemPower - reduction).toFixed(1));
      result.opponentPenalty = reduction;
      result.message = `Shine blinded the nonsense. Opponent item power reduced by ${reduction}.`;
      break;
    }

    case "D": {
      const lucky = Math.random() < 0.25;
      result.abilityBonus = lucky ? 10 : 0;
      result.message = lucky
        ? "Lucky Rat triggered. Eva survived through pure rat mathematics."
        : "Lucky Rat failed. Eva got no help from destiny.";
      break;
    }

    case "E": {
      const hasShot = hasItem(playerBreakdown, "lost_found_shot");
      result.opponentPenalty = hasShot ? 9 : 4;
      result.abilityBonus = result.opponentPenalty;
      result.message = hasShot
        ? "Zivanka hit different with Wray. Opponent lost 9 power."
        : "Zivanka triggered. Opponent lost 4 power from the fumes.";
      break;
    }

    case "F": {
      const roll = Math.random();

      if (roll < 0.4) {
        result.abilityBonus = 12;
        result.message = "Clown Roll jackpot. Straight Outta Jerusalem did something stupid and it worked.";
      } else if (roll < 0.7) {
        result.abilityBonus = -4;
        result.message = "Clown Roll backfired. The joke became the fighter.";
      } else {
        const copied = Math.max(0, opponentBreakdown.itemPower - playerBreakdown.itemPower);
        result.abilityBonus = copied;
        result.message = `Clown Roll copied the opponent's item chaos for +${copied}.`;
      }
      break;
    }

    case "G": {
      result.forcedLoss = true;
      result.abilityBonus = -999;
      result.message = "Hapeshis triggered. Hohos is doomed to lose this duel.";
      break;
    }

    case "H": {
      result.message = "Last Breath is waiting to see if Greek Lover is losing.";
      break;
    }

    case "I": {
      const vanished = opponentBreakdown.comboBonus > 0 && Math.random() < 0.3;
      if (vanished) {
        opponentBreakdown.effectiveComboBonus = 0;
        result.cancelledOpponentCombo = true;
        result.opponentPenalty = opponentBreakdown.comboBonus;
        result.message = `Vanish triggered. Opponent combo bonus of ${opponentBreakdown.comboBonus} disappeared.`;
      } else {
        result.message = "Vanish did not trigger. Immigrant stayed visible at the worst time.";
      }
      break;
    }

    case "J": {
      result.forcedWin = true;
      result.abilityBonus = 999;
      result.message = "God triggered. Pollis wins because the rules are merely suggestions.";
      break;
    }

    default:
      break;
  }

  return result;
}

function recomputeTotal(breakdown, abilityResult) {
  const total =
    breakdown.statPower +
    breakdown.effectiveItemPower +
    breakdown.effectiveComboBonus +
    breakdown.roll +
    abilityResult.abilityBonus;

  return Number(total.toFixed(1));
}

function applyLastBreathIfNeeded(player, playerBreakdown, opponentBreakdown) {
  if (player.characterId !== "H") return;

  const currentlyLosing = playerBreakdown.total < opponentBreakdown.total;
  const result = playerBreakdown.abilityResult;

  if (currentlyLosing) {
    result.abilityBonus += 9;
    result.message = "Last Breath triggered. Greek Lover was losing, then became everyone's problem.";
  } else {
    result.abilityBonus += 3;
    result.message = "Last Breath gave a small flex bonus because Greek Lover was already fine.";
  }

  playerBreakdown.total = recomputeTotal(playerBreakdown, result);
}

function applyAbilityEffects(challenger, target, challengerBreakdown, targetBreakdown) {
  const challengerAbility = applySingleAbility(challenger, target, challengerBreakdown, targetBreakdown);
  const targetAbility = applySingleAbility(target, challenger, targetBreakdown, challengerBreakdown);

  challengerBreakdown.abilityResult = challengerAbility;
  targetBreakdown.abilityResult = targetAbility;

  challengerBreakdown.total = recomputeTotal(challengerBreakdown, challengerAbility);
  targetBreakdown.total = recomputeTotal(targetBreakdown, targetAbility);

  // Last Breath is intentionally evaluated after the first ability pass.
  applyLastBreathIfNeeded(challenger, challengerBreakdown, targetBreakdown);
  applyLastBreathIfNeeded(target, targetBreakdown, challengerBreakdown);

  // Forced outcomes happen at the end. J is intentionally overpowered; G is intentionally doomed.
  if (challengerAbility.forcedWin && !targetAbility.forcedWin) {
    challengerBreakdown.total = Math.max(challengerBreakdown.total, targetBreakdown.total + 999);
  }

  if (targetAbility.forcedWin && !challengerAbility.forcedWin) {
    targetBreakdown.total = Math.max(targetBreakdown.total, challengerBreakdown.total + 999);
  }

  if (challengerAbility.forcedLoss && !targetAbility.forcedLoss) {
    challengerBreakdown.total = Math.min(challengerBreakdown.total, targetBreakdown.total - 999);
  }

  if (targetAbility.forcedLoss && !challengerAbility.forcedLoss) {
    targetBreakdown.total = Math.min(targetBreakdown.total, challengerBreakdown.total - 999);
  }

  // Pollis beats Hohos if they meet. If both are impossible cases, the joke wins.
  if (challenger.characterId === "J" && target.characterId === "G") {
    challengerBreakdown.total = 9999;
    targetBreakdown.total = -9999;
  }

  if (target.characterId === "J" && challenger.characterId === "G") {
    targetBreakdown.total = 9999;
    challengerBreakdown.total = -9999;
  }
}

function buildDuelCommentary(winner, loser, winnerBreakdown) {
  const comboName = winnerBreakdown.comboName;
  const abilityMessage = winnerBreakdown.abilityResult?.message;
  const gap = winnerBreakdown.total - (loser.breakdown?.total || 0);

  if (winnerBreakdown.characterId === "J") {
    return "Pollis pressed God. The duel was legally over before it started.";
  }

  if (loser.breakdown?.characterId === "G") {
    return "Hohos activated Hapeshis and fulfilled the prophecy.";
  }

  if (abilityMessage && winnerBreakdown.abilityResult?.abilityBonus !== 0) {
    return abilityMessage;
  }

  if (comboName) {
    return `${winner.nickname} activated ${comboName}. ${winnerBreakdown.comboMessage}.`;
  }

  if (gap >= 12) {
    return `${winner.nickname} did not win, they filed a police report against ${loser.nickname}.`;
  }

  if (gap <= 3) {
    return `${winner.nickname} barely survived. Very questionable victory.`;
  }

  return `${winner.nickname} handled business with basic street mathematics.`;
}

export function resolveDuel(challenger, target) {
  const challengerBreakdown = buildDuelBreakdown(challenger);
  const targetBreakdown = buildDuelBreakdown(target);

  applyAbilityEffects(challenger, target, challengerBreakdown, targetBreakdown);

  let winner = challenger;
  let loser = target;
  let winnerBreakdown = challengerBreakdown;
  let loserBreakdown = targetBreakdown;

  if (targetBreakdown.total > challengerBreakdown.total) {
    winner = target;
    loser = challenger;
    winnerBreakdown = targetBreakdown;
    loserBreakdown = challengerBreakdown;
  }

  const comboPhrase = winnerBreakdown.comboName
    ? ` using ${winnerBreakdown.comboName}`
    : "";

  const winnerForCommentary = { ...winner, breakdown: winnerBreakdown };
  const loserForCommentary = { ...loser, breakdown: loserBreakdown };
  const commentary = buildDuelCommentary(winnerForCommentary, loserForCommentary, winnerBreakdown);

  return {
    id: `duel_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: Date.now(),
    challenger: {
      id: challenger.id,
      nickname: challenger.nickname,
      nameColor: challenger.nameColor,
      characterId: challenger.characterId,
      fighterName: challengerBreakdown.fighterName,
      abilityName: challengerBreakdown.abilityName,
      breakdown: challengerBreakdown
    },
    target: {
      id: target.id,
      nickname: target.nickname,
      nameColor: target.nameColor,
      characterId: target.characterId,
      fighterName: targetBreakdown.fighterName,
      abilityName: targetBreakdown.abilityName,
      breakdown: targetBreakdown
    },
    winner: {
      id: winner.id,
      nickname: winner.nickname,
      nameColor: winner.nameColor,
      characterId: winner.characterId,
      fighterName: winnerBreakdown.fighterName,
      abilityName: winnerBreakdown.abilityName,
      breakdown: winnerBreakdown
    },
    loser: {
      id: loser.id,
      nickname: loser.nickname,
      nameColor: loser.nameColor,
      characterId: loser.characterId,
      fighterName: loserBreakdown.fighterName,
      abilityName: loserBreakdown.abilityName,
      breakdown: loserBreakdown
    },
    commentary,
    message: `${winner.nickname} beat ${loser.nickname}${comboPhrase} (${winnerBreakdown.total} vs ${loserBreakdown.total}).`
  };
}
