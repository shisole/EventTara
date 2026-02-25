interface HomeIconProps {
  className?: string;
  variant?: "outline" | "filled";
}

export default function HomeIcon({ className, variant = "outline" }: HomeIconProps) {
  return variant === "filled" ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.47 3.841a.75.75 0 011.06 0l8.69 8.69a.75.75 0 01-.53 1.28h-1.44v7.44a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-7.44H2.31a.75.75 0 01-.53-1.28l8.69-8.69z" />
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
        d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}
