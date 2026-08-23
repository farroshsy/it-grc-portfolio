import { describe, expect, it } from "vitest";
import { TUTORIAL_STEP_COUNT, tutorialHrefForStep, tutorialSteps } from "./model";

describe("tutorial feature model", () => {
  it("keeps one canonical five-step walkthrough and safe contextual link targets", () => {
    expect(tutorialSteps).toHaveLength(TUTORIAL_STEP_COUNT);
    expect(tutorialHrefForStep(0)).toBe("/how-to-use?step=1");
    expect(tutorialHrefForStep(3)).toBe("/how-to-use?step=4");
    expect(tutorialHrefForStep(-4)).toBe("/how-to-use?step=1");
    expect(tutorialHrefForStep(99)).toBe("/how-to-use?step=5");
  });
});
