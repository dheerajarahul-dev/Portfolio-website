// New Project Page
import type { Metadata } from "next";
import { getStudioSession } from "@/lib/studio-auth";
import { listClients } from "@/lib/studio-db";
import { redirect } from "next/navigation";
import NewProjectClient from "@/components/studio/NewProjectClient";

export const metadata: Metadata = { title: "Create New Project" };

export default async function NewProjectPage() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login?next=/studio/projects/new");

  const clients = await listClients().catch(() => []);

  return <NewProjectClient session={session} existingClients={clients} />;
}
