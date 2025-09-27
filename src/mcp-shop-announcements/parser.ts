type RawRecord = Record<string, unknown>;

type MaybeString = string | null | undefined;

type MaybeNumber = number | string | null | undefined;

export interface AnnouncementHighlight {
  title?: string;
  body?: string;
  url?: string;
  created_at?: number;
  type?: string;
}

export interface PolicySummary {
  title: string;
  description?: string;
  url?: string;
  updated_at?: number;
}

export interface FaqEntry {
  question: string;
  answer?: string;
}

export interface ShopAnnouncementSummary {
  shop_id: string | number;
  shop_name?: string;
  announcement?: string;
  announcement_updated_at?: number;
  vacation_mode?: boolean;
  vacation_message?: string;
  highlights?: AnnouncementHighlight[];
  policies?: PolicySummary[];
  faq?: FaqEntry[];
  raw: RawRecord;
}

function toString(value: MaybeString): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return undefined;
}

function toNumber(value: MaybeNumber): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  return undefined;
}

function toTimestamp(value: unknown): number | undefined {
  const numeric = toNumber(value as MaybeNumber);
  if (numeric !== undefined) {
    return numeric;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return Math.floor(parsed / 1000);
    }
  }
  return undefined;
}

function toId(value: unknown): string | number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

function extractAnnouncement(raw: RawRecord): { text?: string; updated?: number } {
  const text = toString(raw.announcement as MaybeString ?? raw.headline as MaybeString ?? raw.description as MaybeString);
  const updated =
    toTimestamp(raw.announcement_update_date) ??
    toTimestamp(raw.announcement_last_modified) ??
    toTimestamp(raw.update_date);
  return { text, updated };
}

function extractVacation(raw: RawRecord): { mode?: boolean; message?: string } {
  const mode = toBoolean(raw.is_vacation as unknown) ?? toBoolean(raw.on_vacation as unknown);
  const message = toString(
    raw.vacation_message as MaybeString ??
      raw.vacation_auto_reply as MaybeString ??
      raw.vacation_autoreply as MaybeString,
  );
  return { mode, message };
}

function extractHighlights(raw: RawRecord): AnnouncementHighlight[] | undefined {
  const updates = raw.updates ?? raw.events ?? raw.announcement_highlights;
  if (!Array.isArray(updates)) {
    return undefined;
  }

  const highlights: AnnouncementHighlight[] = [];
  for (const update of updates) {
    if (!update || typeof update !== "object") {
      continue;
    }
    const record = update as RawRecord;
    const title = toString(record.title as MaybeString ?? record.heading as MaybeString);
    const body = toString(record.body as MaybeString ?? record.copy as MaybeString ?? record.message as MaybeString);
    const url = toString(record.url as MaybeString ?? record.link as MaybeString);
    const createdAt = toTimestamp(record.created_at ?? record.create_date ?? record.timestamp);
    const type = toString(record.type as MaybeString ?? record.kind as MaybeString);

    if (!title && !body && !url) {
      continue;
    }

    const highlight: AnnouncementHighlight = {};
    if (title) {
      highlight.title = title;
    }
    if (body) {
      highlight.body = body;
    }
    if (url) {
      highlight.url = url;
    }
    if (createdAt !== undefined) {
      highlight.created_at = createdAt;
    }
    if (type) {
      highlight.type = type;
    }

    highlights.push(highlight);
  }

  return highlights.length > 0 ? highlights : undefined;
}

function extractPolicies(raw: RawRecord): PolicySummary[] | undefined {
  const policies = raw.policies ?? raw.policy_sections ?? raw.policyInfo;
  if (!policies) {
    return undefined;
  }

  const list: PolicySummary[] = [];
  if (Array.isArray(policies)) {
    for (const entry of policies) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const record = entry as RawRecord;
      const title = toString(record.title as MaybeString ?? record.name as MaybeString ?? record.heading as MaybeString);
      if (!title) {
        continue;
      }
      const description = toString(record.description as MaybeString ?? record.body as MaybeString ?? record.text as MaybeString);
      const url = toString(record.url as MaybeString ?? record.link as MaybeString);
      const updated = toTimestamp(record.update_date ?? record.updated_at ?? record.last_modified);
      list.push({ title, description, url, updated_at: updated });
    }
  } else if (typeof policies === "object") {
    for (const value of Object.values(policies as RawRecord)) {
      if (!value || typeof value !== "object") {
        continue;
      }
      const record = value as RawRecord;
      const title = toString(record.title as MaybeString ?? record.name as MaybeString);
      if (!title) {
        continue;
      }
      const description = toString(record.description as MaybeString ?? record.text as MaybeString);
      const url = toString(record.url as MaybeString);
      const updated = toTimestamp(record.update_date ?? record.updated_at);
      list.push({ title, description, url, updated_at: updated });
    }
  }

  return list.length > 0 ? list : undefined;
}

function extractFaq(raw: RawRecord): FaqEntry[] | undefined {
  const faqEntries = raw.faq ?? raw.faqs ?? raw.questions;
  if (!Array.isArray(faqEntries)) {
    return undefined;
  }

  const results: FaqEntry[] = [];
  for (const entry of faqEntries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const record = entry as RawRecord;
    const question = toString(record.question as MaybeString ?? record.q as MaybeString);
    if (!question) {
      continue;
    }
    const answer = toString(record.answer as MaybeString ?? record.a as MaybeString ?? record.response as MaybeString);
    results.push({ question, answer });
  }

  return results.length > 0 ? results : undefined;
}

function coerceShop(data: unknown): RawRecord {
  if (data && typeof data === "object") {
    const record = data as RawRecord;
    if (record.shop && typeof record.shop === "object") {
      return record.shop as RawRecord;
    }
    return record;
  }
  return {};
}

export function parseAnnouncement(data: unknown): ShopAnnouncementSummary | null {
  const raw = coerceShop(data);
  const shopId = toId(raw.shop_id ?? raw.id ?? raw.shopId);
  if (shopId === undefined) {
    return null;
  }

  const { text: announcementText, updated: announcementUpdated } = extractAnnouncement(raw);
  const { mode: vacationMode, message: vacationMessage } = extractVacation(raw);
  const highlights = extractHighlights(raw);
  const policies = extractPolicies(raw);
  const faq = extractFaq(raw);

  const summary: ShopAnnouncementSummary = {
    shop_id: shopId,
    raw,
  };

  const shopName = toString(raw.shop_name as MaybeString ?? raw.name as MaybeString ?? raw.title as MaybeString);
  if (shopName) {
    summary.shop_name = shopName;
  }
  if (announcementText) {
    summary.announcement = announcementText;
  }
  if (announcementUpdated !== undefined) {
    summary.announcement_updated_at = announcementUpdated;
  }
  if (vacationMode !== undefined) {
    summary.vacation_mode = vacationMode;
  }
  if (vacationMessage) {
    summary.vacation_message = vacationMessage;
  }
  if (highlights) {
    summary.highlights = highlights;
  }
  if (policies) {
    summary.policies = policies;
  }
  if (faq) {
    summary.faq = faq;
  }

  return summary;
}
