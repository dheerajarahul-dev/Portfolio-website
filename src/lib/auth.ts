import { createHash } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "cxc_admin";

export function getAdminPassword(): string | undefined {
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password && password.length > 0 ? password : undefined;
}

export function getAdminSessionToken(): string | undefined {
  const password = getAdminPassword();
  const sessionSecret = process.env.ADMIN_SESSION_SECRET?.trim();

  if (!password || !sessionSecret) {
    return undefined;
  }

  return createHash("sha256")
    .update(`${sessionSecret}:${password}`)
    .digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const expectedToken = getAdminSessionToken();

  if (!expectedToken || !token) {
    return false;
  }

  return token === expectedToken;
}
