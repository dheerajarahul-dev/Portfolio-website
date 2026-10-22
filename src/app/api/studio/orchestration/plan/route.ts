// src/app/api/studio/orchestration/plan/route.ts
import { NextResponse } from 'next/server';
import { generateProductionPlan } from '@/lib/studio-orchestration';
import { requireStudioSession } from '@/lib/studio-auth';
import type { ProductionPlanPrompt } from '@/lib/studio-types';

/**
 * POST /api/studio/orchestration/plan
 * Generates an AI‑assisted production plan from a brief.
 * Body: { projectType: string; brief: string; additionalContext?: string }
 */
export async function POST(request: Request) {
  // Ensure the user is authenticated
  const session = await requireStudioSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const payload: ProductionPlanPrompt = await request.json();
    const result = generateProductionPlan(payload);
    return NextResponse.json({ result }, { status: 200 });
  } catch (err: unknown) {
    console.error('Production plan generation error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; // ensure fresh generation on each call
