let animationFrame = 0;

export function scrollToSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return;

  if (animationFrame) window.cancelAnimationFrame(animationFrame);

  const start = window.scrollY;
  const rect = section.getBoundingClientRect();
  const end = Math.max(
    0,
    Math.min(
      document.documentElement.scrollHeight - window.innerHeight,
      start + rect.top + rect.height / 2 - window.innerHeight / 2
    )
  );

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: end, behavior: "instant" });
    return;
  }

  const distance = end - start;
  const duration = Math.min(240, Math.max(100, Math.abs(distance) * 0.18));
  let startedAt = 0;

  const step = (timestamp: number) => {
    if (!startedAt) startedAt = timestamp;
    const progress = Math.min(1, (timestamp - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    window.scrollTo({ top: start + distance * eased, behavior: "instant" });

    if (progress < 1) {
      animationFrame = window.requestAnimationFrame(step);
    } else {
      animationFrame = 0;
    }
  };

  animationFrame = window.requestAnimationFrame(step);
}