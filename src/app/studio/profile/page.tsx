// User Profile Page
import type { Metadata } from "next";
import { getStudioSession } from "@/lib/studio-auth";
import { getStudioUserById } from "@/lib/studio-db";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/studio/ProfileClient";

export const metadata: Metadata = { title: "My Profile" };

export default async function StudioProfilePage() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");

  const user = await getStudioUserById(session.userId).catch(() => null);

  return <ProfileClient session={session} user={user} />;
}
