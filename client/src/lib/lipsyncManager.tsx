import { Lipsync } from "wawa-lipsync";

// Create lipsync manager only on client side
let lipsyncManager: Lipsync | null = null;

export const getLipsyncManager = (): Lipsync => {
  if (typeof window !== "undefined" && !lipsyncManager) {
    lipsyncManager = new Lipsync();
  }
  return lipsyncManager!;
};

// Mapping from wawa-lipsync visemes to Ready Player Me visemes
export const visemeMapping: { [key: string]: string } = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};
