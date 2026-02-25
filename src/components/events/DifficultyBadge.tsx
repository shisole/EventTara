import UIBadge from "@/components/ui/Badge";

interface DifficultyBadgeProps {
  level: number;
  className?: string;
}

function getDifficultyVariant(level: number): string {
  if (level <= 4) return "difficulty_easy";
  if (level <= 7) return "difficulty_moderate";
  return "difficulty_hard";
}

export default function DifficultyBadge({ level, className }: DifficultyBadgeProps) {
  return (
    <UIBadge variant={getDifficultyVariant(level)} className={className}>
      {level}/9
    </UIBadge>
  );
}
