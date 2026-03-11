export type ValidationError = "inactive" | "expired" | "max_claims_reached";

export type ValidationResult = { valid: true } | { valid: false; error: ValidationError };

interface ValidateInput {
  is_active: boolean;
  expires_at: string | null;
  max_claims: number | null;
  claimCount: number;
}

/**
 * Validates whether a welcome page can still accept claims.
 * Priority: inactive > expired > max_claims_reached
 */
export function validateWelcomePage(page: ValidateInput): ValidationResult {
  if (!page.is_active) {
    return { valid: false, error: "inactive" };
  }

  if (page.expires_at && new Date(page.expires_at) < new Date()) {
    return { valid: false, error: "expired" };
  }

  if (page.max_claims !== null && page.claimCount >= page.max_claims) {
    return { valid: false, error: "max_claims_reached" };
  }

  return { valid: true };
}
