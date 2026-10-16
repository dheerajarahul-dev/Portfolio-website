/* eslint @typescript-eslint/no-require-imports: "off" */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");
const typescript = require("typescript");

const projectDirectory = process.cwd();
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "cxc-message-tests-"));
const environmentKeys = [
  "NETLIFY",
  "VERCEL",
  "AWS_LAMBDA_FUNCTION_NAME",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CMS_STORAGE_PROVIDER",
  "ALLOW_LOCAL_JSON_STORAGE",
];
const previousEnvironment = new Map(environmentKeys.map((key) => [key, process.env[key]]));
let storage;
let youtube;
let media;
let adminPermissions;
let contactLimits;

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

before(() => {
  for (const key of environmentKeys) delete process.env[key];
  process.chdir(temporaryDirectory);
  storage = require(path.join(projectDirectory, "src", "lib", "storage.ts"));
  youtube = require(path.join(projectDirectory, "src", "lib", "youtube.ts"));
  media = require(path.join(projectDirectory, "src", "lib", "media.ts"));
  adminPermissions = require(path.join(projectDirectory, "src", "lib", "admin-permissions.ts"));
  contactLimits = require(path.join(projectDirectory, "src", "lib", "contact-limits.ts"));
});

after(() => {
  process.chdir(projectDirectory);
  for (const [key, value] of previousEnvironment) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("messages can be moved to trash and restored without being removed", async () => {
  const message = await storage.appendMessage({
    name: "Test sender",
    email: "test@example.com",
    projectType: "General",
    message: "Message lifecycle regression test",
  });

  const trashed = await storage.updateMessage(message.id, {
    deletedAt: new Date().toISOString(),
  });
  assert.ok(trashed.deletedAt);
  assert.ok((await storage.readMessages()).some((entry) => entry.id === message.id));

  const restored = await storage.updateMessage(message.id, { deletedAt: null });
  assert.equal(restored.deletedAt, null);
  assert.ok((await storage.readMessages()).some((entry) => entry.id === message.id));
  assert.equal(storage.deleteMessage, undefined);
});

test("messages can be marked as read and the state persists", async () => {
  const message = await storage.appendMessage({
    name: "Reader test",
    email: "reader@example.com",
    projectType: "General",
    message: "Read-state persistence regression test",
  });

  const updated = await storage.updateMessage(message.id, { read: true });
  assert.equal(updated.read, true);
  storage.clearMessagesCache();
  assert.equal((await storage.readMessages()).find((entry) => entry.id === message.id)?.read, true);
});

test("old messages remain stored in the recycle bin", async () => {
  const message = await storage.appendMessage({
    name: "Older sender",
    email: "older@example.com",
    projectType: "General",
    message: "An old message must remain available",
  });
  const filePath = path.join(temporaryDirectory, "data", "messages.json");
  const records = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const record = records.find((entry) => entry.id === message.id);
  record.createdAt = "2000-01-01T00:00:00.000Z";
  record.deletedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(records));
  storage.clearMessagesCache();

  const retained = await storage.readMessages();
  assert.ok(retained.some((entry) => entry.id === message.id));
});

test("legacy site content receives founder defaults without losing existing metadata", async () => {
  const filePath = path.join(temporaryDirectory, "data", "site-content.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify({ metadata: { title: "Legacy site title" } }));
  storage.clearContentCache();

  const content = await storage.readContent();
  assert.equal(content.metadata.title, "Legacy site title");
  assert.equal(content.founder.name, "Dheeraj A");
  assert.ok(content.founder.biography.length > 100);
});

test("multiple messages can be moved to and restored from the recycle bin", async () => {
  const messages = await Promise.all([
    storage.appendMessage({ name: "One", email: "one@example.com", projectType: "General", message: "First" }),
    storage.appendMessage({ name: "Two", email: "two@example.com", projectType: "General", message: "Second" }),
  ]);
  const ids = messages.map((message) => message.id);

  assert.equal(await storage.updateMessages(ids, new Date().toISOString()), 2);
  assert.ok((await storage.readMessages()).filter((message) => ids.includes(message.id)).every((message) => message.deletedAt));
  assert.equal(await storage.updateMessages(ids, null), 2);
  assert.ok((await storage.readMessages()).filter((message) => ids.includes(message.id)).every((message) => !message.deletedAt));
});

test("permanent deletion only removes messages already in the recycle bin", async () => {
  const activeMessage = await storage.appendMessage({
    name: "Active sender",
    email: "active@example.com",
    projectType: "General",
    message: "This active message must not be purged",
  });
  const trashedMessage = await storage.appendMessage({
    name: "Trashed sender",
    email: "trashed@example.com",
    projectType: "General",
    message: "This trashed message can be purged",
  });

  assert.equal(await storage.deleteMessages([activeMessage.id]), 0);
  await storage.updateMessage(trashedMessage.id, { deletedAt: new Date().toISOString() });
  assert.equal(await storage.deleteMessages([activeMessage.id, trashedMessage.id]), 1);

  const remaining = await storage.readMessages();
  assert.ok(remaining.some((message) => message.id === activeMessage.id));
  assert.ok(!remaining.some((message) => message.id === trashedMessage.id));
});

test("managed storage reports sizes and only permanently deletes unreferenced uploads", async () => {
  const uploadDirectory = path.join(temporaryDirectory, "public", "uploads");
  fs.mkdirSync(uploadDirectory, { recursive: true });
  fs.writeFileSync(path.join(uploadDirectory, "orphan.mp4"), Buffer.alloc(128));
  fs.writeFileSync(path.join(uploadDirectory, "used.mp4"), Buffer.alloc(64));

  const content = await storage.readContent();
  await storage.writeContent({
    ...content,
    mediaLibrary: {
      ...content.mediaLibrary,
      items: [{
        id: "used-video",
        title: "Used video",
        description: "",
        category: "Test",
        type: "video",
        sourceType: "upload",
        mediaUrl: "/uploads/used.mp4",
        thumbnailUrl: "",
        published: false,
        featured: false,
        createdAt: new Date().toISOString(),
      }],
    },
  });

  const assets = await storage.listManagedAssets();
  assert.deepEqual(assets.map(({ name, size, referenced }) => ({ name, size, referenced })), [
    { name: "orphan.mp4", size: 128, referenced: false },
    { name: "used.mp4", size: 64, referenced: true },
  ]);
  assert.equal(await storage.deleteUnreferencedAsset("/uploads/used.mp4"), "referenced");
  assert.equal(await storage.deleteUnreferencedAsset("/uploads/orphan.mp4"), "deleted");
  assert.equal(fs.existsSync(path.join(uploadDirectory, "orphan.mp4")), false);
  assert.equal(fs.existsSync(path.join(uploadDirectory, "used.mp4")), true);
  await assert.rejects(storage.deleteUnreferencedAsset("/src/app/page.tsx"), /managed uploads folder/);
});

test("YouTube parsing rejects non-YouTube hosts and malformed IDs", () => {
  const validId = "AbC123_xYz0";
  assert.equal(youtube.extractYoutubeId(`https://www.youtube.com/watch?v=${validId}`), validId);
  assert.equal(youtube.extractYoutubeId(`https://youtu.be/${validId}?t=20`), validId);
  assert.equal(youtube.extractYoutubeId(`https://example.com/watch?v=${validId}`), "");
  assert.equal(youtube.extractYoutubeId("https://youtube.com/embed/not-a-video-id"), "");
});

test("direct video detection accepts video files, not arbitrary web pages", () => {
  assert.equal(media.getMediaKind("https://cdn.example.com/reel.webm?token=abc"), "video");
  assert.equal(media.getMediaKind("/uploads/reel.mp4#t=2"), "video");
  assert.equal(media.getMediaKind("https://example.com/watch?file=reel.mp4"), "unknown");
  assert.equal(media.getMediaKind("https://example.com/article"), "unknown");
});

test("admin roles cannot receive permissions outside their role allowlist", () => {
  assert.equal(adminPermissions.isAdminPermissionSetAllowed("editor", ["media:manage", "site:edit"]), true);
  assert.equal(adminPermissions.isAdminPermissionSetAllowed("editor", ["accounts:manage"]), false);
  assert.equal(adminPermissions.isAdminPermissionSetAllowed("media", ["messages:delete"]), false);
  assert.deepEqual(
    adminPermissions.filterAdminPermissions("messages", ["overview:view", "accounts:manage", "messages:view"]),
    ["overview:view", "messages:view"]
  );
  assert.equal(adminPermissions.isAdminPermissionSetAllowed("owner", adminPermissions.getAdminRolePermissions("owner")), true);
});

test("contact rate limit allows five messages per client per rolling hour", () => {
  const clientKey = crypto.randomUUID();
  const start = Date.now();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(contactLimits.reserveContactMessageSlot(clientKey, start + attempt).allowed, true);
  }
  const blocked = contactLimits.reserveContactMessageSlot(clientKey, start + 5);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.resetAt, start + 60 * 60 * 1000);
  assert.equal(contactLimits.reserveContactMessageSlot(clientKey, start + 60 * 60 * 1000 + 1).allowed, true);
});

test("contact total message limit counts sender email case-insensitively", () => {
  const messages = [
    { email: "Client@Example.com" },
    { email: "other@example.com" },
    { email: "client@example.COM" },
  ];
  assert.equal(contactLimits.countMessagesForEmail(messages, "client@example.com"), 2);
  assert.equal(contactLimits.countMessagesForEmail(messages, "unknown@example.com"), 0);

  const atLimit = Array.from({ length: contactLimits.MAX_MESSAGES_TOTAL_PER_EMAIL }, () => ({ email: "client@example.com" }));
  const belowLimit = atLimit.slice(0, contactLimits.MAX_MESSAGES_TOTAL_PER_EMAIL - 1);
  assert.equal(contactLimits.hasReachedEmailMessageLimit(belowLimit, "client@example.com"), false);
  assert.equal(contactLimits.hasReachedEmailMessageLimit(atLimit, "CLIENT@example.com"), true);
});