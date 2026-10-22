import { redirect } from "next/navigation";
import { getStudioSession } from "@/lib/studio-auth";
import StudioShell from "@/components/studio/StudioShell";

export default async function StudioAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getStudioSession();
  if (!session) {
    redirect("/studio/login");
  }

  return <StudioShell session={session}>{children}</StudioShell>;
}
