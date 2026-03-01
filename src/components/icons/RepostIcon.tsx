export default function RepostIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 12V9a3 3 0 0 1 3-3h10M14 3l3 3-3 3M20 12v3a3 3 0 0 1-3 3H7M10 21l-3-3 3-3"
      />
    </svg>
  );
}
