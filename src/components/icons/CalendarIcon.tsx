interface CalendarIconProps {
  className?: string;
  variant?: "outline" | "filled";
}

export default function CalendarIcon({ className, variant = "outline" }: CalendarIconProps) {
  return variant === "filled" ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zm.75-3a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-.75 5.25a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zm.75-3a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-.75 5.25a.75.75 0 100-1.5.75.75 0 000 1.5zM13.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zm.75-3a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-.75 5.25a.75.75 0 100-1.5.75.75 0 000 1.5zm3-6a.75.75 0 100-1.5.75.75 0 000 1.5zm.75 1.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM6.75 3v.75h10.5V3a.75.75 0 011.5 0v.75h.75c1.24 0 2.25 1.01 2.25 2.25v13.5c0 1.24-1.01 2.25-2.25 2.25H4.5c-1.24 0-2.25-1.01-2.25-2.25V6c0-1.24 1.01-2.25 2.25-2.25h.75V3a.75.75 0 011.5 0zm13.5 6.75H3.75v9.75c0 .414.336.75.75.75h15c.414 0 .75-.336.75-.75V9.75z" />
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
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}
