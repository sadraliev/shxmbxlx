// Turns the collector's raw JSON into a render-ready `StoryView` at build time,
// so the panel components just map over prepared data. The only contract with
// the collector is `AggJson` below — to update, drop a fresh export over
// src/data/kyrgyzstan-tagged.json and rebuild.

// Only the fields we actually render are typed; extra fields in the JSON are
// ignored, and a missing one we use fails the build.
export interface AggJson {
  meta: {
    total_posts: number;
    total_authors: number;
    profiled: number;
    foreign_authors: number;
    generated_at: number;
    engagement: { likes: number };
    audience: {
      with_followers: number;
      combined: number;
      combined_no_top: number;
      median: number;
      top_username: string;
      top_count: number;
    };
    countries_count: number;
  };
  countries: { code: string; name: string; authors: number }[];
  languages: { code: string; name: string; posts: number }[];
  media_types: { type: string; posts: number }[];
  weekday: { d: string; posts: number }[];
  timeline: { ym: string; posts: number; foreign_posts: number }[];
  daily: { d: string; posts: number; foreign_posts: number }[];
  locations: { name: string; posts: number }[];
  hashtags: { tag: string; posts: number }[];
  top_posts: { username: string; likes: number; comments: number; shortcode: string; country: string | null; cap: string }[];
  professional: { pro_pct: number; categories: { name: string; count: number }[] };
  pyramid: { label: string; count: number; pct: number }[];
  bio_links: { buckets: { bucket: string; count: number }[] };
  format_perf: { type: string; median_likes: number; posts: number }[];
  foreign_vs_local: { foreign: { posts: number; median: number }; local: { posts: number; median: number } };
  virality: { top: { u: string; l: number; fol: number; mult: number }[] };
  superfans: { top: { u: string; posts: number; country: string | null; foreign: number }[]; once_pct: number };
}

export interface Bar {
  label: string;
  flag?: string;
  value: number;
  widthPct: number;
  variant?: "aqua" | "warm";
  href?: string;
  tip: string;
}
export interface Stat {
  n: string;
  label: string;
  accent?: boolean;
  link?: { href: string; text: string };
}
export interface TimelineBar {
  foreignH: number;
  restH: number;
  axisLabel: string;
  tip: string;
}
export interface DailyView {
  bars: { foreignH: number; restH: number; tip: string }[];
  axis: { label: string; span: number }[];
}
export interface PostCard {
  username: string;
  href: string;
  likes: string;
  comments: string;
  country: string | null;
  caption: string;
}
export interface ViralityRow {
  username: string;
  href: string;
  widthPct: number;
  ratio: string;
  mult: number;
}
export interface Versus {
  foreign: { median: string; posts: string };
  local: { median: string; posts: string };
}
export interface StoryView {
  hero: { countries: string; profiled: string; posts: string; creators: string; stats: Stat[] };
  timeline: TimelineBar[];
  daily: DailyView;
  countriesA: Bar[];
  countriesB: Bar[];
  languages: Bar[];
  locations: Bar[];
  hashtags: { tag: string; posts: number }[];
  cards: PostCard[];
  reach: Stat[];
  mediaTypes: Bar[];
  weekday: Bar[];
  versus: Versus;
  virality: ViralityRow[];
  formatPerf: Stat[];
  superfans: { oncePct: string; bars: Bar[] };
  professional: { proPct: number; categories: Bar[] };
  pyramid: Bar[];
  bioLinks: Bar[];
  generated: string;
}

const nf = new Intl.NumberFormat("en-US");
const num = (n: number) => nf.format(n);

/** Compact "1.2M" / "3.4K" formatting. */
function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "K";
  return "" + n;
}

/** Two-letter country code → flag emoji. */
const cc2flag = (cc: string) =>
  String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

const width = (value: number, max: number) => Math.max(4, (value / max) * 100);
const ig = (u: string) => `https://www.instagram.com/${u}/`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function transform(d: AggJson): StoryView {
  const m = d.meta;
  const au = m.audience;

  const hero = {
    countries: num(m.countries_count),
    profiled: num(m.profiled),
    posts: num(m.total_posts),
    creators: num(m.total_authors),
    stats: [
      { n: num(m.foreign_authors), label: "foreign creators identified", accent: true },
      { n: num(m.countries_count), label: "home countries represented" },
      { n: num(m.total_posts), label: "posts analysed under #kyrgyzstan" },
      { n: fmt(m.engagement.likes), label: "combined likes on those posts" },
    ] as Stat[],
  };

  const maxT = Math.max(...d.timeline.map((t) => t.posts));
  const timeline: TimelineBar[] = d.timeline.map((t) => ({
    foreignH: (t.foreign_posts / maxT) * 100,
    restH: ((t.posts - t.foreign_posts) / maxT) * 100,
    axisLabel: t.ym.slice(2).replace("-", "·"),
    tip: `${t.ym}: ${t.posts} posts · ${t.foreign_posts} foreign`,
  }));

  const maxD = Math.max(...d.daily.map((x) => x.posts));
  const monthSpans: Record<string, number> = {};
  for (const x of d.daily) monthSpans[x.d.slice(0, 7)] = (monthSpans[x.d.slice(0, 7)] ?? 0) + 1;
  const daily: DailyView = {
    bars: d.daily.map((x) => ({
      foreignH: (x.foreign_posts / maxD) * 100,
      restH: ((x.posts - x.foreign_posts) / maxD) * 100,
      tip: `${x.d}: ${x.posts} posts · ${x.foreign_posts} foreign`,
    })),
    axis: Object.entries(monthSpans).map(([ym, span]) => ({ label: MONTHS[+ym.slice(5, 7) - 1], span })),
  };

  // countries — top 24, split into two columns
  const cs = d.countries.slice(0, 24);
  const maxC = cs[0].authors;
  const half = Math.ceil(cs.length / 2);
  const countryBar = (c: AggJson["countries"][number]): Bar => ({
    label: c.name,
    flag: cc2flag(c.code),
    value: c.authors,
    widthPct: width(c.authors, maxC),
    tip: `${c.name}: ${c.authors} creators`,
  });

  // languages — drop unresolved codes (name === code)
  const langs = d.languages.filter((l) => l.name !== l.code).slice(0, 12);
  const maxL = langs[0].posts;

  // locations — drop non-KG noise; label strips the trailing ", Kyrgyzstan"
  const locs = d.locations.filter((l) => l.name !== "Шерегеш" && l.name !== "Summer").slice(0, 9);
  const maxLoc = locs[0].posts;

  const reach: Stat[] = [
    { n: fmt(au.combined), label: `combined followers · ${au.with_followers} creators profiled` },
    { n: fmt(au.median), label: "median creator — the typical reach", accent: true },
    { n: fmt(au.top_count), label: "biggest single account", link: { href: ig(au.top_username), text: `@${au.top_username}` } },
    { n: fmt(au.combined_no_top), label: "combined, minus that one giant" },
  ];

  const maxMt = Math.max(...d.media_types.map((x) => x.posts));
  const maxWd = Math.max(...d.weekday.map((w) => w.posts));

  const fv = d.foreign_vs_local;
  const versus: Versus = {
    foreign: { median: num(fv.foreign.median), posts: num(fv.foreign.posts) },
    local: { median: num(fv.local.median), posts: num(fv.local.posts) },
  };

  const vtop = d.virality.top.slice(0, 8);
  const maxV = Math.max(...vtop.map((t) => t.mult));
  const virality: ViralityRow[] = vtop.map((t) => ({
    username: t.u,
    href: ig(t.u),
    widthPct: width(t.mult, maxV),
    ratio: `${fmt(t.fol)}→${fmt(t.l)}`,
    mult: t.mult,
  }));

  const fp = d.format_perf;
  const formatPerf: Stat[] = fp.map((f) => ({ n: fmt(f.median_likes), label: `${f.type} · median likes · ${f.posts} posts` }));
  const vid = fp.find((f) => f.type === "video");
  const pho = fp.find((f) => f.type === "photo");
  if (vid && pho) formatPerf.push({ n: `${Math.round(vid.median_likes / pho.median_likes)}×`, label: "a video vs a photo", accent: true });

  const sf = d.superfans.top.slice(0, 12);
  const maxSf = Math.max(...sf.map((a) => a.posts));

  const maxCat = Math.max(...d.professional.categories.map((c) => c.count));
  const maxPy = Math.max(...d.pyramid.map((t) => t.pct));
  const maxBl = Math.max(...d.bio_links.buckets.map((b) => b.count));

  return {
    hero,
    timeline,
    daily,
    countriesA: cs.slice(0, half).map(countryBar),
    countriesB: cs.slice(half).map(countryBar),
    languages: langs.map((l) => ({ label: l.name, value: l.posts, widthPct: width(l.posts, maxL), variant: "aqua", tip: `${l.name}: ${l.posts} posts` })),
    locations: locs.map((l) => ({ label: l.name.replace(/, ?Kyrgyzstan$/, ""), value: l.posts, widthPct: width(l.posts, maxLoc), tip: `${l.name}: ${l.posts} posts` })),
    hashtags: d.hashtags.slice(0, 18),
    cards: d.top_posts.slice(0, 10).map((p) => ({
      username: p.username,
      href: `https://www.instagram.com/p/${p.shortcode}/`,
      likes: fmt(p.likes),
      comments: num(p.comments),
      country: p.country,
      caption: p.cap.split("\n")[0] || "—",
    })),
    reach,
    mediaTypes: d.media_types.map((x) => ({ label: x.type, value: x.posts, widthPct: width(x.posts, maxMt), tip: `${x.type}: ${x.posts} posts` })),
    weekday: d.weekday.map((w) => ({ label: w.d, value: w.posts, widthPct: width(w.posts, maxWd), variant: "aqua", tip: `${w.d}: ${w.posts} posts` })),
    versus,
    virality,
    formatPerf,
    superfans: {
      oncePct: `${d.superfans.once_pct}%`,
      bars: sf.map((a) => ({
        label: `@${a.u}`,
        value: a.posts,
        widthPct: width(a.posts, maxSf),
        variant: a.foreign === 1 ? "warm" : undefined,
        href: ig(a.u),
        tip: `@${a.u}: ${a.posts} posts${a.country ? " · " + a.country : ""}`,
      })),
    },
    professional: {
      proPct: d.professional.pro_pct,
      categories: d.professional.categories.map((c) => ({ label: c.name, value: c.count, widthPct: width(c.count, maxCat), tip: `${c.name}: ${c.count} creators` })),
    },
    pyramid: d.pyramid.map((t) => ({ label: t.label, value: t.pct, widthPct: width(t.pct, maxPy), variant: "aqua", tip: `${t.label}: ${t.count} creators (${t.pct}%)` })),
    bioLinks: d.bio_links.buckets.map((b) => ({ label: b.bucket, value: b.count, widthPct: width(b.count, maxBl), tip: `${b.bucket}: ${b.count} creators` })),
    generated: new Date(m.generated_at * 1000).toISOString().slice(0, 10),
  };
}
