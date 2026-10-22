// Project Workspace Page
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getStudioSession } from "@/lib/studio-auth";
import {
  getProjectById,
  getClientById,
  getStudioUserById,
  listTasks,
  listAssets,
  listMessages,
  listEvents,
  listStudioUsers,
} from "@/lib/studio-db";
import ProjectWorkspaceClient from "@/components/studio/ProjectWorkspaceClient";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id).catch(() => null);
  return {
    title: project ? `${project.title} — Workspace` : "Project Workspace",
  };
}

export default async function ProjectWorkspacePage({ params }: Params) {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");

  const { id } = await params;
  const project = await getProjectById(id).catch(() => null);

  if (!project) {
    notFound();
  }

  const isStaff = session.role === "super_admin" || session.role === "manager";

  const [client, manager, tasks, assets, clientMessages, internalMessages, events, teamUsers] =
    await Promise.all([
      getClientById(project.clientId).catch(() => null),
      project.managerId ? getStudioUserById(project.managerId).catch(() => null) : null,
      listTasks({ projectId: id }).catch(() => []),
      listAssets({ projectId: id }).catch(() => []),
      listMessages(id, false).catch(() => []),
      isStaff ? listMessages(id, true).catch(() => []) : Promise.resolve([]),
      listEvents(id, 40).catch(() => []),
      isStaff ? listStudioUsers({ active: true }).catch(() => []) : Promise.resolve([]),
    ]);

  return (
    <ProjectWorkspaceClient
      session={session}
      project={project}
      client={client}
      manager={manager}
      initialTasks={tasks}
      initialAssets={assets}
      initialClientMessages={clientMessages}
      initialInternalMessages={internalMessages}
      events={events}
      teamUsers={teamUsers}
      isStaff={isStaff}
    />
  );
}
