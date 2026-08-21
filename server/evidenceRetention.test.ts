import { describe, expect, it } from "vitest";
import { resolveEvidenceAttachmentLifecycle } from "./controlAssuranceDb";

describe("evidence attachment retention", () => {
  const now = new Date("2026-08-21T00:00:00Z");

  it("revokes the workflow storage URL once retention has expired while keeping audit metadata", () => {
    const attachment = resolveEvidenceAttachmentLifecycle({ retentionStatus: "Active", retentionUntil: new Date("2026-08-20T00:00:00Z"), expiredAt: null, storageUrl: "/manus-storage/evidence.pdf" }, now);
    expect(attachment).toMatchObject({ retentionStatus: "Expired", storageUrl: null });
    expect(attachment.expiredAt).toEqual(now);
  });

  it("honors legal hold even after the configured retention date", () => {
    const attachment = resolveEvidenceAttachmentLifecycle({ retentionStatus: "Legal hold", retentionUntil: new Date("2026-08-20T00:00:00Z"), expiredAt: null, storageUrl: "/manus-storage/evidence.pdf" }, now);
    expect(attachment).toMatchObject({ retentionStatus: "Legal hold", storageUrl: "/manus-storage/evidence.pdf" });
  });
});
