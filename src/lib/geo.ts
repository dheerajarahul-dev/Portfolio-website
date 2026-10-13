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

export async function detectCountryFromIP(): Promise<CountryCode> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    const code = data.country_code?.toUpperCase();
    return code && INDIA_CODES.includes(code) ? "IN" : "OTHER";
  } catch {
    return getCountryFromLocale();
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
