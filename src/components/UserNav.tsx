import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth/session";

export async function UserNav() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/login" className="rounded bg-white/15 px-3 py-1.5 hover:bg-white/25">
        Sign in
      </Link>
    );
  }
  return (
    <form action={logout} className="flex items-center gap-3">
      <span>
        Signed in as <strong>{user.nickname}</strong>
      </span>
      <button type="submit" className="rounded bg-white/15 px-3 py-1.5 hover:bg-white/25">
        Sign out
      </button>
    </form>
  );
}
