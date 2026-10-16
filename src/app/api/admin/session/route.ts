import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentAdminUser();
  return NextResponse.json({ authenticated: Boolean(user), user });
}
