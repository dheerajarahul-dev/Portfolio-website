import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/auth";
import { readContent, writeContent } from "@/lib/storage";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  const content = await readContent();
  return NextResponse.json(content);
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!isObject(body)) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }
    const content = await writeContent(body);
    revalidatePath("/");
    return NextResponse.json({ success: true, content });
  } catch {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }
}
