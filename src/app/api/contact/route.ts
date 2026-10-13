import { NextRequest, NextResponse } from "next/server";
import { appendMessage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, projectType, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const entry = await appendMessage({
      name: String(name).trim(),
      email: String(email).trim(),
      projectType: String(projectType || "General").trim(),
      message: String(message).trim(),
    });

    return NextResponse.json({ success: true, id: entry.id });
  } catch {
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
