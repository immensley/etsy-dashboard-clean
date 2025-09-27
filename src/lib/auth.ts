import { cookies } from "next/headers";
import { AUTH_COOKIE, AUTH_MAX_AGE_SECONDS } from "@/lib/auth-constants";

const DEFAULT_PASSWORD = "changeme";

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
  return password === expected;
}

export async function setAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}
