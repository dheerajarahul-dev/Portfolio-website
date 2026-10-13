export function extractYoutubeId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1).split("/")[0] || "";
    }
    const v = url.searchParams.get("v");
    if (v) return v;
    const parts = url.pathname.split("/");
    const embedIndex = parts.indexOf("embed");
    if (embedIndex !== -1 && parts[embedIndex + 1]) {
      return parts[embedIndex + 1];
    }
    const shortsIndex = parts.indexOf("shorts");
    if (shortsIndex !== -1 && parts[shortsIndex + 1]) {
      return parts[shortsIndex + 1];
    }
  } catch {
    return "";
  }

  return "";
}

export function youtubeEmbedUrl(
  videoId: string,
  opts: {
    autoplay?: boolean;
    mute?: boolean;
    controls?: boolean;
    loop?: boolean;
    modestBranding?: boolean;
    vq?: string;
  } = {}
): string {
  const {
    autoplay = false,
    mute = false,
    controls = true,
    loop = false,
    modestBranding = true,
    vq,
  } = opts;
  const params = new URLSearchParams({
    playsinline: "1",
    rel: "0",
    modestbranding: modestBranding ? "1" : "0",
    iv_load_policy: "3",
    cc_load_policy: "0",
    enablejsapi: "1",
    ...(autoplay && { autoplay: "1" }),
    ...(mute && { mute: "1" }),
    ...(controls === false && { controls: "0", disablekb: "1", fs: "0" }),
    ...(loop && { loop: "1", playlist: videoId }),
    ...(vq ? { vq } : {}),
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
