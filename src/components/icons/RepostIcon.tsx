export default function RepostIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16l-3-3 3-3m10-4l3 3-3 3M4 13h13a3 3 0 0 0 3-3V8M20 11H7a3 3 0 0 0-3 3v2"
      />
    </svg>
  );
}
