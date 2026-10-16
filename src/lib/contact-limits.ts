const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_MESSAGES_PER_WINDOW = 5;
const MAX_TRACKED_CLIENTS = 2000;
export const MAX_MESSAGES_TOTAL_PER_EMAIL = 20;

const messageAttempts = new Map<string, number[]>();

export function reserveContactMessageSlot(clientKey: string, now: number) {
  const cutoff = now - RATE_WINDOW_MS;
  const recent = (messageAttempts.get(clientKey) || []).filter((timestamp) => timestamp > cutoff);
  if (recent.length >= MAX_MESSAGES_PER_WINDOW) {
    messageAttempts.set(clientKey, recent);
    return { allowed: false, resetAt: recent[0] + RATE_WINDOW_MS };
  }

  recent.push(now);
  messageAttempts.set(clientKey, recent);
  if (messageAttempts.size > MAX_TRACKED_CLIENTS) {
    for (const [key, timestamps] of messageAttempts) {
      const active = timestamps.filter((timestamp) => timestamp > cutoff);
      if (active.length) messageAttempts.set(key, active);
      else messageAttempts.delete(key);
    }
  }
  return { allowed: true, resetAt: 0 };
}

export function countMessagesForEmail(messages: { email: string }[], email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return messages.filter((message) => message.email.trim().toLowerCase() === normalizedEmail).length;
}

export function hasReachedEmailMessageLimit(messages: { email: string }[], email: string) {
  return countMessagesForEmail(messages, email) >= MAX_MESSAGES_TOTAL_PER_EMAIL;
}