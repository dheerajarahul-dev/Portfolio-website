// Review Queue Page
import type { Metadata } from "next";
import Link from "next/link";
import { getStudioSession } from "@/lib/studio-auth";
import { listProjects } from "@/lib/studio-db";
import { redirect } from "next/navigation";
import { PlaySquare, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/lib/studio-permissions";

export const metadata: Metadata = { title: "Review Queue" };

export default async function StudioReviewPage() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");

  const isStaff = session.role === "super_admin" || session.role === "manager";

  // Get projects in review states or all active projects
  const result = await listProjects({
    userId: isStaff ? undefined : session.userId,
    limit: 50,
  }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 50, hasMore: false }));

  const reviewProjects = result.items.filter(
    (p) =>
      p.status === "client_review" ||
      p.status === "internal_review" ||
      p.status === "in_production"
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <PlaySquare className="w-6 h-6 text-violet-500" />
          Review Queue
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Video versions pending internal editorial check or client signoff
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviewProjects.length === 0 ? (
          <div className="col-span-full py-20 text-center text-zinc-500 text-sm bg-[#111113] rounded-2xl border border-white/[0.06]">
            No videos currently pending review. Great work!
          </div>
        ) : (
          reviewProjects.map((p) => {
            const statusColor =
              PROJECT_STATUS_COLORS[p.status] ??
              "text-zinc-400 bg-zinc-900 border-zinc-700";
            const statusLabel =
              PROJECT_STATUS_LABELS[p.status] ?? p.status;

            return (
              <div
                key={p.id}
                className="bg-[#111113] p-5 rounded-2xl border border-white/[0.06] flex flex-col justify-between hover:border-violet-500/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${statusColor}`}
                    >
                      {statusLabel}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
                      {p.priority}
                    </span>
                  </div>

                  <h3 className="text-white font-semibold text-base line-clamp-1">
                    {p.title}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-0.5">{p.type}</p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {p.client?.companyName ?? "Workspace"}
                  </span>
                  <Link
                    href={`/studio/review/${p.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Open Review
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
