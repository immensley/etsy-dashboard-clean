import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE } from "@/lib/auth-constants";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams?: { next?: string } }) {
  const nextParam = searchParams?.next;
  const cookieStore = await cookies();
  const authed = cookieStore.get(AUTH_COOKIE)?.value === "true";
  if (authed) {
    redirect(nextParam ?? "/admin");
  }

  return <LoginForm nextPath={nextParam} />;
}
