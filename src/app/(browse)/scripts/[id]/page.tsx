import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/fetch/serverFetch";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_ORIGIN, OG } from "@/lib/seo";
import { ScriptDetailClient } from "./ScriptDetailClient";
import type { ScriptDetail } from "./types";

export const revalidate = 300;

const SITE = SITE_ORIGIN;

/** Server-side fetch — powers both metadata and render (deduped by fetch cache). */
async function getScript(id: string): Promise<ScriptDetail | null> {
  try {
    const res = await apiFetch<{ script?: ScriptDetail } | ScriptDetail>(
      `/video/scripts/${id}`,
      { revalidate, tags: [`script:${id}`] },
    );
    const s = (res as { script?: ScriptDetail }).script ?? (res as ScriptDetail);
    return s && s._id ? s : null;
  } catch {
    return null;
  }
}

function plainText(html?: string): string {
  return (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function genresOf(script: ScriptDetail): string[] {
  return script.genre ? (Array.isArray(script.genre) ? script.genre : [script.genre]) : [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const script = await getScript(id);

  if (!script) {
    return {
      title: "Script Not Found | WeCinema",
      robots: { index: false, follow: true },
    };
  }

  const author =
    typeof script.author === "object" && script.author?.username
      ? script.author.username
      : "a WeCinema writer";
  const genres = genresOf(script);
  const body = plainText(script.script);
  const title = `${script.title}: Script by ${author} | WeCinema`;
  const description =
    (body ? body.slice(0, 155) : "") ||
    `Read "${script.title}"${genres.length ? ` (${genres.join(", ")})` : ""}, an original screenplay on WeCinema. Discover and connect with independent writers and filmmakers.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/scripts/${id}` },
    openGraph: {
      type: "article",
      siteName: "WeCinema",
      title: { absolute: title },
      description,
      url: `${SITE}/scripts/${id}`,
      images: [{ url: OG.scripts, width: 1536, height: 1024, alt: script.title }],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      site: "@wecinema",
      title: { absolute: title },
      description,
      images: [OG.scripts],
    },
  };
}

export default async function ScriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const script = await getScript(id);

  if (!script) notFound();

  const author =
    typeof script.author === "object" && script.author ? script.author.username : undefined;
  const genres = genresOf(script);
  const abstract = plainText(script.script).slice(0, 200);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "@id": `${SITE_ORIGIN}/scripts/${script._id}`,
          name: script.title,
          url: `${SITE_ORIGIN}/scripts/${script._id}`,
          ...(genres.length ? { genre: genres } : {}),
          ...(abstract ? { abstract } : {}),
          ...(script.createdAt ? { datePublished: script.createdAt } : {}),
          inLanguage: "en",
          ...(author ? { author: { "@type": "Person", name: author } } : {}),
          publisher: { "@type": "Organization", name: "WeCinema", url: SITE_ORIGIN },
          isPartOf: { "@type": "CollectionPage", name: "Scripts", url: `${SITE_ORIGIN}/scripts` },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_ORIGIN },
            { "@type": "ListItem", position: 2, name: "Scripts", item: `${SITE_ORIGIN}/scripts` },
            { "@type": "ListItem", position: 3, name: script.title },
          ],
        }}
      />
      <ScriptDetailClient script={script} />
    </>
  );
}
