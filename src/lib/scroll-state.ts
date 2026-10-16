export type ScrollReturnTarget = {
  path: string;
  scrollY: number;
  sectionId?: string;
};

const STORAGE_KEY = "cxc-return-target";

export function saveScrollReturnTarget(path: string, sectionId?: string, scrollY = 0) {
  if (typeof window === "undefined") return;
  const target: ScrollReturnTarget = { path, scrollY, sectionId };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(target));
}

export function getSavedScrollReturnTarget(): ScrollReturnTarget | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ScrollReturnTarget>;
    if (!parsed.path || typeof parsed.scrollY !== "number") return null;
    return { path: parsed.path, scrollY: parsed.scrollY, sectionId: parsed.sectionId };
  } catch {
    return null;
  }
}

export function restoreSavedScrollTarget(path: string) {
  const target = getSavedScrollReturnTarget();
  if (!target) return false;
  const currentPath = path.replace(/#.*$/, "");
  if (target.path !== currentPath) return false;

  const run = () => {
    window.scrollTo({ top: target.scrollY, behavior: "auto" });
    if (target.sectionId) {
      requestAnimationFrame(() => {
        const element = document.getElementById(target.sectionId ?? "");
        element?.scrollIntoView({ behavior: "auto", block: "center" });
      });
    }
    sessionStorage.removeItem(STORAGE_KEY);
  };

  requestAnimationFrame(run);
  return true;
}
