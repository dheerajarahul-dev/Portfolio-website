"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const CLICK_WINDOW_MS = 1200;
const REQUIRED_CLICKS = 3;

export function useTripleClickAdmin() {
  const router = useRouter();
  const clicksRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTripleClick = useCallback(() => {
    clicksRef.current += 1;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (clicksRef.current >= REQUIRED_CLICKS) {
      clicksRef.current = 0;
      router.push("/admin");
      return;
    }

    timerRef.current = setTimeout(() => {
      clicksRef.current = 0;
    }, CLICK_WINDOW_MS);
  }, [router]);

  return onTripleClick;
}
