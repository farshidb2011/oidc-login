import { beforeEach, describe, expect, it, vi } from "vitest";
import axios, { AxiosError, AxiosHeaders, type AxiosInstance } from "axios";

vi.mock("../src/user", () => ({
  useUserStore: vi.fn(),
  getOidcConfig: vi.fn(),
}));

vi.mock("../src/debug", () => ({
  debugLog: vi.fn(),
}));

import { getOidcConfig, useUserStore } from "../src/user";

const mockedUseUserStore = vi.mocked(useUserStore);
const mockedGetOidcConfig = vi.mocked(getOidcConfig);

function createApi(): AxiosInstance {
  const api = axios.create();
  api.defaults.adapter = async (config) => {
    throw Object.assign(new Error("Unexpected adapter call"), { config });
  };
  return api;
}

function make401(url: string): AxiosError {
  const config = {
    url,
    method: "get" as const,
    headers: new AxiosHeaders(),
  };
  return new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, {}, {
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config,
    data: {},
  });
}

describe("setupAxiosInterceptor concurrent 401 handling", () => {
  let refreshToken: ReturnType<typeof vi.fn>;
  let logout: ReturnType<typeof vi.fn>;
  let resolveRefresh: () => void;
  let rejectRefresh: (error?: unknown) => void;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    refreshToken = vi.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          resolveRefresh = resolve;
          rejectRefresh = reject;
        })
    );
    logout = vi.fn();

    mockedUseUserStore.mockReturnValue({
      refreshToken,
      logout,
    } as ReturnType<typeof useUserStore>);

    mockedGetOidcConfig.mockReturnValue({
      userManagerSettings: {
        authority: "https://auth.example",
        client_id: "app",
      },
      redirectUrl: "/login",
      storageKey: "authToken",
    });

    Object.defineProperty(globalThis, "location", {
      value: { href: "" },
      writable: true,
      configurable: true,
    });
  });

  async function setupInterceptor(api: AxiosInstance) {
    const { setupAxiosInterceptor } = await import("../src/axios");
    setupAxiosInterceptor(api);
    const handlers = (api.interceptors.response as any).handlers;
    return handlers[handlers.length - 1].rejected as (
      error: AxiosError
    ) => Promise<unknown>;
  }

  it("shares one refresh for parallel 401s and retries without logout", async () => {
    const api = createApi();
    const onRejected = await setupInterceptor(api);
    const requestSpy = vi
      .spyOn(api, "request")
      .mockResolvedValue({ data: "ok", status: 200 } as any);

    const p1 = onRejected(make401("/a"));
    const p2 = onRejected(make401("/b"));
    const p3 = onRejected(make401("/c"));

    expect(refreshToken).toHaveBeenCalledTimes(1);

    resolveRefresh();
    await expect(Promise.all([p1, p2, p3])).resolves.toEqual([
      { data: "ok", status: 200 },
      { data: "ok", status: 200 },
      { data: "ok", status: 200 },
    ]);

    expect(requestSpy).toHaveBeenCalledTimes(3);
    expect(logout).not.toHaveBeenCalled();
    expect(location.href).toBe("");
  });

  it("logs out when shared refresh fails", async () => {
    const api = createApi();
    const onRejected = await setupInterceptor(api);
    const requestSpy = vi.spyOn(api, "request");

    const p1 = onRejected(make401("/a"));
    const p2 = onRejected(make401("/b"));

    expect(refreshToken).toHaveBeenCalledTimes(1);

    rejectRefresh(new Error("silent renew failed"));

    await expect(p1).rejects.toThrow("silent renew failed");
    await expect(p2).rejects.toThrow("silent renew failed");

    expect(requestSpy).not.toHaveBeenCalled();
    expect(logout).toHaveBeenCalled();
    expect(location.href).toBe("/login");
  });

  it("updates Authorization header from storage before retry", async () => {
    const api = createApi();
    const onRejected = await setupInterceptor(api);

    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("fresh-token");
    refreshToken.mockResolvedValue(undefined);

    const requestSpy = vi
      .spyOn(api, "request")
      .mockResolvedValue({ data: "ok", status: 200 } as any);

    await onRejected(make401("/a"));

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer fresh-token",
        }),
      })
    );
  });

  it("logs out when a retried request still returns 401", async () => {
    const api = createApi();
    const onRejected = await setupInterceptor(api);

    vi.spyOn(api, "request").mockImplementation(async (config: any) => {
      return onRejected(
        new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, {}, {
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
          data: {},
        })
      ) as any;
    });

    const pending = onRejected(make401("/a"));
    expect(refreshToken).toHaveBeenCalledTimes(1);
    resolveRefresh();

    await expect(pending).rejects.toBeTruthy();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(location.href).toBe("/login");
  });
});
