export const ITEMS = [
  {
    id: "lost_found_shot",
    displayName: "Wray Nephew Shot",
    shortName: "Wray",
    locationId: "lost_found",
    color: 0xffffff,
    outline: 0x2c3e50,
    effect: "attackBoost",
    description: "+Attack in future duels. Chance to backfire later."
  },
  {
    id: "istorjia_special",
    displayName: "Pouttozoumo",
    shortName: "Pouttozoumo",
    locationId: "istorjia",
    color: 0xff9ff3,
    outline: 0x6c3483,
    effect: "randomBuff",
    description: "Random cursed buff in future duels."
  },
  {
    id: "new_division_malaria",
    displayName: "Malaria",
    shortName: "Malaria",
    locationId: "new_division",
    color: 0x27ae60,
    outline: 0x145a32,
    effect: "poison",
    description: "Poison effect in future duels."
  },
  {
    id: "apoel_powder",
    displayName: "Cocaine",
    shortName: "Shonia",
    locationId: "apoel_fanclub",
    color: 0xd6eaf8,
    outline: 0x154360,
    effect: "speedBoost",
    description: "+Speed / initiative in future duels."
  },
  {
    id: "gsp_fireworks",
    displayName: "Fireworks",
    shortName: "Tsakra",
    locationId: "gsp",
    color: 0xf39c12,
    outline: 0x7e5109,
    effect: "chaosDamage",
    description: "Big chaotic duel effect later."
  }
];

export function getItemById(id) {
  return ITEMS.find((item) => item.id === id);
}
