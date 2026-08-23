import { beforeEach, describe, expect, it, vi } from "vitest";

const operations = vi.hoisted(() => ({ getTutorialProgress: vi.fn(), saveTutorialProgress: vi.fn(), submitTutorialFeedback: vi.fn() }));
vi.mock("../features/tutorial/progressDb", () => operations);
vi.mock("../features/tutorial/feedbackDb", () => operations);

import { tutorialRouter } from "./tutorial";

const authenticatedContext = {
  user: { id: 17, openId: "tutorial-user", name: "Tutorial User", email: "tutorial@example.test", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
} as never;

describe("tutorialRouter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps tutorial progress private to the authenticated user", async () => {
    operations.getTutorialProgress.mockResolvedValue({ userId: 17, activeStep: 2, completed: false });
    operations.saveTutorialProgress.mockResolvedValue({ userId: 17, activeStep: 4, completed: true });
    const caller = tutorialRouter.createCaller(authenticatedContext);

    await expect(caller.progress()).resolves.toMatchObject({ activeStep: 2 });
    await expect(caller.saveProgress({ activeStep: 4, completed: true })).resolves.toMatchObject({ completed: true });
    expect(operations.getTutorialProgress).toHaveBeenCalledWith(17);
    expect(operations.saveTutorialProgress).toHaveBeenCalledWith({ userId: 17, activeStep: 4, completed: true });
  });

  it("rejects unauthenticated access and invalid tutorial steps", async () => {
    const anonymous = tutorialRouter.createCaller({} as never);
    await expect(anonymous.progress()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const caller = tutorialRouter.createCaller(authenticatedContext);
    await expect(caller.saveProgress({ activeStep: 5, completed: false })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("records bounded feedback for the authenticated sender only", async () => {
    operations.submitTutorialFeedback.mockResolvedValue({ feedbackId: "TFB-123" });
    const caller = tutorialRouter.createCaller(authenticatedContext);

    await expect(caller.submitFeedback({ category: "Suggestion", message: "Make the evidence handoff example more explicit.", contactEmail: "followup@example.test" })).resolves.toEqual({ feedbackId: "TFB-123" });
    expect(operations.submitTutorialFeedback).toHaveBeenCalledWith({ userId: 17, category: "Suggestion", message: "Make the evidence handoff example more explicit.", contactEmail: "followup@example.test" });
    await expect(caller.submitFeedback({ category: "Issue", message: "too short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const anonymous = tutorialRouter.createCaller({} as never);
    await expect(anonymous.submitFeedback({ category: "Question", message: "How should role changes be reviewed?" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
