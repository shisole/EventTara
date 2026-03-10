import { validateWelcomePage } from "../validate";

describe("validateWelcomePage", () => {
  const validPage = {
    is_active: true,
    expires_at: null,
    max_claims: null,
    claimCount: 0,
  };

  test("returns valid for active page with no limits", () => {
    expect(validateWelcomePage(validPage)).toEqual({ valid: true });
  });

  test("returns inactive for deactivated page", () => {
    expect(validateWelcomePage({ ...validPage, is_active: false })).toEqual({
      valid: false,
      error: "inactive",
    });
  });

  test("returns expired for past expiry date", () => {
    expect(
      validateWelcomePage({
        ...validPage,
        expires_at: "2020-01-01T00:00:00Z",
      }),
    ).toEqual({ valid: false, error: "expired" });
  });

  test("returns valid for future expiry date", () => {
    expect(
      validateWelcomePage({
        ...validPage,
        expires_at: "2099-12-31T23:59:59Z",
      }),
    ).toEqual({ valid: true });
  });

  test("returns max_claims_reached when claims equal max", () => {
    expect(validateWelcomePage({ ...validPage, max_claims: 10, claimCount: 10 })).toEqual({
      valid: false,
      error: "max_claims_reached",
    });
  });

  test("returns max_claims_reached when claims exceed max", () => {
    expect(validateWelcomePage({ ...validPage, max_claims: 10, claimCount: 15 })).toEqual({
      valid: false,
      error: "max_claims_reached",
    });
  });

  test("returns valid when claims under max", () => {
    expect(validateWelcomePage({ ...validPage, max_claims: 10, claimCount: 5 })).toEqual({
      valid: true,
    });
  });

  test("inactive takes priority over expired", () => {
    expect(
      validateWelcomePage({
        is_active: false,
        expires_at: "2020-01-01T00:00:00Z",
        max_claims: 10,
        claimCount: 15,
      }),
    ).toEqual({ valid: false, error: "inactive" });
  });

  test("expired takes priority over max_claims_reached", () => {
    expect(
      validateWelcomePage({
        is_active: true,
        expires_at: "2020-01-01T00:00:00Z",
        max_claims: 10,
        claimCount: 15,
      }),
    ).toEqual({ valid: false, error: "expired" });
  });
});
