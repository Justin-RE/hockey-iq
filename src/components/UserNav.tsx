import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth/session";

export async function UserNav() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-11 items-center rounded bg-white/15 px-3 hover:bg-white/25"
      >
        Sign in
      </Link>
    );
  }
  return (
    <form action={logout} className="flex items-center gap-3">
      <span>
        <span className="hidden sm:inline">Signed in as </span>
        <strong>{user.nickname}</strong>
      </span>
      <button
        type="submit"
        className="inline-flex min-h-11 shrink-0 items-center rounded bg-white/15 px-3 hover:bg-white/25"
      >
        Sign out
      </button>
    </form>
  );
}
