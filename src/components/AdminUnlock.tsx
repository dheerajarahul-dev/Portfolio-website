"use client";

import { useTripleClickAdmin } from "@/hooks/useTripleClickAdmin";

export default function AdminUnlock() {
  const onTripleClick = useTripleClickAdmin();

  return (
    <button
      type="button"
      onClick={onTripleClick}
      className="fixed bottom-0 left-0 z-[100] h-8 w-full cursor-default opacity-0"
      aria-hidden
      tabIndex={-1}
      title=""
    />
  );
}
