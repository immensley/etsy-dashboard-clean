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
function toString(value) {
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    }
    return undefined;
}
function pickString(...values) {
    for (const value of values) {
        const result = toString(value);
        if (result) {
            return result;
        }
    }
    return undefined;
}
function pickNumber(...values) {
    for (const value of values) {
        const result = toNumber(value);
        if (result !== undefined) {
            return result;
        }
    }
    return undefined;
}
function humanizeKey(key) {
    return key
        .replace(/[_-]+/g, " ")
        .replace(/([a-z])([A-Z])/g, (_, a, b) => `${a} ${b}`)
        .replace(/\s+/g, " ")
        .replace(/^\w/, (letter) => letter.toUpperCase());
}
function parseTimeseriesEntry(entry) {
    var _a;
    if (!entry) {
        return undefined;
    }
    if (Array.isArray(entry) && entry.length >= 2) {
        const dateValue = entry[0];
        const metricValue = entry[1];
        const date = (_a = pickString(dateValue)) !== null && _a !== void 0 ? _a : `${dateValue}`;
        const value = pickNumber(metricValue);
        if (date && value !== undefined) {
            return { date, value };
        }
        return undefined;
    }
    if (typeof entry === "object") {
        const record = entry;
        const date = pickString(record.date, record.day, record.timestamp, record.period_start);
        const value = pickNumber(record.value, record.count, record.total, record.metric);
        if (date && value !== undefined) {
            const comparison = pickNumber(record.comparison, record.previous, record.prior);
            const point = { date, value };
            if (comparison !== undefined) {
                point.comparison = comparison;
            }
            return point;
        }
    }
    return undefined;
}
function extractTimeseries(raw) {
    const candidates = [raw.trend, raw.timeseries, raw.series, raw.history, raw.points, raw.data];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            const parsed = candidate
                .map((entry) => parseTimeseriesEntry(entry))
                .filter((entry) => Boolean(entry));
            if (parsed.length > 0) {
                return parsed;
            }
        }
    }
    return undefined;
}
function extractCurrent(raw) {
    return pickNumber(raw.current, raw.value, raw.total, raw.count, raw.latest);
}
function extractPrevious(raw) {
    return pickNumber(raw.previous, raw.prior, raw.comparison, raw.last_period, raw.last);
}
function extractUnit(raw) {
    const unit = pickString(raw.unit, raw.display_unit, raw.suffix);
    if (unit) {
        return unit;
    }
    const currency = pickString(raw.currency, raw.currency_code);
    if (currency) {
        return currency;
    }
    return undefined;
}
function computeChange(current, previous) {
    if (current === undefined || previous === undefined) {
        return {};
    }
    const change = current - previous;
    const rate = previous === 0 ? undefined : (change / previous) * 100;
    return {
        change,
        rate: rate === undefined || Number.isNaN(rate) ? undefined : rate,
    };
}
function parseMetricEntry(key, value) {
    var _a;
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value === "number") {
        return {
            key,
            label: humanizeKey(key),
            current: value,
            raw: value,
        };
    }
    if (typeof value === "string") {
        const numeric = toNumber(value);
        return {
            key,
            label: humanizeKey(key),
            current: numeric !== null && numeric !== void 0 ? numeric : undefined,
            raw: value,
        };
    }
    if (typeof value !== "object") {
        return undefined;
    }
    const record = value;
    const label = (_a = pickString(record.label, record.display_name, record.name)) !== null && _a !== void 0 ? _a : humanizeKey(key);
    const unit = extractUnit(record);
    const current = extractCurrent(record);
    const previous = extractPrevious(record);
    const timeseries = extractTimeseries(record);
    const summary = {
        key,
        label,
        raw: record,
    };
    if (unit) {
        summary.unit = unit;
    }
    if (current !== undefined) {
        summary.current = current;
    }
    if (previous !== undefined) {
        summary.previous = previous;
    }
    if (timeseries) {
        summary.timeseries = timeseries;
    }
    const { change, rate } = computeChange(current, previous);
    if (change !== undefined) {
        summary.change = change;
    }
    if (rate !== undefined) {
        summary.change_rate = rate;
    }
    return summary;
}
function collectMetricSources(data) {
    const sources = [];
    if (!data || typeof data !== "object") {
        return sources;
    }
    const root = data;
    const directCandidates = [root.metrics, root.stats, root.summary, root.overview, root.analytics, root];
    for (const candidate of directCandidates) {
        if (!candidate || typeof candidate !== "object") {
            continue;
        }
        if (Array.isArray(candidate)) {
            for (const entry of candidate) {
                if (entry && typeof entry === "object") {
                    sources.push(entry);
                }
            }
            continue;
        }
        sources.push(candidate);
    }
    return sources;
}
export function parseShopMetrics(data) {
    const sources = collectMetricSources(data);
    const results = [];
    const seen = new Set();
    for (const source of sources) {
        for (const [key, value] of Object.entries(source)) {
            const summary = parseMetricEntry(key, value);
            if (!summary) {
                continue;
            }
            const dedupeKey = summary.key;
            if (seen.has(dedupeKey)) {
                continue;
            }
            seen.add(dedupeKey);
            results.push(summary);
        }
    }
    return results;
}
