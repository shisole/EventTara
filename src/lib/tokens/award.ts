import type { SupabaseClient } from "@supabase/supabase-js";

import type { TokenReason } from "./constants";

export async function awardTokens(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason: TokenReason,
  referenceId?: string,
): Promise<number | null> {
  const { data, error } = await supabase.rpc("award_tokens", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_reference_id: referenceId ?? null,
  });

  if (error) {
    console.error("[tokens] award error:", error.message);
    return null;
  }

  return data as number;
}
