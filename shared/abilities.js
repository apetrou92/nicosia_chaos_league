export const ABILITIES = {
  A: {
    id: "piskalies",
    name: "Piskalies",
    fighterName: "Fuhrer",
    description: "Flat +5 duel power.",
    type: "flat_bonus"
  },
  B: {
    id: "pikla",
    name: "Pikla",
    fighterName: "Que te la Pompos",
    description: "+7 if faster than opponent.",
    type: "speed_bonus"
  },
  C: {
    id: "shine",
    name: "Shine",
    fighterName: "Karaflos Igetis",
    description: "Reduces opponent item power by 25%.",
    type: "anti_item"
  },
  D: {
    id: "lucky_rat",
    name: "Lucky Rat",
    fighterName: "Eva",
    description: "25% chance to add +10 duel power.",
    type: "chance_bonus"
  },
  E: {
    id: "zivanka",
    name: "Zivanka",
    fighterName: "PPekris",
    description: "Opponent loses -4 power; stronger if carrying Wray Nephew Shot.",
    type: "opponent_penalty"
  },
  F: {
    id: "clown_roll",
    name: "Clown Roll",
    fighterName: "Straight Outta Jerusalem",
    description: "Random effect: +12, -4, or swap item power.",
    type: "random"
  },
  G: {
    id: "hapeshis",
    name: "Hapeshis",
    fighterName: "Hohos",
    description: "Doomed to lose every duel.",
    type: "forced_loss"
  },
  H: {
    id: "last_breath",
    name: "Last Breath",
    fighterName: "Greek Lover",
    description: "If losing before final result, gets comeback +9.",
    type: "comeback"
  },
  I: {
    id: "vanish",
    name: "Vanish",
    fighterName: "Immigrant",
    description: "30% chance to ignore opponent combo bonus.",
    type: "combo_cancel"
  },
  J: {
    id: "god",
    name: "God",
    fighterName: "Pollis",
    description: "Wins every duel no matter what.",
    type: "forced_win"
  }
};

export function getAbilityByCharacterId(characterId) {
  return ABILITIES[characterId] || null;
}

export function getFighterDisplayName(characterId) {
  return ABILITIES[characterId]?.fighterName || characterId;
}

export function createEmptyAbilityResult(characterId) {
  const ability = getAbilityByCharacterId(characterId);

  return {
    abilityId: ability?.id || null,
    abilityName: ability?.name || null,
    fighterName: ability?.fighterName || characterId,
    abilityBonus: 0,
    opponentPenalty: 0,
    cancelledOpponentCombo: false,
    forcedWin: false,
    forcedLoss: false,
    message: ability ? `${ability.name} did not trigger.` : "No ability."
  };
}
