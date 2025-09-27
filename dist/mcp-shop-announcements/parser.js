function toString(value) {
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    }
    return undefined;
}
function toNumber(value) {
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
function toBoolean(value) {
    if (typeof value === "boolean") {
        return value;
    }
    return undefined;
}
function toTimestamp(value) {
    const numeric = toNumber(value);
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
function toId(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
    }
    return undefined;
}
function extractAnnouncement(raw) {
    var _a, _b, _c, _d;
    const text = toString((_b = (_a = raw.announcement) !== null && _a !== void 0 ? _a : raw.headline) !== null && _b !== void 0 ? _b : raw.description);
    const updated = (_d = (_c = toTimestamp(raw.announcement_update_date)) !== null && _c !== void 0 ? _c : toTimestamp(raw.announcement_last_modified)) !== null && _d !== void 0 ? _d : toTimestamp(raw.update_date);
    return { text, updated };
}
function extractVacation(raw) {
    var _a, _b, _c;
    const mode = (_a = toBoolean(raw.is_vacation)) !== null && _a !== void 0 ? _a : toBoolean(raw.on_vacation);
    const message = toString((_c = (_b = raw.vacation_message) !== null && _b !== void 0 ? _b : raw.vacation_auto_reply) !== null && _c !== void 0 ? _c : raw.vacation_autoreply);
    return { mode, message };
}
function extractHighlights(raw) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const updates = (_b = (_a = raw.updates) !== null && _a !== void 0 ? _a : raw.events) !== null && _b !== void 0 ? _b : raw.announcement_highlights;
    if (!Array.isArray(updates)) {
        return undefined;
    }
    const highlights = [];
    for (const update of updates) {
        if (!update || typeof update !== "object") {
            continue;
        }
        const record = update;
        const title = toString((_c = record.title) !== null && _c !== void 0 ? _c : record.heading);
        const body = toString((_e = (_d = record.body) !== null && _d !== void 0 ? _d : record.copy) !== null && _e !== void 0 ? _e : record.message);
        const url = toString((_f = record.url) !== null && _f !== void 0 ? _f : record.link);
        const createdAt = toTimestamp((_h = (_g = record.created_at) !== null && _g !== void 0 ? _g : record.create_date) !== null && _h !== void 0 ? _h : record.timestamp);
        const type = toString((_j = record.type) !== null && _j !== void 0 ? _j : record.kind);
        if (!title && !body && !url) {
            continue;
        }
        const highlight = {};
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
function extractPolicies(raw) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const policies = (_b = (_a = raw.policies) !== null && _a !== void 0 ? _a : raw.policy_sections) !== null && _b !== void 0 ? _b : raw.policyInfo;
    if (!policies) {
        return undefined;
    }
    const list = [];
    if (Array.isArray(policies)) {
        for (const entry of policies) {
            if (!entry || typeof entry !== "object") {
                continue;
            }
            const record = entry;
            const title = toString((_d = (_c = record.title) !== null && _c !== void 0 ? _c : record.name) !== null && _d !== void 0 ? _d : record.heading);
            if (!title) {
                continue;
            }
            const description = toString((_f = (_e = record.description) !== null && _e !== void 0 ? _e : record.body) !== null && _f !== void 0 ? _f : record.text);
            const url = toString((_g = record.url) !== null && _g !== void 0 ? _g : record.link);
            const updated = toTimestamp((_j = (_h = record.update_date) !== null && _h !== void 0 ? _h : record.updated_at) !== null && _j !== void 0 ? _j : record.last_modified);
            list.push({ title, description, url, updated_at: updated });
        }
    }
    else if (typeof policies === "object") {
        for (const value of Object.values(policies)) {
            if (!value || typeof value !== "object") {
                continue;
            }
            const record = value;
            const title = toString((_k = record.title) !== null && _k !== void 0 ? _k : record.name);
            if (!title) {
                continue;
            }
            const description = toString((_l = record.description) !== null && _l !== void 0 ? _l : record.text);
            const url = toString(record.url);
            const updated = toTimestamp((_m = record.update_date) !== null && _m !== void 0 ? _m : record.updated_at);
            list.push({ title, description, url, updated_at: updated });
        }
    }
    return list.length > 0 ? list : undefined;
}
function extractFaq(raw) {
    var _a, _b, _c, _d, _e;
    const faqEntries = (_b = (_a = raw.faq) !== null && _a !== void 0 ? _a : raw.faqs) !== null && _b !== void 0 ? _b : raw.questions;
    if (!Array.isArray(faqEntries)) {
        return undefined;
    }
    const results = [];
    for (const entry of faqEntries) {
        if (!entry || typeof entry !== "object") {
            continue;
        }
        const record = entry;
        const question = toString((_c = record.question) !== null && _c !== void 0 ? _c : record.q);
        if (!question) {
            continue;
        }
        const answer = toString((_e = (_d = record.answer) !== null && _d !== void 0 ? _d : record.a) !== null && _e !== void 0 ? _e : record.response);
        results.push({ question, answer });
    }
    return results.length > 0 ? results : undefined;
}
function coerceShop(data) {
    if (data && typeof data === "object") {
        const record = data;
        if (record.shop && typeof record.shop === "object") {
            return record.shop;
        }
        return record;
    }
    return {};
}
export function parseAnnouncement(data) {
    var _a, _b, _c, _d;
    const raw = coerceShop(data);
    const shopId = toId((_b = (_a = raw.shop_id) !== null && _a !== void 0 ? _a : raw.id) !== null && _b !== void 0 ? _b : raw.shopId);
    if (shopId === undefined) {
        return null;
    }
    const { text: announcementText, updated: announcementUpdated } = extractAnnouncement(raw);
    const { mode: vacationMode, message: vacationMessage } = extractVacation(raw);
    const highlights = extractHighlights(raw);
    const policies = extractPolicies(raw);
    const faq = extractFaq(raw);
    const summary = {
        shop_id: shopId,
        raw,
    };
    const shopName = toString((_d = (_c = raw.shop_name) !== null && _c !== void 0 ? _c : raw.name) !== null && _d !== void 0 ? _d : raw.title);
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
