import { beforeEach, describe, expect, it, vi } from "vitest";

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
    key: (index) => Array.from(map.keys())[index] ?? null,
  };
}

describe("returnUrl helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("sessionStorage", createMemoryStorage());
  });

  it("saves and consumes a relative path", async () => {
    const { saveReturnUrl, consumeReturnUrl } = await import("../src/returnUrl");

    saveReturnUrl("/projects/42?tab=files");
    expect(consumeReturnUrl()).toBe("/projects/42?tab=files");
    // Cleared after consume
    expect(consumeReturnUrl()).toBe("/");
  });

  it("rejects open-redirect style URLs", async () => {
    const { saveReturnUrl, consumeReturnUrl, isSafeReturnUrl } = await import(
      "../src/returnUrl"
    );

    expect(isSafeReturnUrl("//evil.com")).toBe(false);
    expect(isSafeReturnUrl("https://evil.com")).toBe(false);

    saveReturnUrl("//evil.com");
    expect(consumeReturnUrl()).toBe("/");
  });

  it("falls back to OIDC state path when session is empty", async () => {
    const { consumeReturnUrl } = await import("../src/returnUrl");
    expect(consumeReturnUrl("/studio/cameras")).toBe("/studio/cameras");
  });
});
