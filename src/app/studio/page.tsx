// /studio — redirects to /studio/dashboard if authenticated, otherwise to /studio/login
import { redirect } from "next/navigation";
import { getStudioSession } from "@/lib/studio-auth";

export default async function StudioIndexPage() {
  const session = await getStudioSession();
  if (session) {
    redirect("/studio/dashboard");
  } else {
    redirect("/studio/login");
  }
}
