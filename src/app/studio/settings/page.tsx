// Studio Settings Page (Super Admin Only)
import type { Metadata } from "next";
import { getStudioSession } from "@/lib/studio-auth";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/studio/SettingsClient";

export const metadata: Metadata = { title: "Settings" };

export default async function StudioSettingsPage() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");

  if (session.role !== "super_admin") {
    redirect("/studio/dashboard");
  }

  return <SettingsClient session={session} />;
}
