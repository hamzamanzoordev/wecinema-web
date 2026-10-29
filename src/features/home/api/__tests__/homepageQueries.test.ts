import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Video } from "@/types";

const apiFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/fetch/serverFetch", () => ({
  apiFetch,
  ApiError: class ApiError extends Error {
    status = 500;
    statusText = "error";
  },
}));

import { getHomepageData } from "../homepageQueries";

const video = (id: string, daysAgo: number, extra: Partial<Video> = {}): Video =>
  ({
    _id: id,
    title: id,
    createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    ...extra,
  }) as Video;

beforeEach(() => {
  apiFetch.mockReset();
});

describe("getHomepageData latest videos", () => {
  it("lists new uploads newest first, even ones that aren't promoted", async () => {
    apiFetch.mockResolvedValue({
      videos: [
        video("old-red-carpet", 30, { red_carpet: true, views: 5000 }),
        video("yesterday", 1),
        video("today", 0),
        video("last-week", 7, { recommended: true }),
      ],
    });

    const { latest } = await getHomepageData();

    expect(latest.map((v) => v._id)).toEqual(["today", "yesterday", "last-week", "old-red-carpet"]);
  });

  it("leaves out shorts and unpublished videos, and caps the row at twelve", async () => {
    apiFetch.mockResolvedValue({
      videos: [
        video("short", 0, { isShort: true }),
        video("unpublished", 0, { published: false }),
        ...Array.from({ length: 14 }, (_, i) => video(`film-${i + 1}`, i + 1)),
      ],
    });

    const { latest } = await getHomepageData();

    expect(latest).toHaveLength(12);
    expect(latest.map((v) => v._id)).toEqual(Array.from({ length: 12 }, (_, i) => `film-${i + 1}`));
  });

  it("is empty when the video list can't be fetched", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiFetch.mockRejectedValue(new Error("network down"));

    const { latest } = await getHomepageData();

    expect(latest).toEqual([]);
  });
});
