export interface ShopOwnerSummary {
  user_id?: number;
  name?: string;
  avatar_url?: string;
  login_name?: string;
  is_favorite?: boolean;
}

export interface ShopStatsSummary {
  sales?: number;
  admirers?: number;
  rating?: number;
  review_count?: number;
  listing_count?: number;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface ShopProfile {
  shop_id: string | number;
  shop_name?: string;
  title?: string;
  headline?: string;
  description?: string;
  location?: string;
  icon_url?: string;
  cover_image_url?: string;
  owner?: ShopOwnerSummary;
  stats?: ShopStatsSummary;
  social_links?: SocialLink[];
  policies_url?: string;
  created_at?: number;
  updated_at?: number;
  languages?: string[];
  raw: Record<string, unknown>;
}

type RawRecord = Record<string, unknown>;

function toId(value: unknown): string | number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return "";
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  return undefined;
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function pickFirstString(...values: unknown[]): string | undefined {
  for (const candidate of values) {
    const str = toStringOrNull(candidate);
    if (str) {
      return str;
    }
  }
  return undefined;
}

function gatherLocation(raw: RawRecord): string | undefined {
  const city = toStringOrNull(raw.city);
  const region = toStringOrNull(raw.region) ?? toStringOrNull(raw.state) ?? toStringOrNull(raw.state_name);
  const country =
    toStringOrNull(raw.country_name) ?? toStringOrNull(raw.country) ?? toStringOrNull(raw.country_display_name);

  const parts = [city, region, country].filter((part): part is string => Boolean(part));
  if (parts.length === 0) {
    return undefined;
  }
  return parts.join(", ");
}

function gatherImages(raw: RawRecord): { icon?: string; cover?: string } {
  const icon =
    pickFirstString(raw.icon_url_fullxfull, raw.icon_url, (raw.icon as RawRecord | undefined)?.url_fullxfull);
  const coverContainer = raw.cover_image as RawRecord | undefined;
  const cover = pickFirstString(
    raw.cover_image_url,
    raw.cover_photo_url,
    coverContainer?.url,
    coverContainer?.url_fullxfull,
  );
  const result: { icon?: string; cover?: string } = {};
  if (icon) {
    result.icon = icon;
  }
  if (cover) {
    result.cover = cover;
  }
  return result;
}

function gatherOwner(raw: RawRecord | undefined): ShopOwnerSummary | undefined {
  if (!raw) {
    return undefined;
  }

  const owner: ShopOwnerSummary = {};
  const userId = toNumberOrNull(raw.user_id);
  if (userId !== null) {
    owner.user_id = userId;
  }

  const name = pickFirstString(raw.real_name, raw.display_name, raw.name);
  if (name) {
    owner.name = name;
  }

  const login = toStringOrNull(raw.login_name) ?? toStringOrNull(raw.login);
  if (login) {
    owner.login_name = login;
  }

  const avatar = pickFirstString(raw.avatar_url_fullxfull, raw.avatar_url, raw.image_url_75x75);
  if (avatar) {
    owner.avatar_url = avatar;
  }

  const favorite = toBoolean(raw.is_favorite);
  if (favorite !== undefined) {
    owner.is_favorite = favorite;
  }

  return Object.keys(owner).length > 0 ? owner : undefined;
}

const SOCIAL_KEYS: Record<string, string[]> = {
  instagram: ["instagram", "instagram_url", "instagram_link"],
  facebook: ["facebook", "facebook_url", "facebook_link"],
  twitter: ["twitter", "twitter_url", "twitter_link", "x_url"],
  youtube: ["youtube", "youtube_url", "youtube_link"],
  pinterest: ["pinterest", "pinterest_url", "pinterest_link"],
  tiktok: ["tiktok", "tiktok_url", "tiktok_link"],
};

function gatherSocialLinks(raw: RawRecord): SocialLink[] | undefined {
  const links: SocialLink[] = [];

  for (const [platform, candidates] of Object.entries(SOCIAL_KEYS)) {
    for (const candidate of candidates) {
      const link = toStringOrNull(raw[candidate]);
      if (link) {
        links.push({ platform, url: link });
        break;
      }
    }
  }

  const additional = raw.social_links as unknown;
  if (Array.isArray(additional)) {
    for (const entry of additional) {
      if (entry && typeof entry === "object") {
        const platform = toStringOrNull((entry as RawRecord).platform ?? (entry as RawRecord).name);
        const url = toStringOrNull((entry as RawRecord).url);
        if (platform && url) {
          const normalizedPlatform = platform.toLowerCase();
          if (!links.some((item) => item.platform === normalizedPlatform && item.url === url)) {
            links.push({ platform: normalizedPlatform, url });
          }
        }
      }
    }
  }

  return links.length > 0 ? links : undefined;
}

function gatherStats(raw: RawRecord | undefined): ShopStatsSummary | undefined {
  if (!raw) {
    return undefined;
  }

  const stats: ShopStatsSummary = {};

  const sales = toNumberOrNull(raw.sales) ?? toNumberOrNull(raw.transaction_sold_count);
  if (sales !== null) {
    stats.sales = sales;
  }

  const admirers = toNumberOrNull(raw.admirers) ?? toNumberOrNull(raw.num_favorers);
  if (admirers !== null) {
    stats.admirers = admirers;
  }

  const rating = toNumberOrNull(raw.rating) ?? toNumberOrNull(raw.average_rating);
  if (rating !== null) {
    stats.rating = rating;
  }

  const reviewCount = toNumberOrNull(raw.review_count) ?? toNumberOrNull(raw.reviews) ?? toNumberOrNull(raw.total_reviews);
  if (reviewCount !== null) {
    stats.review_count = reviewCount;
  }

  const listingCount = toNumberOrNull(raw.listing_count) ?? toNumberOrNull(raw.active_listing_count);
  if (listingCount !== null) {
    stats.listing_count = listingCount;
  }

  return Object.keys(stats).length > 0 ? stats : undefined;
}

function gatherLanguages(raw: RawRecord): string[] | undefined {
  const languages = safeArray(raw.languages)
    .map((value) => toStringOrNull(value))
    .filter((value): value is string => Boolean(value));

  if (languages.length > 0) {
    return Array.from(new Set(languages));
  }

  const language = toStringOrNull(raw.language ?? raw.default_language);
  if (language) {
    return [language];
  }

  return undefined;
}

function toTimestamp(value: unknown): number | undefined {
  const numeric = toNumberOrNull(value);
  if (numeric !== null) {
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

function coerceRaw(data: unknown): RawRecord {
  if (data && typeof data === "object") {
    if ("shop" in (data as RawRecord) && (data as RawRecord).shop && typeof (data as RawRecord).shop === "object") {
      return (data as RawRecord).shop as RawRecord;
    }
    return data as RawRecord;
  }
  return {};
}

export function parseShopProfile(data: unknown): ShopProfile | null {
  const raw = coerceRaw(data);
  const shopId = toId(raw.shop_id ?? raw.shopId ?? raw.shopID);
  if (shopId === "") {
    return null;
  }

  const shopName = pickFirstString(raw.shop_name, raw.name, raw.title);
  const headline = pickFirstString(raw.headline, raw.announcement_headline, raw.mission_statement);
  const description = pickFirstString(raw.announcement, raw.description, raw.story);
  const title = pickFirstString(raw.title, raw.display_name, raw.shop_title);
  const location = gatherLocation(raw);
  const images = gatherImages(raw);
  const owner = gatherOwner(raw.owner as RawRecord | undefined ?? (raw.user as RawRecord | undefined));
  const stats = gatherStats(raw.stats as RawRecord | undefined ?? raw);
  const socialLinks = gatherSocialLinks(raw as RawRecord);
  const policiesUrl = pickFirstString(raw.policies_url, raw.policy_url, raw.policy_link);
  const createdAt = toTimestamp(raw.create_date ?? raw.creation_tsz);
  const updatedAt = toTimestamp(raw.update_date ?? raw.last_updated_tsz);
  const languages = gatherLanguages(raw);

  const profile: ShopProfile = {
    shop_id: shopId,
    raw,
  };

  if (shopName) {
    profile.shop_name = shopName;
  }
  if (title) {
    profile.title = title;
  }
  if (headline) {
    profile.headline = headline;
  }
  if (description) {
    profile.description = description;
  }
  if (location) {
    profile.location = location;
  }
  if (images.icon) {
    profile.icon_url = images.icon;
  }
  if (images.cover) {
    profile.cover_image_url = images.cover;
  }
  if (owner) {
    profile.owner = owner;
  }
  if (stats) {
    profile.stats = stats;
  }
  if (socialLinks) {
    profile.social_links = socialLinks;
  }
  if (policiesUrl) {
    profile.policies_url = policiesUrl;
  }
  if (createdAt !== undefined) {
    profile.created_at = createdAt;
  }
  if (updatedAt !== undefined) {
    profile.updated_at = updatedAt;
  }
  if (languages) {
    profile.languages = languages;
  }

  return profile;
}
