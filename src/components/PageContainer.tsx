"use client";

import type { ReactNode } from "react";

export default function PageContainer({
  children,
}: {
  children: ReactNode;
}) {
  return <div>{children}</div>;
}
