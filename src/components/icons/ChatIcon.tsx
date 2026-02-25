interface ChatIconProps {
  className?: string;
  variant?: "outline" | "filled";
}

export default function ChatIcon({ className, variant = "outline" }: ChatIconProps) {
  return variant === "filled" ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.29 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.68-3.348 3.97a48.874 48.874 0 01-4.152.38v3.28a.75.75 0 01-1.188.61L8.4 17.35a49.898 49.898 0 01-3.552-.38C2.87 16.71 1.5 14.976 1.5 13.03V7.02c0-1.946 1.37-3.68 3.348-3.97V2.77z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  );
}
