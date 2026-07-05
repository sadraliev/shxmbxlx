export interface SeriesMeta {
  readonly title: string;
  readonly description: string;
  readonly repo?: string;
}

export const SERIES = {
  "coding-agent": {
    title: "Building a Coding Agent",
    description:
      "From an ~80-line LLM+loop to almost-full Claude Code, in TypeScript. Companion code: github.com/sadraliev/Aida",
    repo: "https://github.com/sadraliev/Aida",
  },
} as const satisfies Record<string, SeriesMeta>;

export type SeriesSlug = keyof typeof SERIES;

export function getSeries(slug: string): SeriesMeta | undefined {
  return (SERIES as Record<string, SeriesMeta>)[slug];
}
