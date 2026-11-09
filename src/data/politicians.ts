import raw from "./politicians.json";

const STATE_NAMES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
} as const;

export const PARTIES = ["R", "D", "I", "other"] as const;

export type Party = (typeof PARTIES)[number];
export type StateCode = keyof typeof STATE_NAMES;

export interface Reason {
  text: string;
  source: string;
}

export interface Politician {
  slug: string;
  name: string;
  party: Party;
  state: StateCode;
  office: string;
  district?: string;
  xHandle?: string;
  featuredPostUrl?: string;
  reasons: Reason[];
  lastUpdated: string;
  example: boolean;
}

export const PARTY_LABELS: Record<Party, string> = {
  R: "Republican",
  D: "Democrat",
  I: "Independent",
  other: "Other",
};

function fail(message: string): never {
  throw new Error(`Invalid src/data/politicians.json: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} is required`);
  }
  return value.trim();
}

function optionalString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a non-empty string when present`);
  }
  return value.trim();
}

function httpUrl(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} lacks a source URL`);
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    fail(`${label} lacks a valid source URL`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    fail(`${label} source must be an http(s) URL`);
  }
  return value;
}

function xPostUrl(value: string, label: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    fail(`${label} must be an X post URL`);
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "x.com" && host !== "twitter.com") {
    fail(`${label} must be an https://x.com or https://twitter.com post URL`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    fail(`${label} must be an http(s) URL`);
  }
  return value;
}

function slugify(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) fail(`name "${name}" produced an empty slug`);
  return slug;
}

function isParty(value: string): value is Party {
  return (PARTIES as readonly string[]).includes(value);
}

function isState(value: string): value is StateCode {
  return Object.prototype.hasOwnProperty.call(STATE_NAMES, value);
}

function dateString(value: unknown, label: string): string {
  if (typeof value !== "string") fail(`${label} must be YYYY-MM-DD`);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) fail(`${label} must be YYYY-MM-DD`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    fail(`${label} is not a real calendar date`);
  }
  return value;
}

function validateReason(value: unknown, label: string): Reason {
  if (!isRecord(value)) fail(`${label} must be an object with text and source`);
  if (!("source" in value) || value.source === undefined || value.source === "") {
    fail(`${label} lacks a source URL`);
  }
  return {
    text: requiredString(value.text, `${label} text`),
    source: httpUrl(value.source, label),
  };
}

function validateEntry(value: unknown, index: number): Politician {
  const label = `entry ${index + 1}`;
  if (!isRecord(value)) fail(`${label} must be an object`);
  const name = requiredString(value.name, `${label} name`);
  const partyRaw = requiredString(value.party, `${label} (${name}) party`);
  if (!isParty(partyRaw)) {
    fail(`${name} party must be R, D, I, or other`);
  }
  const stateRaw = requiredString(value.state, `${name} state`).toUpperCase();
  if (!isState(stateRaw)) fail(`${name} state must be a 2-letter USPS code`);
  const office = requiredString(value.office, `${name} office`);
  const district = optionalString(value.district, `${name} district`);
  const xHandle = optionalString(value.x_handle, `${name} x_handle`);
  if (xHandle && !/^[A-Za-z0-9_]{1,15}$/.test(xHandle)) {
    fail(`${name} x_handle must be 1–15 letters, numbers, or underscores, without @`);
  }
  const featured = optionalString(value.featured_post_url, `${name} featured_post_url`);
  if (!Array.isArray(value.reasons)) fail(`${name} reasons must be an array`);
  const reasons = value.reasons.map((reason, reasonIndex) =>
    validateReason(reason, `${name} reason ${reasonIndex + 1}`),
  );
  if (value.example !== undefined && typeof value.example !== "boolean") {
    fail(`${name} example must be true or false`);
  }
  return {
    slug: slugify(name),
    name,
    party: partyRaw,
    state: stateRaw,
    office,
    ...(district ? { district } : {}),
    ...(xHandle ? { xHandle } : {}),
    ...(featured ? { featuredPostUrl: xPostUrl(featured, `${name} featured_post_url`) } : {}),
    reasons,
    lastUpdated: dateString(value.last_updated, `${name} last_updated`),
    example: value.example === true,
  };
}

function validateAll(input: unknown): Politician[] {
  if (!Array.isArray(input)) fail("expected an array");
  const entries = input.map((entry, index) => validateEntry(entry, index));
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.slug)) fail(`duplicate slug "${entry.slug}"`);
    seen.add(entry.slug);
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export const politicians: readonly Politician[] = validateAll(raw);

export function getPolitician(slug: string): Politician | undefined {
  return politicians.find((politician) => politician.slug === slug);
}

export function politiciansInState(state: string): Politician[] {
  const code = state.toUpperCase();
  return politicians.filter((politician) => politician.state === code);
}

export function stateName(state: StateCode): string {
  return STATE_NAMES[state];
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function hostnameOf(value: string): string {
  return new URL(value).hostname.replace(/^www\./, "");
}
