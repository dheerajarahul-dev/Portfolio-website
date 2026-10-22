// Studio Knowledge & Brand Kit API
import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import { getDefaultBrandKit, getInitialKnowledgeBase } from "@/lib/studio-brand-kit";
import { getProjectById } from "@/lib/studio-db";
import type { ClientBrandKit, ProjectKnowledgeItem } from "@/lib/studio-types";

const brandKits = new Map<string, ClientBrandKit>();
const knowledgeStore = new Map<string, ProjectKnowledgeItem[]>();

export async function GET(request: NextRequest) {
  try {
    await requireStudioSession();
    const { searchParams } = request.nextUrl;
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");

    let brandKit: ClientBrandKit | null = null;
    if (clientId) {
      brandKit = brandKits.get(clientId) ?? getDefaultBrandKit(clientId);
    }

    let knowledgeItems: ProjectKnowledgeItem[] = [];
    if (projectId) {
      if (!knowledgeStore.has(projectId)) {
        const project = await getProjectById(projectId);
        knowledgeStore.set(projectId, getInitialKnowledgeBase(projectId, project?.title || "Production"));
      }
      knowledgeItems = knowledgeStore.get(projectId) || [];
    }

    return NextResponse.json({
      success: true,
      brandKit,
      knowledgeItems,
    });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("GET /api/studio/knowledge error:", err);
    return NextResponse.json({ error: "Failed to load knowledge base" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireStudioSession();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body.action as string;

    if (action === "save_brand_kit") {
      const clientId = String(body.clientId || "");
      const kit = body.brandKit as ClientBrandKit;
      if (clientId && kit) {
        brandKits.set(clientId, { ...kit, updatedAt: new Date().toISOString() });
      }
      return NextResponse.json({ success: true, brandKit: kit });
    }

    if (action === "add_knowledge_item") {
      const projectId = String(body.projectId || "");
      const item: ProjectKnowledgeItem = {
        id: `kb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        projectId,
        title: String(body.title || "Untitled Document"),
        category: (body.category as ProjectKnowledgeItem["category"]) || "creative_brief",
        contentMarkdown: String(body.contentMarkdown || ""),
        tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existing = knowledgeStore.get(projectId) || [];
      existing.unshift(item);
      knowledgeStore.set(projectId, existing);

      return NextResponse.json({ success: true, item });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("POST /api/studio/knowledge error:", err);
    return NextResponse.json({ error: "Failed to update knowledge base" }, { status: 500 });
  }
}
