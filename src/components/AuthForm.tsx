"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthFormState } from "@/app/actions/auth";

type Props = {
  mode: "login" | "signup";
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
};

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="max-w-sm space-y-4" noValidate>
      <Field
        name="nickname"
        label="Nickname"
        autoComplete="username"
        hint={isSignup ? "3-20 letters, numbers, or _. Don't use your real name." : undefined}
        errors={state?.fieldErrors?.nickname}
      />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete={isSignup ? "new-password" : "current-password"}
        hint={isSignup ? "At least 8 characters." : undefined}
        errors={state?.fieldErrors?.password}
      />
      {state?.error && (
        <p role="alert" className="text-rose-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-home w-full rounded-lg px-4 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
      </button>
      <p className="text-sm text-slate-600">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Field(props: {
  name: string;
  label: string;
  type?: string;
  autoComplete: string;
  hint?: string;
  errors?: string[];
}) {
  const hintId = `${props.name}-hint`;
  const errorId = `${props.name}-error`;
  return (
    <div className="space-y-1">
      <label htmlFor={props.name} className="block font-medium">
        {props.label}
      </label>
      <input
        id={props.name}
        name={props.name}
        type={props.type ?? "text"}
        autoComplete={props.autoComplete}
        required
        aria-invalid={!!props.errors?.length}
        aria-describedby={
          [props.hint && hintId, props.errors?.length && errorId].filter(Boolean).join(" ") ||
          undefined
        }
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
      />
      {props.hint && (
        <p id={hintId} className="text-sm text-slate-600">
          {props.hint}
        </p>
      )}
      {props.errors?.length ? (
        <p id={errorId} className="text-sm text-rose-700">
          {props.errors.join(". ")}
        </p>
      ) : null}
    </div>
  );
}
