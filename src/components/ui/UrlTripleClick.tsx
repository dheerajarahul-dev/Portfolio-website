"use client";

import { useEffect } from "react";
import { useTripleClickAdmin } from "@/hooks/useTripleClickAdmin";

/** Triple-click the top URL strip (browser address bar area) to open admin */
export default function UrlTripleClick() {
  const onTripleClick = useTripleClickAdmin();

  useEffect(() => {
    const handleClick = (event: MouseEvent | TouchEvent) => {
      const clientY = "clientY" in event ? event.clientY : 0;
      if (clientY <= 40) {
        onTripleClick();
      }
    };

    window.addEventListener("click", handleClick);
    window.addEventListener("touchstart", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("touchstart", handleClick);
    };
  }, [onTripleClick]);

  return null;
}
