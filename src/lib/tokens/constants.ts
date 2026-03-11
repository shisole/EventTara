export const TOKEN_REWARDS = {
  check_in: 50,
  hosting: 100,
  daily_login: 5,
  streak_bonus: 25,
  badge_earned_common: 50,
  badge_earned_rare: 100,
  badge_earned_legendary: 200,
  first_event: 100,
} as const;

export type TokenReason =
  | "check_in"
  | "hosting"
  | "daily_login"
  | "streak_bonus"
  | "milestone"
  | "purchase"
  | "badge_earned"
  | "first_event"
  | "admin_grant";
