/**
 * FastBooks report analysis engine (browser-side).
 * Handles the three Sarai Shahzada report types:
 *  - حواله دریافتی (incoming remittances)
 *  - حواله ارسالی (outgoing remittances)
 *  - تبادلات اسعار (currency exchanges)
 */

export type ReportKind = "incoming" | "outgoing" | "exchange" | "unknown";

export interface Money {
  currency: "USD" | "AFN" | "UNKNOWN";
  value: number;
}

export interface NormalizedRow {
  index: number;
  raw: Record<string, unknown>;
  date: string;
  jYear?: number;
  jMonth?: number;
  jDay?: number;
  time?: string;
  hour?: number;
  sender?: string;
  receiver?: string;
  amount?: Money;
  rate?: number;
  source?: string;
  purpose?: string;
  operator?: string;
  commission?: number;
  hawalaNo?: string;
  buy?: Money;
  sell?: Money;
}

export interface CountItem {
  key: string;
  count: number;
  usd: number;
  afn: number;
}

export interface ReportAnalysis {
  kind: ReportKind;
  kindLabel: string;
  rows: NormalizedRow[];
  columns: string[];
  count: number;
  usd: { count: number; total: number; avg: number; max: number; min: number };
  afn: { count: number; total: number; avg: number; max: number; min: number };
  topSenders: CountItem[];
  topReceivers: CountItem[];
  byMonth: CountItem[];
  byDay: CountItem[];
  byHourBucket: CountItem[];
  purposes: CountItem[];
  sources: CountItem[];
  operators: CountItem[];
  commissionTotal: number;
  commissionByPurpose: CountItem[];
  rates: { count: number; avg: number; max: number; min: number; byMonth: { key: string; avg: number; count: number }[] };
  duplicates: { key: string; count: number; rows: number[] }[];
  anomalies: string[];
}

const KIND_LABELS: Record<ReportKind, string> = {
  incoming: "حواله دریافتی",
  outgoing: "حواله ارسالی",
  exchange: "تبادلات اسعار",
  unknown: "نامشخص",
};

export const kindLabel = (kind: ReportKind) => KIND_LABELS[kind];

const norm = (s: string) => s.replace(/[\s\u200c]+/g, "");

const findKey = (keys: string[], needles: string[]) =>
  keys.find((k) => needles.some((n) => norm(k).includes(norm(n))));

export const detectKind = (columns: string[]): ReportKind => {
  const flat = columns.map(norm).join("|");
  if (flat.includes("مبلغخرید") || flat.includes("نوعتبادله") || flat.includes("حسابخرید")) return "exchange";
  if (flat.includes("ازطرف") || flat.includes("بهنمایندگی") || flat.includes("بهذریعه")) return "outgoing";
  if (flat.includes("فرستنده") || flat.includes("کمیشن") || flat.includes("کمشن")) return "incoming";
  return "unknown";
};

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export const toLatinDigits = (input: string) =>
  input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const p = PERSIAN_DIGITS.indexOf(ch);
    if (p >= 0) return String(p);
    return String(ARABIC_DIGITS.indexOf(ch));
  });

/** Parses "دالر 1,000.00" / "افغانی 300,000.00" / 1000 into a Money value. */
export const parseMoney = (value: unknown): Money | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) {
    return { currency: "UNKNOWN", value };
  }
  const text = toLatinDigits(String(value));
  let currency: Money["currency"] = "UNKNOWN";
  if (/دالر|دلار|\$|USD/i.test(text)) currency = "USD";
  else if (/افغان|AFN|افغ/i.test(text)) currency = "AFN";
  const match = text.match(/-?\d[\d,]*(?:\.\d+)?/);
  if (!match) return undefined;
  const num = parseFloat(match[0].replace(/,/g, ""));
  if (!Number.isFinite(num)) return undefined;
  return { currency, value: num };
};

export const parseNumber = (value: unknown): number | undefined => {
  const money = parseMoney(value);
  return money?.value;
};

interface ParsedDate {
  date: string;
  jYear?: number;
  jMonth?: number;
  jDay?: number;
  time?: string;
  hour?: number;
}

/** Splits "1404/1/4 09:15:00 am" into date parts + hour. */
export const parseJalaliDateTime = (value: unknown): ParsedDate => {
  const text = toLatinDigits(String(value ?? "")).trim();
  if (!text) return { date: "" };

  const timeMatch = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm|ق\.ظ|ب\.ظ)?/i);
  let hour: number | undefined;
  let time: string | undefined;
  if (timeMatch) {
    hour = parseInt(timeMatch[1], 10);
    const marker = (timeMatch[4] || "").toLowerCase();
    if ((marker === "pm" || marker === "ب.ظ") && hour < 12) hour += 12;
    if ((marker === "am" || marker === "ق.ظ") && hour === 12) hour = 0;
    time = `${String(hour).padStart(2, "0")}:${timeMatch[2]}`;
  }

  const dateMatch = text.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!dateMatch) return { date: text.replace(timeMatch?.[0] ?? "", "").trim(), time, hour };

  const [, y, m, d] = dateMatch;
  return {
    date: `${y}/${m}/${d}`,
    jYear: +y,
    jMonth: +m,
    jDay: +d,
    time,
    hour,
  };
};

export const hourBucket = (hour?: number) => {
  if (hour === undefined) return "نامشخص";
  if (hour < 12) return "صبح (۰۰-۱۲)";
  if (hour < 16) return "ظهر (۱۲-۱۶)";
  if (hour < 20) return "عصر (۱۶-۲۰)";
  return "شب (۲۰-۲۴)";
};

const addMoney = (bucket: { usd: number; afn: number }, money?: Money) => {
  if (!money) return;
  if (money.currency === "USD") bucket.usd += money.value;
  else if (money.currency === "AFN") bucket.afn += money.value;
};

const tally = (
  rows: NormalizedRow[],
  keyOf: (row: NormalizedRow) => string | undefined,
  moneyOf: (row: NormalizedRow) => Money | undefined = (r) => r.amount,
  limit?: number
): CountItem[] => {
  const map = new Map<string, CountItem>();
  rows.forEach((row) => {
    const key = (keyOf(row) ?? "").toString().trim();
    if (!key) return;
    const item = map.get(key) ?? { key, count: 0, usd: 0, afn: 0 };
    item.count += 1;
    addMoney(item, moneyOf(row));
    map.set(key, item);
  });
  const list = [...map.values()].sort((a, b) => b.count - a.count);
  return limit ? list.slice(0, limit) : list;
};

const stats = (values: number[]) => ({
  count: values.length,
  total: values.reduce((a, b) => a + b, 0),
  avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
  max: values.length ? Math.max(...values) : 0,
  min: values.length ? Math.min(...values) : 0,
});

export const normalizeRows = (
  raw: Record<string, unknown>[],
  columns: string[],
  kind: ReportKind
): NormalizedRow[] => {
  const kDate = findKey(columns, ["تاریخ"]);
  const kSender = findKey(columns, ["فرستنده", "از طرف", "نام"]);
  const kReceiver = findKey(columns, ["گیرنده", "برای"]);
  const kAmount = findKey(columns, ["مبلغ"]);
  const kRate = findKey(columns, ["نرخ"]);
  const kSource = findKey(columns, ["منبع عاید"]);
  const kPurpose = findKey(columns, ["هدف حواله", "هدف تبادله", "هدف"]);
  const kOperator = findKey(columns, ["توسط", "به ذریعه", "ذریعه"]);
  const kHawala = findKey(columns, ["حواله#", "حواله"]);
  const kCommission1 = findKey(columns, ["کمیشن ن", "کمیشن"]);
  const kCommission2 = findKey(columns, ["کمشن م", "کمشن"]);
  const kBuy = findKey(columns, ["مبلغ خرید"]);
  const kSell = findKey(columns, ["مبلغ فروش"]);

  return raw.map((row, index) => {
    const dt = parseJalaliDateTime(kDate ? row[kDate] : "");
    const buy = kBuy ? parseMoney(row[kBuy]) : undefined;
    const sell = kSell ? parseMoney(row[kSell]) : undefined;
    const commission =
      (kCommission1 ? parseNumber(row[kCommission1]) ?? 0 : 0) +
      (kCommission2 ? parseNumber(row[kCommission2]) ?? 0 : 0);

    return {
      index,
      raw: row,
      ...dt,
      sender: kSender ? String(row[kSender] ?? "").trim() : undefined,
      receiver: kReceiver ? String(row[kReceiver] ?? "").trim() : undefined,
      amount: kind === "exchange" ? buy ?? sell : kAmount ? parseMoney(row[kAmount]) : undefined,
      rate: kRate ? parseNumber(row[kRate]) : undefined,
      source: kSource ? String(row[kSource] ?? "").trim() : undefined,
      purpose: kPurpose ? String(row[kPurpose] ?? "").trim() : undefined,
      operator: kOperator ? String(row[kOperator] ?? "").trim() : undefined,
      hawalaNo: kHawala ? String(row[kHawala] ?? "").trim() : undefined,
      commission,
      buy,
      sell,
    };
  });
};

export const analyzeRows = (
  raw: Record<string, unknown>[],
  columns: string[]
): ReportAnalysis => {
  const kind = detectKind(columns);
  const rows = normalizeRows(raw, columns, kind);

  const usdValues = rows.filter((r) => r.amount?.currency === "USD").map((r) => r.amount!.value);
  const afnValues = rows.filter((r) => r.amount?.currency === "AFN").map((r) => r.amount!.value);

  const rateValues = rows.map((r) => r.rate).filter((v): v is number => !!v && v > 0);
  const rateMonthMap = new Map<string, number[]>();
  rows.forEach((r) => {
    if (!r.rate || r.rate <= 0 || !r.jYear) return;
    const key = `${r.jYear}/${r.jMonth}`;
    rateMonthMap.set(key, [...(rateMonthMap.get(key) ?? []), r.rate]);
  });

  const dupMap = new Map<string, number[]>();
  rows.forEach((r) => {
    const key = [r.date, r.sender, r.receiver, r.amount?.value, r.amount?.currency]
      .map((v) => String(v ?? ""))
      .join("|");
    if (key.replace(/\|/g, "").trim() === "") return;
    dupMap.set(key, [...(dupMap.get(key) ?? []), r.index + 2]);
  });

  const anomalies: string[] = [];
  const missingDate = rows.filter((r) => !r.date).length;
  if (missingDate) anomalies.push(`${missingDate} ردیف بدون تاریخ معتبر`);
  const missingAmount = rows.filter((r) => !r.amount).length;
  if (missingAmount) anomalies.push(`${missingAmount} ردیف بدون مبلغ قابل تشخیص`);
  const unknownCurrency = rows.filter((r) => r.amount?.currency === "UNKNOWN").length;
  if (unknownCurrency) anomalies.push(`${unknownCurrency} ردیف با ارز نامشخص (دالر/افغانی مشخص نشده)`);
  if (rateValues.length) {
    const avg = rateValues.reduce((a, b) => a + b, 0) / rateValues.length;
    const outliers = rateValues.filter((v) => Math.abs(v - avg) / avg > 0.15).length;
    if (outliers) anomalies.push(`${outliers} نرخ با انحراف بیش از ۱۵٪ از میانگین (بررسی شود)`);
  }
  const bigUsd = usdValues.filter((v) => v >= 50000).length;
  if (bigUsd) anomalies.push(`${bigUsd} تراکنش دالری ۵۰٬۰۰۰ و بالاتر — مشمول بررسی AML`);

  return {
    kind,
    kindLabel: KIND_LABELS[kind],
    rows,
    columns,
    count: rows.length,
    usd: stats(usdValues),
    afn: stats(afnValues),
    topSenders: tally(rows, (r) => r.sender, undefined, 5),
    topReceivers: tally(rows, (r) => r.receiver, undefined, 5),
    byMonth: tally(rows, (r) => (r.jYear ? `${r.jYear}/${r.jMonth}` : undefined)).sort((a, b) =>
      a.key.localeCompare(b.key, undefined, { numeric: true })
    ),
    byDay: tally(rows, (r) => r.date || undefined, undefined, 10),
    byHourBucket: tally(rows, (r) => hourBucket(r.hour)),
    purposes: tally(rows, (r) => r.purpose, undefined, 8),
    sources: tally(rows, (r) => r.source, undefined, 8),
    operators: tally(rows, (r) => r.operator),
    commissionTotal: rows.reduce((sum, r) => sum + (r.commission ?? 0), 0),
    commissionByPurpose: tally(rows, (r) => (r.commission ? r.purpose : undefined), undefined, 8),
    rates: {
      ...stats(rateValues),
      byMonth: [...rateMonthMap.entries()]
        .map(([key, values]) => ({
          key,
          count: values.length,
          avg: values.reduce((a, b) => a + b, 0) / values.length,
        }))
        .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true })),
    },
    duplicates: [...dupMap.entries()]
      .filter(([, idx]) => idx.length > 1)
      .map(([key, idx]) => ({ key, count: idx.length, rows: idx }))
      .slice(0, 20),
    anomalies,
  };
};

/** Cross-file reconciliation between incoming and outgoing hawala reports. */
export const reconcile = (analyses: ReportAnalysis[]) => {
  const incoming = analyses.find((a) => a.kind === "incoming");
  const outgoing = analyses.find((a) => a.kind === "outgoing");
  const exchange = analyses.find((a) => a.kind === "exchange");
  if (!incoming && !outgoing && !exchange) return null;

  const incomingNos = new Set(
    (incoming?.rows ?? []).map((r) => r.hawalaNo).filter((v): v is string => !!v)
  );
  const outgoingNos = new Set(
    (outgoing?.rows ?? []).map((r) => r.hawalaNo).filter((v): v is string => !!v)
  );
  const matched = [...incomingNos].filter((n) => outgoingNos.has(n));

  return {
    incomingCount: incoming?.count ?? 0,
    outgoingCount: outgoing?.count ?? 0,
    exchangeCount: exchange?.count ?? 0,
    matchedHawalaNumbers: matched.length,
    unmatchedIncoming: incomingNos.size - matched.length,
    unmatchedOutgoing: outgoingNos.size - matched.length,
    usdNet: (incoming?.usd.total ?? 0) - (outgoing?.usd.total ?? 0),
    afnNet: (incoming?.afn.total ?? 0) - (outgoing?.afn.total ?? 0),
    exchangeUsd: exchange?.usd.total ?? 0,
    exchangeAfn: exchange?.afn.total ?? 0,
    avgRate: exchange?.rates.avg ?? 0,
  };
};
