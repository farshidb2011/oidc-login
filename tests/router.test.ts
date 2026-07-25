import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/user", () => ({
  useUserStore: vi.fn(),
}));

vi.mock("../src/debug", () => ({
  debugLog: vi.fn(),
}));

import { useUserStore } from "../src/user";

const mockedUseUserStore = vi.mocked(useUserStore);

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

describe("setupRouterGuards auth flow", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal("sessionStorage", createMemoryStorage());
  });

  it("allows navigation after successful silent renew", async () => {
    const trySilentRenew = vi.fn().mockResolvedValue(true);
    const isAuthenticated = vi.fn().mockResolvedValue(false);
    const signinRedirect = vi.fn();

    mockedUseUserStore.mockReturnValue({
      trySilentRenew,
      isAuthenticated,
      handleCallback: vi.fn(),
      oidc: { signinRedirect },
    } as any);

    let beforeEachHandler: (to: any) => Promise<any> = async () => true;
    const router = {
      getRoutes: () => [{ path: "/callback" }],
      addRoute: vi.fn(),
      replace: vi.fn(),
      beforeEach: (fn: typeof beforeEachHandler) => {
        beforeEachHandler = fn;
      },
    };

    const { setupRouterGuards } = await import("../src/router");
    setupRouterGuards(router as any, "https://app.example/callback");

    const result = await beforeEachHandler({
      path: "/studio/cameras",
      fullPath: "/studio/cameras",
      meta: { requiresAuth: true },
    });

    expect(trySilentRenew).toHaveBeenCalledTimes(1);
    expect(signinRedirect).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("saves return URL and redirects when silent renew fails", async () => {
    const trySilentRenew = vi.fn().mockResolvedValue(false);
    const isAuthenticated = vi.fn().mockResolvedValue(false);
    const signinRedirect = vi.fn().mockResolvedValue(undefined);

    mockedUseUserStore.mockReturnValue({
      trySilentRenew,
      isAuthenticated,
      handleCallback: vi.fn(),
      oidc: { signinRedirect },
    } as any);

    let beforeEachHandler: (to: any) => Promise<any> = async () => true;
    const router = {
      getRoutes: () => [{ path: "/callback" }],
      addRoute: vi.fn(),
      replace: vi.fn(),
      beforeEach: (fn: typeof beforeEachHandler) => {
        beforeEachHandler = fn;
      },
    };

    const { setupRouterGuards } = await import("../src/router");
    setupRouterGuards(router as any, "https://app.example/callback");

    const result = await beforeEachHandler({
      path: "/studio/cameras",
      fullPath: "/studio/cameras?x=1",
      meta: { requiresAuth: true },
    });

    expect(signinRedirect).toHaveBeenCalledWith({ state: "/studio/cameras?x=1" });
    expect(sessionStorage.getItem("oidc_login_return_url")).toBe("/studio/cameras?x=1");
    expect(result).toBe(false);
  });
});
