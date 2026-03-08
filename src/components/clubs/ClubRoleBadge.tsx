import { cn } from "@/lib/utils";

interface ClubRoleBadgeProps {
  role: "owner" | "admin" | "moderator" | "member";
  className?: string;
}

const roleStyles: Record<string, string> = {
  owner: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  moderator: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  member: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  moderator: "Mod",
  member: "Member",
};

export default function ClubRoleBadge({ role, className }: ClubRoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
        roleStyles[role] ?? roleStyles.member,
        className,
      )}
    >
      {roleLabels[role] ?? role}
    </span>
  );
}
