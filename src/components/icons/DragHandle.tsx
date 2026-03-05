interface DragHandleProps {
  className?: string;
}

export default function DragHandle({ className = "w-4 h-4" }: DragHandleProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16" aria-label="Drag to reorder">
      <circle cx="4" cy="3" r="1.5" />
      <circle cx="4" cy="8" r="1.5" />
      <circle cx="4" cy="13" r="1.5" />
      <circle cx="10" cy="3" r="1.5" />
      <circle cx="10" cy="8" r="1.5" />
      <circle cx="10" cy="13" r="1.5" />
    </svg>
  );
}
