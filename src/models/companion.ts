import { names, animals, uniqueNamesGenerator } from "unique-names-generator";
import {
  COMPANION_STAGE_AGE_MS,
  COMPANION_STAGE_HARVEST_BONUS,
} from "../utils/constants";

export const COMPANION_STAGES = [
  "child",
  "adolescent",
  "adult",
  "sage",
] as const;

export type CompanionStage = (typeof COMPANION_STAGES)[number];

export const COMPANION_STAGE_LABELS: Record<CompanionStage, string> = {
  child: "Enfant",
  adolescent: "Adolescent",
  adult: "Adulte",
  sage: "Sage",
};

export class Companion {
  id: string;
  name: string;
  birthdate: number;
  birthOfflineMs: number;
  stage: CompanionStage;

  constructor(birthOfflineMs = 0) {
    const firstName: string = uniqueNamesGenerator({
      dictionaries: [names],
    });
    const lastName: string = uniqueNamesGenerator({
      dictionaries: [animals],
      style: "capital",
    });

    this.id = crypto.randomUUID();
    this.name = `${firstName} ${lastName}`;
    this.birthdate = Date.now();
    this.birthOfflineMs = Math.max(0, birthOfflineMs);
    this.stage = "child";
  }

  get stageLabel(): string {
    return COMPANION_STAGE_LABELS[this.stage];
  }

  get harvestBonus(): number {
    if (this.stage === "child") return 0;
    return COMPANION_STAGE_HARVEST_BONUS[this.stage];
  }

  get nextStage(): CompanionStage | undefined {
    const currentIndex = COMPANION_STAGES.indexOf(this.stage);
    if (currentIndex < 0) return;
    return COMPANION_STAGES[currentIndex + 1];
  }

  getAgeOfflineMs(currentOfflineMs: number): number {
    return Math.max(0, currentOfflineMs - this.birthOfflineMs);
  }

  getRemainingOfflineMs(currentOfflineMs: number): number | null {
    const nextStage = this.nextStage;
    if (!nextStage) return null;

    return Math.max(
      0,
      COMPANION_STAGE_AGE_MS[nextStage] -
        this.getAgeOfflineMs(currentOfflineMs),
    );
  }

  updateStage(currentOfflineMs: number): boolean {
    const age = this.getAgeOfflineMs(currentOfflineMs);
    const targetStage = [...COMPANION_STAGES]
      .reverse()
      .find((stage) => age >= COMPANION_STAGE_AGE_MS[stage]);

    if (!targetStage) return false;

    const currentIndex = COMPANION_STAGES.indexOf(this.stage);
    const targetIndex = COMPANION_STAGES.indexOf(targetStage);
    if (targetIndex <= currentIndex) return false;

    this.stage = targetStage;
    return true;
  }
}
