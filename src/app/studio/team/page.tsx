// Team Management Page (Staff Only)
import type { Metadata } from "next";
import { getStudioSession } from "@/lib/studio-auth";
import { listStudioUsers, listInvitations } from "@/lib/studio-db";
import { redirect } from "next/navigation";
import TeamClient from "@/components/studio/TeamClient";

export const metadata: Metadata = { title: "Team Management" };

export default async function StudioTeamPage() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");

  // Only super_admin and manager can access
  if (session.role !== "super_admin" && session.role !== "manager") {
    redirect("/studio/dashboard");
  }

  const [users, invitations] = await Promise.all([
    listStudioUsers({ active: true }).catch(() => []),
    listInvitations().catch(() => []),
  ]);

  return (
    <TeamClient
      session={session}
      initialUsers={users}
      initialInvitations={invitations}
    />
  );
}
