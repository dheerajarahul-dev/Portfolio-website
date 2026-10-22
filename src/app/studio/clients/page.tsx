// Client Accounts Page (Staff Only)
import type { Metadata } from "next";
import { getStudioSession } from "@/lib/studio-auth";
import { listClients, listProjects } from "@/lib/studio-db";
import { redirect } from "next/navigation";
import ClientsClient from "@/components/studio/ClientsClient";

export const metadata: Metadata = { title: "Clients" };

export default async function StudioClientsPage() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");

  if (session.role !== "super_admin" && session.role !== "manager") {
    redirect("/studio/dashboard");
  }

  const [clients, projectsResult] = await Promise.all([
    listClients().catch(() => []),
    listProjects({ limit: 100 }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 100, hasMore: false })),
  ]);

  return (
    <ClientsClient
      session={session}
      initialClients={clients}
      projects={projectsResult.items}
    />
  );
}
