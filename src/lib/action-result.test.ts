import { describe, expect, it } from "vitest";
import { actionError, actionSuccess, mapDbError } from "./action-result";

describe("action result helpers", () => {
  it("builds an error result", () => {
    expect(actionError("Gagal")).toEqual({ error: "Gagal" });
  });

  it("builds a success result", () => {
    expect(actionSuccess("OK")).toEqual({ success: "OK" });
  });
});

describe("mapDbError", () => {
  it("maps unique violation to a readable message", () => {
    const err = { code: "23505" };
    expect(mapDbError(err, "Email sudah dipakai.")).toBe("Email sudah dipakai.");
  });

  it("falls back to generic message for unknown errors", () => {
    expect(mapDbError(new Error("boom"), "Email sudah dipakai.")).toBe("Terjadi kesalahan. Coba lagi.");
  });
});
