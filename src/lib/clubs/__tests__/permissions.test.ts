import { describe, expect, test } from "vitest";

import { CLUB_PERMISSIONS } from "../permissions";

describe("CLUB_PERMISSIONS", () => {
  test("create_event requires admin", () => {
    expect(CLUB_PERMISSIONS.create_event).toBe("admin");
  });
  test("edit_event requires moderator", () => {
    expect(CLUB_PERMISSIONS.edit_event).toBe("moderator");
  });
  test("delete_club requires owner", () => {
    expect(CLUB_PERMISSIONS.delete_club).toBe("owner");
  });
  test("manage_payment requires owner", () => {
    expect(CLUB_PERMISSIONS.manage_payment).toBe("owner");
  });
  test("view_events requires member", () => {
    expect(CLUB_PERMISSIONS.view_events).toBe("member");
  });
});
