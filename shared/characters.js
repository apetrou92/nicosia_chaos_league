export const CHARACTERS = [
  {
    id: "A",
    name: "Fuhrer",
    color: 0xe74c3c,
    outline: 0x7b241c,
    description: "Balanced troublemaker.",
    stats: { hp: 10, attack: 3, defense: 3, speed: 175, luck: 2 },
    futureAbility: "Piskalies"
  },
  {
    id: "B",
    name: "Que te la Pompos",
    color: 0x3498db,
    outline: 0x1b4f72,
    description: "Fast and annoying.",
    stats: { hp: 9, attack: 2, defense: 2, speed: 210, luck: 3 },
    futureAbility: "Pikla"
  },
  {
    id: "C",
    name: "Karaflos Igetis",
    color: 0x2ecc71,
    outline: 0x145a32,
    description: "Hard to bully.",
    stats: { hp: 12, attack: 2, defense: 4, speed: 155, luck: 2 },
    futureAbility: "Shine"
  },
  {
    id: "D",
    name: "Eva",
    color: 0xf1c40f,
    outline: 0x7d6608,
    description: "Lucky rat energy.",
    stats: { hp: 9, attack: 3, defense: 2, speed: 180, luck: 5 },
    futureAbility: "Lucky Rat"
  },
  {
    id: "E",
    name: "PPekris",
    color: 0x9b59b6,
    outline: 0x512e5f,
    description: "Toxic but useful.",
    stats: { hp: 10, attack: 3, defense: 2, speed: 170, luck: 3 },
    futureAbility: "Zivanka"
  },
  {
    id: "F",
    name: "Straight Outta Jerusalem",
    color: 0xe67e22,
    outline: 0x784212,
    description: "Pure clown physics.",
    stats: { hp: 10, attack: 4, defense: 1, speed: 185, luck: 4 },
    futureAbility: "Clown Roll"
  },
  {
    id: "G",
    name: "Hohos",
    color: 0x1abc9c,
    outline: 0x0b5345,
    description: "Actually plans things.",
    stats: { hp: 10, attack: 2, defense: 3, speed: 170, luck: 4 },
    futureAbility: "Hapeshis"
  },
  {
    id: "H",
    name: "Greek Lover",
    color: 0xec407a,
    outline: 0x880e4f,
    description: "Menace when cornered.",
    stats: { hp: 8, attack: 5, defense: 1, speed: 190, luck: 2 },
    futureAbility: "Last Breath"
  },
  {
    id: "I",
    name: "Immigrant",
    color: 0xbdc3c7,
    outline: 0x566573,
    description: "Ghost mode pending.",
    stats: { hp: 9, attack: 3, defense: 3, speed: 185, luck: 3 },
    futureAbility: "Vanish"
  },
  {
    id: "J",
    name: "Pollis",
    color: 0x34495e,
    outline: 0x17202a,
    description: "Wannabe king.",
    stats: { hp: 11, attack: 3, defense: 3, speed: 165, luck: 2 },
    futureAbility: "God"
  }
];

export function getCharacterById(id) {
  return CHARACTERS.find((character) => character.id === id) || CHARACTERS[0];
}
