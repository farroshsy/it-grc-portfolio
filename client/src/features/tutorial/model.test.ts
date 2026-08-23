import { describe, expect, it } from "vitest";
import { TUTORIAL_STEP_COUNT, tutorialHrefForStep, tutorialReleaseNotes, tutorialSteps } from "./model";

describe("tutorial feature model", () => {
  it("keeps one canonical five-step walkthrough and safe contextual link targets", () => {
    expect(tutorialSteps).toHaveLength(TUTORIAL_STEP_COUNT);
    expect(tutorialHrefForStep(0)).toBe("/how-to-use?step=1");
    expect(tutorialHrefForStep(3)).toBe("/how-to-use?step=4");
    expect(tutorialHrefForStep(-4)).toBe("/how-to-use?step=1");
    expect(tutorialHrefForStep(99)).toBe("/how-to-use?step=5");
  });

  it("keeps release notes explicit about available capabilities and deferred authorization", () => {
    expect(tutorialReleaseNotes).toHaveLength(3);
    expect(tutorialReleaseNotes.some((note) => note.version === "Pending authorization" && /server-side authorization/i.test(note.summary))).toBe(true);
  });
});
