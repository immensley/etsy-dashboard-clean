type RawRecord = Record<string, unknown>;

type MaybeNumber = number | string | null | undefined;

type MaybeString = string | null | undefined;

type RawListing = RawRecord & {
  inventory?: RawInventory;
  results?: unknown[];
  listing_id?: string | number;
  title?: string;
  quantity?: MaybeNumber;
  has_variations?: boolean;
};

type RawInventory = RawRecord & {
  products?: RawProduct[];
  quantity_on_hand?: MaybeNumber;
  product_variations?: RawRecord[];
  low_inventory_threshold?: MaybeNumber;
};

type RawProduct = RawRecord & {
  product_id?: string | number;
  property_values?: RawPropertyValue[];
  offerings?: RawOffering[];
  is_available?: boolean;
  sku?: unknown;
};

type RawPropertyValue = RawRecord & {
  property_name?: string;
  property_id?: MaybeNumber;
  value?: MaybeString;
  value_id?: MaybeNumber;
  values?: MaybeString[];
};

type RawOffering = RawRecord & {
  offering_id?: MaybeNumber;
  price?: MaybeNumber | RawRecord;
  quantity?: MaybeNumber;
  is_enabled?: boolean;
  is_available?: boolean;
  sku?: MaybeString;
  inventory_level?: MaybeString;
  min_processing_days?: MaybeNumber;
  max_processing_days?: MaybeNumber;
  currency_code?: MaybeString;
};

export interface VariantOption {
  property_id?: number;
  property_name?: string;
  value_id?: number;
  value: string;
}

export interface VariantOffering {
  offering_id?: number;
  price?: number;
  currency?: string;
  quantity?: number;
  sku?: string;
  is_enabled?: boolean;
  is_available?: boolean;
  inventory_level?: string;
  processing_days?: { min?: number; max?: number };
}

export interface InventoryVariant {
  product_id: string | number;
  is_available?: boolean;
  sku?: string;
  options: VariantOption[];
  offerings: VariantOffering[];
  raw: RawProduct;
}

export interface InventorySummary {
  listing_id: string | number;
  title?: string;
  total_available?: number;
  quantity_on_hand?: number;
  low_stock_threshold?: number;
  has_variations?: boolean;
  variants: InventoryVariant[];
  raw: RawListing;
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

function toString(value: MaybeString): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
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

function extractNumberFromRecord(record: RawRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    if (key in record) {
      const value = toNumber(record[key] as MaybeNumber);
      if (value !== undefined) {
        return value;
      }
    }
  }
  return undefined;
}

function parseOption(raw: RawPropertyValue): VariantOption | undefined {
  const value = toString(raw.value) ?? toString(raw.values && raw.values[0]);
  const propertyName = toString(raw.property_name);
  if (!value && !propertyName) {
    return undefined;
  }

  const propertyId = toNumber(raw.property_id);
  const valueId = toNumber(raw.value_id);

  const option: VariantOption = {
    value: value ?? "",
  };

  if (propertyName) {
    option.property_name = propertyName;
  }
  if (propertyId !== undefined) {
    option.property_id = propertyId;
  }
  if (valueId !== undefined) {
    option.value_id = valueId;
  }

  return option;
}

function parsePrice(value: MaybeNumber | RawRecord | undefined): { amount?: number; currency?: string } {
  if (!value) {
    return {};
  }
  if (typeof value === "number" || typeof value === "string") {
    return { amount: toNumber(value) };
  }
  if (typeof value === "object") {
    const record = value as RawRecord;
    const amount = extractNumberFromRecord(record, ["amount", "value", "price", "usd"]); // heuristics
    const currency = toString(record.currency_code as MaybeString ?? record.currency as MaybeString);
    return {
      amount,
      currency,
    };
  }
  return {};
}

function parseOffering(raw: RawOffering): VariantOffering | undefined {
  const offeringId = toNumber(raw.offering_id);
  const quantity = toNumber(raw.quantity);
  const sku = toString(raw.sku);
  const { amount, currency } = parsePrice(raw.price);
  const isEnabled = typeof raw.is_enabled === "boolean" ? raw.is_enabled : undefined;
  const isAvailable = typeof raw.is_available === "boolean" ? raw.is_available : undefined;
  const inventoryLevel = toString(raw.inventory_level);
  const minProcessing = toNumber(raw.min_processing_days);
  const maxProcessing = toNumber(raw.max_processing_days);
  const derivedCurrency = currency ?? toString(raw.currency_code);

  const offering: VariantOffering = {};

  if (offeringId !== undefined) {
    offering.offering_id = offeringId;
  }
  if (amount !== undefined) {
    offering.price = amount;
  }
  if (derivedCurrency) {
    offering.currency = derivedCurrency;
  }
  if (quantity !== undefined) {
    offering.quantity = quantity;
  }
  if (sku) {
    offering.sku = sku;
  }
  if (isEnabled !== undefined) {
    offering.is_enabled = isEnabled;
  }
  if (isAvailable !== undefined) {
    offering.is_available = isAvailable;
  }
  if (inventoryLevel) {
    offering.inventory_level = inventoryLevel;
  }
  if (minProcessing !== undefined || maxProcessing !== undefined) {
    offering.processing_days = {};
    if (minProcessing !== undefined) {
      offering.processing_days.min = minProcessing;
    }
    if (maxProcessing !== undefined) {
      offering.processing_days.max = maxProcessing;
    }
  }

  if (
    offering.offering_id === undefined &&
    offering.price === undefined &&
    offering.quantity === undefined &&
    !offering.sku &&
    !offering.inventory_level
  ) {
    return undefined;
  }

  return offering;
}

function parseVariant(raw: RawProduct): InventoryVariant | undefined {
  const productId = toId(raw.product_id ?? raw.id);
  if (productId === undefined) {
    return undefined;
  }

  const optionsRaw = Array.isArray(raw.property_values) ? raw.property_values : [];
  const offeringsRaw = Array.isArray(raw.offerings) ? raw.offerings : [];

  const options = optionsRaw
    .map((item) => parseOption(item))
    .filter((item): item is VariantOption => Boolean(item));

  const offerings = offeringsRaw
    .map((item) => parseOffering(item))
    .filter((item): item is VariantOffering => Boolean(item));

  const variant: InventoryVariant = {
    product_id: productId,
    options,
    offerings,
    raw,
  };

  const available = typeof raw.is_available === "boolean" ? raw.is_available : undefined;
  const sku = toString(raw.sku as MaybeString);

  if (available !== undefined) {
    variant.is_available = available;
  }
  if (sku) {
    variant.sku = sku;
  }

  return variant;
}

function extractInventory(raw: RawListing): RawInventory | undefined {
  if (raw.inventory && typeof raw.inventory === "object") {
    return raw.inventory as RawInventory;
  }

  if (Array.isArray(raw.results) && raw.results.length > 0) {
    const [first] = raw.results;
    if (first && typeof first === "object") {
      const record = first as RawListing;
      if (record.inventory && typeof record.inventory === "object") {
        return record.inventory as RawInventory;
      }
      return extractInventory(record);
    }
  }

  return undefined;
}

function coerceListing(data: unknown): RawListing {
  if (data && typeof data === "object") {
    return data as RawListing;
  }
  return {} as RawListing;
}

function sumQuantities(variants: InventoryVariant[]): number | undefined {
  let total = 0;
  let hasQuantity = false;
  for (const variant of variants) {
    for (const offering of variant.offerings) {
      if (offering.quantity !== undefined) {
        total += offering.quantity;
        hasQuantity = true;
      }
    }
  }
  return hasQuantity ? total : undefined;
}

export function parseInventory(data: unknown): InventorySummary | null {
  const listing = coerceListing(data);
  const listingId = toId(listing.listing_id ?? (listing as RawRecord).listingId);
  if (listingId === undefined) {
    return null;
  }

  const inventory = extractInventory(listing);
  if (!inventory) {
    const hasVariationsFlag = typeof listing.has_variations === "boolean" ? listing.has_variations : undefined;
    const fallbackSummary: InventorySummary = {
      listing_id: listingId,
      title: toString(listing.title as MaybeString),
      variants: [],
      raw: listing,
    };
    if (hasVariationsFlag !== undefined) {
      fallbackSummary.has_variations = hasVariationsFlag;
    }
    return fallbackSummary;
  }

  const products = Array.isArray(inventory.products) ? inventory.products : [];
  const variants = products
    .map((product) => parseVariant(product))
    .filter((variant): variant is InventoryVariant => Boolean(variant));

  const totalAvailable = sumQuantities(variants);
  const quantityOnHand = toNumber(inventory.quantity_on_hand);
  const lowStockThreshold = toNumber(inventory.low_inventory_threshold);
  const hasVariationsFlag = typeof listing.has_variations === "boolean" ? listing.has_variations : undefined;

  const summary: InventorySummary = {
    listing_id: listingId,
    title: toString(listing.title as MaybeString),
    variants,
    raw: listing,
  };

  if (hasVariationsFlag !== undefined) {
    summary.has_variations = hasVariationsFlag;
  } else if (variants.length > 1) {
    summary.has_variations = true;
  }
  if (totalAvailable !== undefined) {
    summary.total_available = totalAvailable;
  }
  if (quantityOnHand !== undefined) {
    summary.quantity_on_hand = quantityOnHand;
  }
  if (lowStockThreshold !== undefined) {
    summary.low_stock_threshold = lowStockThreshold;
  }

  return summary;
}
