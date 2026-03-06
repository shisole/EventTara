export default function Copy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M8 2a2 2 0 0 1 2 2v1H7V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2v1H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2z" />
      <path d="M9 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
      <path d="M16 4v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2zm-2 0H8v10h6V4z" />
    </svg>
  );
}
