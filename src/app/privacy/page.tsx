import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">Privacy</h1>
      <p>HockeyIQ is built to be used by kids, so we collect as little as possible.</p>
      <h2 className="text-xl font-semibold">If you play as a guest</h2>
      <p>
        Your answers are saved only in this browser (local storage). Nothing about you is sent to us
        except the scenario and choice you picked, which we don&apos;t link to you.
      </p>
      <h2 className="text-xl font-semibold">If you create an account</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>
          We store your nickname, a scrambled (hashed) version of your password, and your answers.
        </li>
        <li>We never ask for your email, real name, birthday, school, location, or photos.</li>
        <li>Please don&apos;t use your real name as your nickname.</li>
      </ul>
      <h2 className="text-xl font-semibold">What we don&apos;t do</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>No ads and no advertising or analytics trackers.</li>
        <li>We don&apos;t sell or share your information.</li>
        <li>
          Error reports help us fix bugs. They don&apos;t include your IP address or account
          details.
        </li>
      </ul>
      <p>
        Parents and guardians can ask the team that runs this site to delete an account and its
        answers at any time.
      </p>
    </article>
  );
}
