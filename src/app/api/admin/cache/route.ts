import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { clearContentCache, clearMessagesCache } from "@/lib/storage";

export async function POST() {
  const currentUser = await getCurrentAdminUser();
  if (currentUser?.role !== "owner" || !currentUser.permissions.includes("settings:view")) {
    return NextResponse.json({ error: "You do not have permission to clear the website cache." }, { status: 403 });
  }

  clearContentCache();
  clearMessagesCache();
  revalidatePath("/", "layout");

  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}