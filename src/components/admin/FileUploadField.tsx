"use client";

import { useState } from "react";
import { CheckCircle2, Upload, Loader2 } from "lucide-react";

function responseError(data: unknown, status: number, fallback: string) {
  const body = data && typeof data === "object"
    ? data as { code?: string; error?: string; details?: string }
    : {};
  const code = body.code || "UPLOAD_FAILED";
  const reason = body.error || fallback;
  const details = body.details ? ` Cause: ${body.details}` : "";
  return `${code} (HTTP ${status}): ${reason}${details}`;
}

export default function FileUploadField({
  label,
  accept,
  currentUrl,
  onUploaded,
  hint,
  completionMessage = "Upload complete.",
}: {
  label: string;
  accept: string;
  currentUrl?: string;
  onUploaded: (url: string, type: "image" | "video") => void | Promise<void>;
  hint?: string;
  completionMessage?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [phase, setPhase] = useState<"preparing" | "uploading" | "publishing">("preparing");

  const sendUpload = (url: string, method: "POST" | "PUT", body: FormData | File, contentType?: string) =>
    new Promise<{ status: number; data: unknown }>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open(method, url);
      request.responseType = "json";
      request.timeout = 120_000;
      if (contentType) request.setRequestHeader("Content-Type", contentType);
      request.upload.onprogress = (event) => {
        setPhase("uploading");
        if (event.lengthComputable) {
          setProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
        }
      };
      request.onload = () => resolve({ status: request.status, data: request.response });
      request.onerror = () => reject(new Error("UPLOAD_NETWORK_ERROR: Network error while uploading. Check your connection and retry."));
      request.ontimeout = () => reject(new Error("UPLOAD_TIMEOUT: Upload timed out after 120 seconds. Try a smaller file or retry."));
      request.send(body);
    });

  const upload = async (file: File) => {
    setLoading(true);
    setError("");
    setProgress(0);
    setUploaded(false);
    setPhase("preparing");
    try {
      if (file.size > 100 * 1024 * 1024) throw new Error("FILE_TOO_LARGE: File must be 100MB or smaller.");
      const signedResponse = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
      });
      let uploadedUrl: string;
      let uploadedType: "image" | "video";
      if (signedResponse.ok) {
        const signed = await signedResponse.json() as { uploadUrl: string; url: string; type: "image" | "video" };
        setPhase("uploading");
        const uploadResponse = await sendUpload(signed.uploadUrl, "PUT", file, file.type);
        if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
          throw new Error(responseError(uploadResponse.data, uploadResponse.status, "Direct storage upload failed. Check the bucket limit and retry."));
        }
        uploadedUrl = signed.url;
        uploadedType = signed.type;
      } else if (signedResponse.status === 501) {
        const formData = new FormData();
        formData.append("file", file);
        setPhase("uploading");
        const response = await sendUpload("/api/upload", "POST", formData);
        const data = response.data && typeof response.data === "object"
          ? response.data as { code?: string; error?: string; details?: string; url?: string; type?: string }
          : {};
        if (response.status < 200 || response.status >= 300) {
          throw new Error(responseError(data, response.status, "Upload failed."));
        }
        if (!data.url) throw new Error("UPLOAD_RESPONSE_INVALID: Upload finished without returning a file URL.");
        uploadedUrl = data.url;
        uploadedType = data.type === "video" ? "video" : "image";
      } else {
        const data = await signedResponse.json().catch(() => ({}));
        throw new Error(responseError(data, signedResponse.status, "Could not prepare upload."));
      }
      setProgress(100);
      setPhase("publishing");
      await onUploaded(uploadedUrl, uploadedType);
      setUploaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-xs uppercase tracking-wider text-white/50">{label}</span>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-[#0a0a0a] px-4 py-6 transition hover:border-purple-400/40 hover:bg-purple-500/5">
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={loading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        ) : uploaded ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        ) : (
          <Upload className="h-6 w-6 text-purple-300/80" />
        )}
        <span className="text-xs text-white/50">
          {loading
            ? phase === "preparing"
              ? "Preparing upload..."
              : phase === "publishing"
                ? "Publishing to public library..."
                : `Uploading ${progress}%`
            : uploaded
              ? "Published to public library"
              : "Click to upload"}
        </span>
      </label>
      {loading && (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label={`${label} ${phase === "publishing" ? "publication" : "upload"} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={phase === "preparing" ? undefined : progress}
        >
          <div
            className={`h-full rounded-full bg-emerald-400 transition-[width] duration-150 ${phase === "preparing" || (phase === "uploading" && progress === 0) ? "animate-pulse" : ""}`}
            style={{ width: phase === "preparing" || (phase === "uploading" && progress === 0) ? "35%" : `${progress}%` }}
          />
        </div>
      )}
      {uploaded && <p className="text-xs text-emerald-300">{completionMessage}</p>}
      {hint && <p className="text-xs text-white/35">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {currentUrl && (
        <div className="overflow-hidden rounded-lg border border-white/10">
          {currentUrl.match(/\.(mp4|webm)$/i) ? (
            <video src={currentUrl} className="h-28 w-full object-cover" muted playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt="Preview" className="h-28 w-full object-cover" />
          )}
        </div>
      )}
    </div>
  );
}
