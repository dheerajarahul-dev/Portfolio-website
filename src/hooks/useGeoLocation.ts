"use client";

import { useState, useEffect } from "react";
import { detectCountryFromIP, getCountryFromLocale, getGeoLocation } from "@/lib/geo";
import type { GeoLocation } from "@/lib/geo";

export function useGeoLocation() {
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const detectLocation = async () => {
      try {
        // Try IP-based detection first
        const countryCode = await detectCountryFromIP();
        if (isMounted) {
          setGeoLocation(getGeoLocation(countryCode));
        }
      } catch {
        // Fallback to locale-based detection
        const countryCode = getCountryFromLocale();
        if (isMounted) {
          setGeoLocation(getGeoLocation(countryCode));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    detectLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return { geoLocation, loading };
}
