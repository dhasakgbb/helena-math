// src/lib/help.ts
// Help content a game exposes for its CURRENT question. null = no help yet.
export interface GameHelp {
  /** Static per game: the rules + one tiny example. */
  howToPlay: string;
  /** A nudge for the current on-screen question (does not give the answer). */
  hint: string;
  /** 2–4 worked steps for the current question (revealed one at a time). */
  steps: string[];
}
