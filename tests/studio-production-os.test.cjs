const test = require("node:test");
const assert = require("node:assert/strict");

// ── 1. Pipeline Orchestration & Dependency Graph ─────────────────────────────

function analyzeTaskDependencies(tasks, dependencies) {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const result = {};

  for (const task of tasks) {
    const parentDeps = dependencies.filter((d) => d.taskId === task.id);
    const blockers = parentDeps
      .map((d) => {
        const depTask = taskMap.get(d.dependsOnTaskId);
        if (!depTask || depTask.status === "done") return null;
        return {
          taskId: depTask.id,
          title: depTask.title,
          status: depTask.status,
        };
      })
      .filter(Boolean);

    result[task.id] = {
      taskId: task.id,
      isBlocked: blockers.length > 0 && task.status !== "done",
      blockedBy: blockers,
    };
  }

  return result;
}

test("pipeline: detects blocked tasks when prerequisite tasks are incomplete", () => {
  const tasks = [
    { id: "task_1", title: "A-Roll Stringout", status: "in_progress" },
    { id: "task_2", title: "Sound Design & Mix", status: "todo" },
  ];

  const dependencies = [
    { taskId: "task_2", dependsOnTaskId: "task_1", type: "finish_to_start" },
  ];

  const analysis = analyzeTaskDependencies(tasks, dependencies);

  assert.equal(analysis.task_1.isBlocked, false);
  assert.equal(analysis.task_2.isBlocked, true);
  assert.equal(analysis.task_2.blockedBy.length, 1);
  assert.equal(analysis.task_2.blockedBy[0].taskId, "task_1");
});

test("pipeline: unblocks task immediately when parent task status is 'done'", () => {
  const tasks = [
    { id: "task_1", title: "A-Roll Stringout", status: "done" },
    { id: "task_2", title: "Sound Design & Mix", status: "todo" },
  ];

  const dependencies = [
    { taskId: "task_2", dependsOnTaskId: "task_1", type: "finish_to_start" },
  ];

  const analysis = analyzeTaskDependencies(tasks, dependencies);

  assert.equal(analysis.task_2.isBlocked, false);
  assert.equal(analysis.task_2.blockedBy.length, 0);
});

// ── 2. Deliverable Preset QC Validation ──────────────────────────────────────

function validateDeliverable(detectedSpecs, targetPreset) {
  const issues = [];

  if (detectedSpecs.aspectRatio !== targetPreset.targetAspect) {
    issues.push({
      severity: "error",
      rule: "Aspect Ratio",
      message: `Expected ${targetPreset.targetAspect}, got ${detectedSpecs.aspectRatio}`,
    });
  }

  if (detectedSpecs.bitrateMbps < targetPreset.minBitrateMbps) {
    issues.push({
      severity: "warning",
      rule: "Bitrate Minimum",
      message: `Bitrate ${detectedSpecs.bitrateMbps} Mbps is below target ${targetPreset.minBitrateMbps} Mbps`,
    });
  }

  const lufsDelta = Math.abs(detectedSpecs.audioLufs - targetPreset.targetLufs);
  if (lufsDelta > 3.0) {
    issues.push({
      severity: "error",
      rule: "Audio LUFS",
      message: `Audio loudness ${detectedSpecs.audioLufs} LUFS violates standard ${targetPreset.targetLufs} LUFS`,
    });
  }

  const hasFatalError = issues.some((i) => i.severity === "error");
  return { passed: !hasFatalError, issues };
}

test("qc: passes conforming master render matching YouTube 4K preset", () => {
  const preset = {
    targetAspect: "16:9",
    minBitrateMbps: 45,
    targetLufs: -14,
  };

  const detected = {
    aspectRatio: "16:9",
    bitrateMbps: 65,
    audioLufs: -14.2,
  };

  const result = validateDeliverable(detected, preset);
  assert.equal(result.passed, true);
  assert.equal(result.issues.length, 0);
});

test("qc: flags aspect ratio mismatch and excessive loudness deviation as errors", () => {
  const preset = {
    targetAspect: "16:9",
    minBitrateMbps: 45,
    targetLufs: -14,
  };

  const detected = {
    aspectRatio: "9:16", // Vertical cut uploaded to horizontal preset
    bitrateMbps: 50,
    audioLufs: -8.5, // Way too loud (violates by > 5 LUFS)
  };

  const result = validateDeliverable(detected, preset);
  assert.equal(result.passed, false);
  assert.equal(result.issues.length, 2);
  assert.equal(result.issues[0].rule, "Aspect Ratio");
  assert.equal(result.issues[1].rule, "Audio LUFS");
});

// ── 3. Revision Intelligence & Unresolved Feedback ───────────────────────────

function generateRevisionSummary(comments, versionNumber) {
  const forVersion = comments.filter((c) => c.versionNumber <= versionNumber);
  const resolved = forVersion.filter((c) => c.status === "addressed");
  const open = forVersion.filter((c) => c.status !== "addressed");

  return {
    total: forVersion.length,
    resolvedCount: resolved.length,
    unresolvedCount: open.length,
  };
}

test("revisions: tracks resolved versus pending client feedback accurately", () => {
  const comments = [
    { id: "c1", versionNumber: 1, content: "Cut 2 seconds of intro", status: "addressed" },
    { id: "c2", versionNumber: 1, content: "Brighten shadows on hero", status: "addressed" },
    { id: "c3", versionNumber: 2, content: "Adjust font size of lower third", status: "open" },
  ];

  const summaryV1 = generateRevisionSummary(comments, 1);
  assert.equal(summaryV1.total, 2);
  assert.equal(summaryV1.resolvedCount, 2);
  assert.equal(summaryV1.unresolvedCount, 0);

  const summaryV2 = generateRevisionSummary(comments, 2);
  assert.equal(summaryV2.total, 3);
  assert.equal(summaryV2.resolvedCount, 2);
  assert.equal(summaryV2.unresolvedCount, 1);
});

// ── 4. Secure Client Sharing Expiration & Revocation ─────────────────────────

function validateShareLink(share) {
  if (share.isRevoked) {
    return { valid: false, reason: "Link revoked" };
  }
  if (new Date(share.expiresAt) < new Date()) {
    return { valid: false, reason: "Link expired" };
  }
  return { valid: true };
}

test("sharing: validates active links and rejects revoked or expired tokens", () => {
  const activeLink = {
    isRevoked: false,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  };
  assert.equal(validateShareLink(activeLink).valid, true);

  const expiredLink = {
    isRevoked: false,
    expiresAt: new Date(Date.now() - 3600000).toISOString(),
  };
  assert.equal(validateShareLink(expiredLink).valid, false);
  assert.equal(validateShareLink(expiredLink).reason, "Link expired");

  const revokedLink = {
    isRevoked: true,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  };
  assert.equal(validateShareLink(revokedLink).valid, false);
  assert.equal(validateShareLink(revokedLink).reason, "Link revoked");
});

// ── 5. Media Processing Queue Lifecycle & Failure Recovery ───────────────────

function createJob(assetId, jobType) {
  return {
    id: "job_" + Math.random().toString(36).substring(2, 6),
    assetId,
    jobType,
    status: "queued",
    attemptCount: 0,
    maxAttempts: 3,
  };
}

function processJob(job, willFail = false) {
  const attempts = job.attemptCount + 1;
  if (willFail) {
    return {
      ...job,
      attemptCount: attempts,
      status: attempts >= job.maxAttempts ? "failed" : "queued",
      errorLog: "Media processing worker timeout",
    };
  }
  return {
    ...job,
    attemptCount: attempts,
    status: "completed",
  };
}

test("media_queue: executes job and correctly manages retry limits upon failure", () => {
  let job = createJob("asset_raw_1", "transcribe_speech");
  assert.equal(job.status, "queued");

  // Attempt 1 fails -> requeued
  job = processJob(job, true);
  assert.equal(job.status, "queued");
  assert.equal(job.attemptCount, 1);

  // Attempt 2 fails -> requeued
  job = processJob(job, true);
  assert.equal(job.status, "queued");
  assert.equal(job.attemptCount, 2);

  // Attempt 3 fails -> final failed status
  job = processJob(job, true);
  assert.equal(job.status, "failed");
  assert.equal(job.attemptCount, 3);
  assert.equal(job.errorLog, "Media processing worker timeout");
});
