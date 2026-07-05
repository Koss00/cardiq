/**
 * cardArt — the hero card set. One face is picked at random per visit and
 * shared by both the particle assembly and the interactive 3D card (module
 * singleton, so they always agree). Missing files fall back to the
 * procedural art via each consumer's own error path.
 */

export const CARD_FACES = [
  '/card/card-front.jpg', // Mahomes — football, BUY
  '/card/card-wemby.jpg', // Wembanyama — basketball, BUY
  '/card/card-trout.jpg', // Trout — baseball, SELL
];

let chosen: string | null = null;

export function pickCardFace(): string {
  if (!chosen) {
    chosen = CARD_FACES[Math.floor(Math.random() * CARD_FACES.length)];
  }
  return chosen;
}
