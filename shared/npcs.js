export const NPCS = {
  makis: {
    id: "makis",
    name: "Makis",
    nickname: "Makis the Tax Collector",
    y: 820,
    minX: 860,
    maxX: 1500,
    speed: 115,
    collisionRadius: 115,
    stealCooldownMs: 3500,
    color: 0x11142c,
    accentColor: 0xf1c40f
  }
};

export function getNpcById(id) {
  return NPCS[id] || null;
}
