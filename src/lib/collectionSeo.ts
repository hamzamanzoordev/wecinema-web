/**
 * SEO copy for the templated collection pages (category / theme / rating).
 *
 * These pages used to render only an <h1> + a film count (~150 words), which
 * Google treats as thin, near-duplicate templates that don't rank. This module
 * gives every genre, theme and rating a UNIQUE, keyword-rich intro + meta
 * description so each page targets real search intent ("watch action films
 * online", "horror movies streaming", etc.) and earns its place in the index.
 *
 * One source of truth: both generateMetadata() and the on-page intro read from
 * here, so the description a searcher sees in Google matches the page.
 */

/** A single question/answer for the on-page FAQ + FAQPage schema. */
export interface FAQ {
  q: string;
  a: string;
}

export interface CollectionCopy {
  /** ~155-char meta description (search snippet). */
  description: string;
  /** 1-2 sentence on-page intro paragraph (unique body copy). */
  intro: string;
  /** Secondary/long-tail keywords woven into the page for topical depth. */
  keywords: string[];
  /**
   * Page-specific FAQ. Rendered visibly AND as FAQPage JSON-LD, so these pages
   * become eligible for "People Also Ask", featured snippets and AI-answer
   * citations (AEO/GEO). Answers deliberately name WeCinema so answer engines
   * resolve the brand entity. Generated per page so each set is distinct.
   */
  faqs: FAQ[];
}

/** Base copy stored inline; FAQs are attached by the getters below. */
type BaseCopy = Omit<CollectionCopy, "faqs">;

const GENRE_COPY: Record<string, BaseCopy> = {
  action: {
    description:
      "Watch independent action films online: high-stakes chases, fights and thrillers from filmmakers worldwide. Stream action movies free on WeCinema.",
    intro:
      "Action films live for momentum: the chase, the fight, the impossible escape. Browse independent action movies on WeCinema, from gritty street thrillers to large-scale set pieces, all uploaded by filmmakers you can support directly. Stream now, or buy and license titles in the marketplace.",
    keywords: ["watch action movies online", "indie action films", "action thrillers", "stream action movies free"],
  },
  adventure: {
    description:
      "Stream independent adventure films on WeCinema: journeys, quests and survival stories from indie filmmakers. Watch adventure movies online free.",
    intro:
      "Adventure is about the journey into the unknown: uncharted places, daring quests and characters tested far from home. Discover independent adventure films on WeCinema and follow stories that span continents, eras and imaginations, made by creators you can back directly.",
    keywords: ["watch adventure movies online", "indie adventure films", "quest movies", "survival adventure"],
  },
  comedy: {
    description:
      "Watch independent comedy films online: fresh, original and genuinely funny shorts and features from indie creators. Stream comedy movies on WeCinema.",
    intro:
      "Comedy is the hardest genre to get right, which is why fresh voices matter. Explore independent comedies on WeCinema: sharp satire, awkward romance, deadpan shorts and feel-good features, straight from the filmmakers who wrote and shot them.",
    keywords: ["watch comedy movies online", "indie comedy films", "funny short films", "comedy features"],
  },
  documentary: {
    description:
      "Stream independent documentaries on WeCinema: true stories, investigations and profiles from documentary filmmakers worldwide. Watch docs online.",
    intro:
      "Documentaries turn real life into cinema: the investigation, the portrait, the untold history. Watch independent documentaries on WeCinema covering the people, places and ideas that the big studios overlook, and support the documentarians behind them.",
    keywords: ["watch documentaries online", "indie documentary films", "true story films", "documentary streaming"],
  },
  drama: {
    description:
      "Watch independent drama films online: character-driven stories and emotional features from indie filmmakers. Stream drama movies free on WeCinema.",
    intro:
      "Drama is where film does its deepest work: real characters, hard choices and the moments that change a life. Stream independent drama films on WeCinema, from intimate character studies to sweeping ensemble stories, created by filmmakers you can follow and support.",
    keywords: ["watch drama movies online", "indie drama films", "character-driven films", "emotional dramas"],
  },
  horror: {
    description:
      "Watch independent horror films online: chilling shorts and features from indie horror filmmakers. Stream horror movies free on WeCinema.",
    intro:
      "Horror thrives on the independent stage, where filmmakers take the risks studios won't. Discover indie horror on WeCinema (slow-burn dread, supernatural shorts, creature features and psychological scares) and back the directors redefining the genre.",
    keywords: ["watch horror movies online", "indie horror films", "scary short films", "stream horror free"],
  },
  mystery: {
    description:
      "Stream independent mystery films on WeCinema: whodunits, noir and suspense from indie filmmakers. Watch mystery movies online free.",
    intro:
      "Mystery rewards the patient viewer: the clue you missed, the suspect you trusted, the twist you never saw coming. Watch independent mystery films on WeCinema, from neo-noir features to tightly plotted shorts, made by storytellers who love a puzzle.",
    keywords: ["watch mystery movies online", "indie mystery films", "whodunit films", "noir thrillers"],
  },
  romance: {
    description:
      "Watch independent romance films online: love stories, dramas and rom-coms from indie filmmakers. Stream romance movies free on WeCinema.",
    intro:
      "Romance is the genre of connection: first meetings, second chances and everything that gets in the way. Stream independent romance films on WeCinema, from heartfelt features to bittersweet shorts, all from filmmakers telling love stories their own way.",
    keywords: ["watch romance movies online", "indie romance films", "love story films", "romantic shorts"],
  },
  thriller: {
    description:
      "Stream independent thriller films on WeCinema: tense, twisting stories from indie filmmakers. Watch thriller movies online free.",
    intro:
      "Thrillers keep you one step behind the characters and two steps from the edge of your seat. Discover independent thrillers on WeCinema: psychological, crime and suspense stories that build tension scene by scene, from filmmakers you can support directly.",
    keywords: ["watch thriller movies online", "indie thriller films", "psychological thrillers", "suspense films"],
  },
};

const RATING_COPY: Record<string, BaseCopy> = {
  G: {
    description:
      "Watch G-rated films online: family-friendly movies suitable for all ages on WeCinema. Stream independent general-audience films free.",
    intro:
      "G-rated films are suitable for general audiences of every age, with nothing that would worry a parent. Browse independent G-rated movies on WeCinema: warm, accessible stories the whole family can watch together.",
    keywords: ["family friendly movies", "all ages films", "G rated movies online", "kids movies streaming"],
  },
  PG: {
    description:
      "Watch PG-rated films online: movies that may need parental guidance on WeCinema. Stream independent PG films suitable for most ages.",
    intro:
      "PG-rated films are broadly suitable but may contain material some parents prefer to preview. Explore independent PG movies on WeCinema: bigger themes and lightly mature moments, still welcoming for most viewers.",
    keywords: ["PG rated movies online", "parental guidance films", "family movies", "PG films streaming"],
  },
  "PG-13": {
    description:
      "Watch PG-13 films online: movies where parents are strongly cautioned, on WeCinema. Stream independent PG-13 films for teens and up.",
    intro:
      "PG-13 films may include intense scenes, language or themes that aren't suitable for younger children. Discover independent PG-13 movies on WeCinema: bolder, more mature stories aimed at teen and adult audiences.",
    keywords: ["PG-13 movies online", "teen movies", "mature films", "PG-13 films streaming"],
  },
  R: {
    description:
      "Watch R-rated films online: mature, restricted independent movies on WeCinema. Stream R-rated films intended for adult audiences.",
    intro:
      "R-rated films are intended for adult audiences and may contain strong language, violence or mature themes. Browse independent R-rated movies on WeCinema: uncompromising stories from filmmakers working without limits.",
    keywords: ["R rated movies online", "adult films", "mature independent films", "restricted movies streaming"],
  },
};

/** Themes get a one-line unique angle so each page is genuinely distinct. */
const THEME_ANGLE: Record<string, string> = {
  love: "the pull between people, and everything it costs them",
  redemption: "characters fighting to earn back what they lost",
  family: "the bonds, debts and battles that define a family",
  oppression: "people pushed down by power, and how they push back",
  corruption: "how power decays the people who hold it",
  survival: "ordinary people doing whatever it takes to live",
  revenge: "the cost of getting even, and who pays it",
  death: "mortality, grief and what comes after",
  justice: "the line between the law and what is right",
  perseverance: "the refusal to quit against impossible odds",
  war: "conflict on the battlefield and the lives it reshapes",
  bravery: "courage tested when everything is on the line",
  freedom: "the fight to break free and stay free",
  friendship: "loyalty, betrayal and the friends who define us",
  hope: "light found in the darkest of circumstances",
  society: "the systems we build and the people they shape",
  isolation: "characters cut off from the world, and themselves",
  peace: "the search for calm after conflict",
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── FAQ generators (AEO/GEO) ────────────────────────────────
// Each set is built from the page's own subject so no two pages share a FAQ.
// Answers name WeCinema and give a direct, self-contained response — the exact
// shape answer engines quote and Google shows as "People Also Ask".

function genreFaqs(label: string): FAQ[] {
  const g = label.toLowerCase();
  return [
    {
      q: `Where can I watch independent ${g} films online?`,
      a: `You can stream independent ${g} films free on WeCinema, a platform where filmmakers upload their work directly to a global audience. Open the ${label} Films collection to watch now, no subscription required.`,
    },
    {
      q: `Are the ${g} films on WeCinema free to watch?`,
      a: `Yes, most ${g} films on WeCinema are free to stream. Some titles are also available to buy or license in the marketplace, and those payments go directly to the filmmakers through escrow-protected checkout.`,
    },
    {
      q: `Can I sell or license my own ${g} film on WeCinema?`,
      a: `Yes. WeCinema is also a marketplace: filmmakers can upload a ${g} film and sell it, license it, or offer adaptation rights with escrow-protected payments. Create a free account to list your work.`,
    },
    {
      q: `What makes independent ${g} films different from studio movies?`,
      a: `Independent ${g} films are made outside the major studio system, so they take creative risks big studios avoid: original voices, unconventional stories, and direct support for the creator. WeCinema is dedicated entirely to this independent work.`,
    },
  ];
}

function ratingFaqs(rating: string, meaning: string): FAQ[] {
  // "an R rating" vs "a PG rating" — R is the only rating that starts with a vowel sound.
  const article = rating === "R" ? "an" : "a";
  return [
    {
      q: `What does ${article} ${rating} rating mean?`,
      a: `${meaning} On WeCinema you can browse the ${rating} collection to find independent films that match this content rating.`,
    },
    {
      q: `Where can I watch ${rating}-rated independent films online?`,
      a: `Stream ${rating}-rated independent films free on WeCinema. Films are organized by content rating so you always know what you're watching before you press play.`,
    },
    {
      q: `Can I publish ${article} ${rating}-rated film on WeCinema?`,
      a: `Yes. When you upload a film to WeCinema you set its content rating, so viewers can filter by it. Create a free account to publish or sell your ${rating}-rated work.`,
    },
  ];
}

function themeFaqs(label: string, angle: string): FAQ[] {
  const t = label.toLowerCase();
  return [
    {
      q: `What are films about ${t}?`,
      a: `Films about ${t} explore ${angle}. On WeCinema you can watch independent ${t}-themed films (from shorts to features) made by filmmakers you can support directly.`,
    },
    {
      q: `Where can I watch independent films about ${t} online?`,
      a: `Stream independent films exploring ${t} free on WeCinema. Browse the ${label} collection to discover ${t}-themed stories from filmmakers worldwide.`,
    },
    {
      q: `Can I sell a film about ${t} on WeCinema?`,
      a: `Yes, WeCinema is a marketplace as well as a streaming platform. Upload your ${t}-themed film to sell it, license it or offer adaptation rights with escrow-protected payments.`,
    },
  ];
}

const RATING_MEANING: Record<string, string> = {
  G: "A G rating means the film is suitable for general audiences of all ages, with nothing a parent would need to worry about.",
  PG: "A PG rating means parental guidance is suggested. The film is broadly suitable but may contain material some parents prefer to preview.",
  "PG-13": "A PG-13 rating means parents are strongly cautioned. The film may contain intense scenes, language or themes not suitable for children under 13.",
  R: "An R rating means the film is restricted to adult audiences and may contain strong language, violence or mature themes.",
};

export function getGenreCopy(genre: string): CollectionCopy {
  const key = genre.toLowerCase();
  const label = cap(key);
  const base: BaseCopy = GENRE_COPY[key] ?? {
    description: `Watch independent ${key} films online on WeCinema. Stream, discover and support ${key} filmmakers worldwide, free to watch.`,
    intro: `Browse independent ${key} films on WeCinema, uploaded by filmmakers you can support directly. Stream now, or buy and license titles in the marketplace.`,
    keywords: [`watch ${key} films online`, `indie ${key} movies`, `${key} streaming`],
  };
  return { ...base, faqs: genreFaqs(label) };
}

export function getRatingCopy(rating: string): CollectionCopy {
  const base: BaseCopy = RATING_COPY[rating] ?? {
    description: `Watch ${rating}-rated independent films online on WeCinema. Stream movies with a ${rating} content rating from filmmakers worldwide.`,
    intro: `Browse ${rating}-rated independent films on WeCinema, curated by content rating so you always know what you're watching.`,
    keywords: [`${rating} rated movies online`, `${rating} films streaming`],
  };
  const meaning = RATING_MEANING[rating] ?? `A ${rating} content rating helps viewers know what to expect before watching.`;
  return { ...base, faqs: ratingFaqs(rating, meaning) };
}

export function getThemeCopy(slug: string): CollectionCopy {
  const key = slug.toLowerCase();
  const label = cap(key);
  const angle = THEME_ANGLE[key] ?? `stories built around ${key}`;
  return {
    description: `Watch independent films about ${key} on WeCinema: ${angle}. Stream ${key}-themed movies from filmmakers worldwide.`,
    intro: `The theme of ${label.toLowerCase()} runs through some of cinema's most memorable stories: ${angle}. Explore independent films exploring ${key} on WeCinema, from short films to features, made by creators you can support directly.`,
    keywords: [`films about ${key}`, `${key} themed movies`, `indie films ${key}`, `${key} short films`],
    faqs: themeFaqs(label, angle),
  };
}
