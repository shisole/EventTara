"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6 text-center">
      <div className="text-5xl">✉️</div>

      <h2 className="text-2xl font-heading font-bold">Check Your Email</h2>

      <p className="text-gray-600 dark:text-gray-300">
        We sent a confirmation link to{" "}
        {email ? <strong>{email}</strong> : "your email"}. Click the link to
        activate your account.
      </p>

      <p className="text-sm text-gray-400 dark:text-gray-500">
        Didn&apos;t receive it? Check your spam folder.
      </p>

      <div className="space-y-3">
        <Link
          href="/signup"
          className="block text-sm text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 font-medium"
        >
          Back to Sign Up
        </Link>
        <Link
          href="/login"
          className="block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Already confirmed? Sign In
        </Link>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  );
}
