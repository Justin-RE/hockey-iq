import type { Metadata } from "next";
import { login } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <AuthForm mode="login" action={login} />
    </div>
  );
}
