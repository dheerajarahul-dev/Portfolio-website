export function extractYoutubeId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const isShortUrl = hostname === "youtu.be";
    const isYoutubeHost = [
      "youtube.com",
      "m.youtube.com",
      "music.youtube.com",
      "youtube-nocookie.com",
      "m.youtube-nocookie.com",
    ].includes(hostname);
    if (!isShortUrl && !isYoutubeHost) return "";

    const parts = url.pathname.split("/").filter(Boolean);
    let videoId = isShortUrl ? parts[0] || "" : url.searchParams.get("v") || "";
    if (!videoId) {
      const pathTypeIndex = parts.findIndex((part) => ["embed", "shorts"].includes(part));
      if (pathTypeIndex !== -1) videoId = parts[pathTypeIndex + 1] || "";
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : "";
  } catch {
    return "";
  }
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
