"use client";

import { useRef } from "react";

import { Button } from "@/components/ui";

const CODE_LENGTH = 6;

export interface OtpCodeInputProps {
  email: string;
  code: string[];
  onCodeChange: (code: string[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onChangeEmail: () => void;
  loading: boolean;
  error: string;
}

export default function OtpCodeInput({
  email,
  code,
  onCodeChange,
  onSubmit,
  onResend,
  onChangeEmail,
  loading,
  error,
}: OtpCodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    onCodeChange(newCode);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replaceAll(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;

    const newCode = [...code];
    let idx = 0;
    for (const char of pasted) {
      newCode[idx] = char;
      idx++;
    }
    onCodeChange(newCode);

    const nextEmpty = newCode.findIndex((c) => !c);
    inputRefs.current[nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty]?.focus();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-teal-600 dark:text-teal-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
          Enter your code
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-gray-900 dark:text-white">{email}</span>
        </p>
      </div>

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => {
              handleChange(i, e.target.value);
            }}
            onKeyDown={(e) => {
              handleKeyDown(i, e);
            }}
            autoFocus={i === 0}
            className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-colors"
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={loading || code.join("").length !== CODE_LENGTH}
      >
        {loading ? "Verifying..." : "Verify"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onResend}
          disabled={loading}
          className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
        >
          Didn&apos;t get it? Resend code
        </button>
        <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          Change email
        </button>
      </div>
    </form>
  );
}
