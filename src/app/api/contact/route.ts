import { NextRequest, NextResponse } from "next/server";
import { appendMessage, clearMessagesCache, readMessages } from "@/lib/storage";
import { hasReachedEmailMessageLimit, MAX_MESSAGES_TOTAL_PER_EMAIL, reserveContactMessageSlot } from "@/lib/contact-limits";

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_PROJECT_TYPE = 80;
const MAX_MESSAGE = 5000;
const MAX_REQUEST_BYTES = 8 * 1024;
function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { name, email, projectType, subject, message, website } = body as Record<string, unknown>;

    if (typeof website === "string" && website.trim()) {
      return NextResponse.json({ success: true });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !message.trim()
    ) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim();
    const cleanType = typeof projectType === "string" ? projectType.trim() || "General" : "General";
    const cleanSubject = typeof subject === "string" ? subject.trim() : "";
    const cleanMessage = String(message).trim();

    if (
      cleanName.length > MAX_NAME ||
      cleanEmail.length > MAX_EMAIL ||
      cleanType.length > MAX_PROJECT_TYPE ||
      cleanSubject.length > MAX_PROJECT_TYPE ||
      cleanMessage.length > MAX_MESSAGE
    ) {
      return NextResponse.json(
        { error: "One or more fields exceed the allowed length." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    clearMessagesCache();
    const storedMessages = await readMessages();
    if (hasReachedEmailMessageLimit(storedMessages, cleanEmail)) {
      return NextResponse.json(
        { error: `This email address has reached the limit of ${MAX_MESSAGES_TOTAL_PER_EMAIL} total messages.` },
        { status: 429 }
      );
    }

    const slot = reserveContactMessageSlot(getClientKey(request), Date.now());
    if (!slot.allowed) {
      const retryAfter = Math.max(1, Math.ceil((slot.resetAt - Date.now()) / 1000));
      const retryMinutes = Math.max(1, Math.ceil(retryAfter / 60));
      return NextResponse.json(
        {
          error: `The limit is 5 messages per hour. This limit resets in about ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`,
          resetAt: new Date(slot.resetAt).toISOString(),
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const entry = await appendMessage({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject || cleanType || "Project inquiry",
      projectType: cleanType,
      message: cleanMessage,
    });

    return NextResponse.json({ success: true, id: entry.id });
  } catch (error) {
    console.error("Contact submission failed:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "We could not send your message right now. Please try again." },
      { status: 500 }
    );
  }
}
