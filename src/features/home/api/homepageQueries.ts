import { apiFetch, ApiError } from "@/lib/fetch/serverFetch";
import type { Video } from "@/types";

/**
 * How many videos the homepage's video-grid rows (Latest and Trending)
 * show, expressed as rows at the desktop 3-column layout. Bump this when
 * ready to show more — it's intentionally kept low for now.
 */
const HOMEPAGE_ROWS = 2;
const HOMEPAGE_COLUMNS = 3;
const HOMEPAGE_ROW_LIMIT = HOMEPAGE_ROWS * HOMEPAGE_COLUMNS;

/** Latest Videos gets more room than Trending so recent uploads stay visible. */
const LATEST_ROWS = 4;
const LATEST_LIMIT = LATEST_ROWS * HOMEPAGE_COLUMNS;

/**
 * Homepage data layer.
 *
 * The homepage used to make several separate `/video/category/:genre` calls.
 * We now fetch `/video/all` ONCE (server-side, ISR-cached) and derive
 * everything the page needs in memory: the hero "featured" films, the
 * latest and trending rows, and the stat counters.
 */

interface VideoListResponse {
  videos?: Video[];
  data?: Video[];
  count?: number;
}

const CACHE_TTL = 300; // 5 min — matches page-level `revalidate`

/**
 * Video pinned to the hero's lead slide by request:
 * "The Golden One And The Scattered Neighbors".
 */
const HERO_PINNED_VIDEO_ID = "6a2095df68610b8504ec2569";

export interface HomepageStats {
  totalFilms: number;
  totalCreators: number;
}

export interface HomepageData {
  featured: Video[];
  latest: Video[];
  trending: Video[];
  shorts: Video[];
  stats: HomepageStats;
}

const EMPTY: HomepageData = {
  featured: [],
  latest: [],
  trending: [],
  shorts: [],
  stats: { totalFilms: 0, totalCreators: 0 },
};

function extractList(data: VideoListResponse | Video[]): Video[] {
  return Array.isArray(data) ? data : data.videos ?? data.data ?? [];
}

function authorId(v: Video): string | null {
  if (typeof v.author === "object" && v.author !== null) return v.author._id ?? null;
  if (typeof v.author === "string") return v.author;
  return null;
}

/** Content-safety + visibility gate: only published, non-hidden uploads. */
function isPublishable(v: Video): boolean {
  return v.published !== false;
}

/**
 * Newest first. Publishing a draft resets createdAt to the publish time
 * (backend services/videoDraft.service.js), so this is publish order.
 */
function newestFirst(a: Video, b: Video): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/** trending sort: red_carpet first, then most viewed, then newest. */
function trendingSort(a: Video, b: Video): number {
  const rc = Number(b.red_carpet ?? false) - Number(a.red_carpet ?? false);
  if (rc !== 0) return rc;
  const views = (b.views ?? 0) - (a.views ?? 0);
  if (views !== 0) return views;
  return newestFirst(a, b);
}

export async function getHomepageData(): Promise<HomepageData> {
  let all: Video[];
  try {
    const data = await apiFetch<VideoListResponse | Video[]>("/video/all", {
      revalidate: CACHE_TTL,
      tags: ["videos:all", "videos:home"],
    });
    all = extractList(data).filter(isPublishable);
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn(`[home] /video/all ${err.status} ${err.statusText}`);
    } else {
      console.error("[home] /video/all", err);
    }
    return EMPTY;
  }

  if (all.length === 0) return EMPTY;

  // ── Featured (hero): recommended first, fall back to red_carpet + views ──
  const recommended = all.filter((v) => v.recommended).sort(trendingSort);
  const featuredPool =
    recommended.length > 0
      ? recommended
      : all.filter((v) => v.red_carpet).sort(trendingSort);
  const featuredBase = (featuredPool.length > 0 ? featuredPool : [...all].sort(trendingSort)).slice(0, 5);

  // Pin the requested video to the lead hero slide. If it's present and
  // publishable, force it to position 0; otherwise the normal order stands.
  const pinned = all.find((v) => v._id === HERO_PINNED_VIDEO_ID);
  const featured = pinned
    ? [pinned, ...featuredBase.filter((v) => v._id !== pinned._id)]
    : featuredBase;

  // ── Latest: every new upload, newest first. Shorts have their own row. ──
  const latest = all
    .filter((v) => !v.isShort)
    .sort(newestFirst)
    .slice(0, LATEST_LIMIT);

  // ── Trending: recommended OR red_carpet, sorted, deduped ──
  const trending = all
    .filter((v) => v.recommended || v.red_carpet)
    .sort(trendingSort)
    .slice(0, HOMEPAGE_ROW_LIMIT);
  const trendingResolved =
    trending.length > 0 ? trending : [...all].sort(trendingSort).slice(0, HOMEPAGE_ROW_LIMIT);

  // ── Shorts: short-form vertical videos ──
  const shorts = all
    .filter((v) => v.isShort)
    .sort(trendingSort)
    .slice(0, 12);

  // ── Stats ──
  const creators = new Set<string>();
  for (const v of all) {
    const id = authorId(v);
    if (id) creators.add(id);
  }

  return {
    featured,
    latest,
    trending: trendingResolved,
    shorts,
    stats: { totalFilms: all.length, totalCreators: creators.size },
  };
}
