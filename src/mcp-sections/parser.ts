type Primitive = string | number | boolean;

type RawSection = Record<string, unknown>;

type MaybeArray = unknown[] | null | undefined;

type MaybeString = string | null;

type MaybeNumber = number | string | null | undefined;

export interface ParsedSection {
  section_id: string | number;
  title: string;
  active_listing_count: number;
  listings_count: number;
  listings?: unknown[];
  raw: RawSection;
  title_machine_translated?: string;
  rank?: number;
  attributes?: Record<string, Primitive | Primitive[] | Record<string, unknown> | Record<string, unknown>[]>;
}

function toId(value: unknown): string | number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return "";
}

function toStringOrNull(value: unknown): MaybeString {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

function toNumber(value: MaybeNumber): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function toNumberOrNull(value: MaybeNumber): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = toNumber(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function safeArray(value: MaybeArray): unknown[] {
  return Array.isArray(value) ? [...value] : [];
}

const KNOWN_KEYS = new Set([
  "shop_section_id",
  "section_id",
  "title",
  "title_machine_translated",
  "active_listing_count",
  "rank",
  "listings",
  "listings_count",
  "count",
  "path",
  "url",
  "shop_id",
  "user_id",
  "slug",
  "language",
  "default_language",
  "create_date",
  "update_date",
]);

function extractAttributes(
  raw: RawSection,
): Record<string, Primitive | Primitive[] | Record<string, unknown> | Record<string, unknown>[]> {
  const attributes: Record<string, Primitive | Primitive[] | Record<string, unknown> | Record<string, unknown>[]> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (KNOWN_KEYS.has(key)) {
      continue;
    }

    if (Array.isArray(value)) {
      const primitives = value.every((item) => item === null || ["string", "number", "boolean"].includes(typeof item));
      if (primitives) {
        const filtered = (value as (Primitive | null)[]).filter((item) => item !== null) as Primitive[];
        if (filtered.length > 0) {
          attributes[key] = filtered;
        }
      } else if (value.length > 0) {
        attributes[key] = value as Record<string, unknown>[];
      }
      continue;
    }

    if (["string", "number", "boolean"].includes(typeof value)) {
      attributes[key] = value as Primitive;
      continue;
    }

    if (typeof value === "object") {
      attributes[key] = value as Record<string, unknown>;
      continue;
    }

  }

  return attributes;
}

function toParsedSection(item: unknown): ParsedSection {
  const raw = (item && typeof item === "object") ? (item as RawSection) : {};

  const sectionId = toId(raw.shop_section_id ?? raw.section_id);
  const title = toStringOrNull(raw.title) ?? "";
  const machineTitle = toStringOrNull(raw.title_machine_translated);
  const activeCount = toNumber(raw.active_listing_count as MaybeNumber);
  const rank = toNumberOrNull(raw.rank as MaybeNumber);
  const listings = safeArray(raw.listings as MaybeArray);
  const listingsCount = toNumber(
    (raw.listings_count as MaybeNumber) ?? (raw.count as MaybeNumber) ?? listings.length,
  );
  const attributes = extractAttributes(raw);

  const result: ParsedSection = {
    section_id: sectionId,
    title,
    active_listing_count: activeCount,
    listings_count: listingsCount,
    raw,
  };

  if (machineTitle) {
    result.title_machine_translated = machineTitle;
  }

  if (typeof rank === "number") {
    result.rank = rank;
  }

  if (Object.keys(attributes).length > 0) {
    result.attributes = attributes;
  }

  if (listings.length > 0) {
    result.listings = listings;
  }

  return result;
}

export function parseSections(data: unknown): ParsedSection[] {
  if (Array.isArray(data)) {
    return data.map((item) => toParsedSection(item));
  }

  if (data && typeof data === "object") {
    const container = data as { sections?: unknown; results?: unknown };
    const candidates = container.sections ?? container.results;
    if (Array.isArray(candidates)) {
      return candidates.map((item) => toParsedSection(item));
    }
  }

  return [];
}
