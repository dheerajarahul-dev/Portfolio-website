/* eslint @typescript-eslint/no-require-imports: "off" */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const typescript = require("typescript");

const projectDirectory = process.cwd();

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  module._compile(output, filename);
};

const { analyzeMessage, generateSmartReply, detectLanguage } = require(path.join(projectDirectory, "src", "lib", "message-ai.ts"));

test("message-ai: accurately classifies YouTube inquiry with sound design and pricing", () => {
  const mockMsg = {
    id: "m1",
    name: "Alex Creator",
    email: "alex@example.com",
    projectType: "YouTube Long-form",
    message: "Hey! I have a 20 min talking head video for YouTube. Need fast pacing, sound design, and kinetic subtitles. What are your rates and can we finish asap?",
    createdAt: new Date().toISOString(),
    read: false,
  };

  const analysis = analyzeMessage(mockMsg);
  assert.equal(analysis.intent, "youtube");
  assert.equal(analysis.urgency, "urgent");
  assert.equal(analysis.wantsPricing, true);
  assert.equal(analysis.language, "english");

  const smartReply = generateSmartReply(mockMsg, "pro", "Dheeraj A", "Lead Video Editor");
  assert.ok(smartReply.reply.includes("Alex"));
  assert.ok(smartReply.reply.toLowerCase().includes("youtube long-form"));
  assert.ok(smartReply.reply.includes("rates") || smartReply.reply.includes("pricing"));
  assert.ok(smartReply.headline.length > 0);
  assert.ok(smartReply.steps.length >= 3);
});

test("message-ai: detects Short-form reels with fast turnaround", () => {
  const mockMsg = {
    id: "m2",
    name: "Sarah Fitness",
    email: "sarah@reels.com",
    projectType: "Shorts",
    message: "Need 10 vertical reels for Instagram and TikTok with captions and sound effects within 24h.",
    createdAt: new Date().toISOString(),
    read: false,
  };

  const analysis = analyzeMessage(mockMsg);
  assert.equal(analysis.intent, "short_form");
  assert.equal(analysis.urgency, "urgent");
  assert.ok(analysis.suggestedTimeline.includes("24"));

  const creativeReply = generateSmartReply(mockMsg, "creative", "Dheeraj A", "Lead Video Editor");
  assert.ok(creativeReply.headlineAccent.includes("magic"));
  assert.ok(creativeReply.reply.toLowerCase().includes("short-form"));
});

test("message-ai: supports multiple tones (growth, concise)", () => {
  const mockMsg = {
    id: "m3",
    name: "Tech Channel",
    email: "tech@yt.com",
    projectType: "Video",
    message: "Looking for monthly ongoing editing for our tech reviews.",
    createdAt: new Date().toISOString(),
    read: false,
  };

  const growthReply = generateSmartReply(mockMsg, "growth", "Dheeraj A", "Lead Video Editor");
  assert.ok(growthReply.reply.includes("retention visuals") || growthReply.reply.includes("first 5-second hook"));

  const conciseReply = generateSmartReply(mockMsg, "concise", "Dheeraj A", "Lead Video Editor");
  assert.ok(conciseReply.reply.length < growthReply.reply.length);
});

test("message-ai: detects Hinglish and generates authentic Hinglish response", () => {
  const mockHinglishMsg = {
    id: "m4",
    name: "Rohan Sharma",
    email: "rohan@gmail.com",
    projectType: "Reels",
    message: "Bhai mujhe youtube shorts aur instagram reels banwani hai. Jaldi chahiye aur thoda budget kam hai. Kya rate loge per video?",
    createdAt: new Date().toISOString(),
    read: false,
  };

  const detectedLang = detectLanguage(mockHinglishMsg.message);
  assert.equal(detectedLang, "hinglish");

  const analysis = analyzeMessage(mockHinglishMsg);
  assert.equal(analysis.language, "hinglish");
  assert.equal(analysis.intent, "short_form");
  assert.equal(analysis.urgency, "urgent");
  assert.equal(analysis.wantsPricing, true);
  assert.equal(analysis.budgetConstraint, true);

  const hinglishReply = generateSmartReply(mockHinglishMsg, "hinglish", "Dheeraj A", "Lead Video Editor");
  assert.ok(hinglishReply.reply.includes("Rohan"));
  assert.ok(hinglishReply.reply.includes("Aapka message mil gaya"));
  assert.ok(hinglishReply.reply.includes("pricing") || hinglishReply.reply.includes("budget"));
  assert.ok(hinglishReply.steps[0].length > 0);
});
