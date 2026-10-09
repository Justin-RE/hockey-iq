import type { Metadata } from "next";
import { signup } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Create an account" };

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="mt-1 max-w-xl text-slate-700">
          An account saves your progress so you can pick up on any device. We only store a nickname
          and password. No email, no real name.
        </p>
      </div>
      <AuthForm mode="signup" action={signup} />
    </div>
  );
}
