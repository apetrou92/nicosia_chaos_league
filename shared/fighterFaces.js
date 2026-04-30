export const FIGHTER_FACE_ASSETS = {
  "A": "/assets/fighters/A-fuhrer.png",
  "B": "/assets/fighters/B-que-te-la-pompos.png",
  "C": "/assets/fighters/C-karaflos-igetis.png",
  "D": "/assets/fighters/D-eva.png",
  "E": "/assets/fighters/E-ppekris.png",
  "F": "/assets/fighters/F-straight-outta-jerusalem.png",
  "G": "/assets/fighters/G-hohos.png",
  "H": "/assets/fighters/H-greek-lover.png",
  "I": "/assets/fighters/I-immigrant.png",
  "J": "/assets/fighters/J-pollis.png"
};

export function getFighterFaceAsset(characterId) {
  return FIGHTER_FACE_ASSETS[characterId] || null;
}
