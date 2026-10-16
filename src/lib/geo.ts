// Geolocation and currency utilities for dynamic pricing

export type CountryCode = "IN" | "OTHER";

export interface GeoLocation {
  country: string;
  countryCode: CountryCode;
  currency: "INR" | "USD";
  currencySymbol: "₹" | "$";
}

const INDIA_CODES = ["IN", "IND"];
const EXCHANGE_RATE = 80; // Approximate INR to USD rate

export function getCountryFromLocale(): CountryCode {
  if (typeof navigator === "undefined") return "OTHER";
  
  const locale = navigator.language || navigator.languages?.[0] || "";
  const countryCode = locale.split("-")[1]?.toUpperCase();
  
  if (countryCode && INDIA_CODES.includes(countryCode)) {
    return "IN";
  }
  return "OTHER";
}

const GEO_CACHE_KEY = "cxc-geo-cache";
const GEO_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const GEO_FETCH_TIMEOUT_MS = 4000;

interface GeoCacheEntry {
  code: CountryCode;
  storedAt: number;
}

function readGeoCache(): GeoCacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GeoCacheEntry;
    if (
      (parsed.code === "IN" || parsed.code === "OTHER") &&
      typeof parsed.storedAt === "number" &&
      Date.now() - parsed.storedAt < GEO_CACHE_TTL_MS
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeGeoCache(code: CountryCode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      GEO_CACHE_KEY,
      JSON.stringify({ code, storedAt: Date.now() } satisfies GeoCacheEntry)
    );
  } catch {
    // Storage full or blocked — caching is best-effort only.
  }
}

export async function detectCountryFromIP(): Promise<CountryCode> {
  const cached = readGeoCache();
  if (cached) return cached.code;

  try {
    const response = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(GEO_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const code = data.country_code?.toUpperCase();
    const result: CountryCode =
      code && INDIA_CODES.includes(code) ? "IN" : "OTHER";
    writeGeoCache(result);
    return result;
  } catch {
    const fallback = getCountryFromLocale();
    writeGeoCache(fallback);
    return fallback;
  }
}

export function getGeoLocation(countryCode: CountryCode): GeoLocation {
  if (countryCode === "IN") {
    return {
      country: "India",
      countryCode: "IN",
      currency: "INR",
      currencySymbol: "₹",
    };
  }
  return {
    country: "Other",
    countryCode: "OTHER",
    currency: "USD",
    currencySymbol: "$",
  };
}

export function convertPrice(usdPrice: number, countryCode: CountryCode): number {
  if (countryCode === "IN") {
    return Math.round(usdPrice * EXCHANGE_RATE);
  }
  return usdPrice;
}

export function formatPrice(price: number, currencySymbol: string): string {
  if (currencySymbol === "₹") {
    return `₹${price.toLocaleString("en-IN")}`;
  }
  return `$${price}`;
}
