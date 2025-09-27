"use server";

import type { AuthState } from "@/lib/auth-types";
import { clearAuthCookie, setAuthCookie, verifyPassword } from "@/lib/auth";

export async function loginAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin");

  if (!verifyPassword(password)) {
    return { success: false, error: "Invalid password", redirectTo: nextPath };
  }

  await setAuthCookie();
  return { success: true, error: undefined, redirectTo: nextPath };
}

export async function logoutAction(): Promise<void> {
  await clearAuthCookie();
}
