import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User, UserManager } from "oidc-client-ts";

describe("installSigninSilentDedupe", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("shares one in-flight signinSilent across concurrent callers", async () => {
    const { installSigninSilentDedupe } = await import("../src/user");

    let resolveSilent!: (user: User | null) => void;
    const original = vi.fn(
      () =>
        new Promise<User | null>((resolve) => {
          resolveSilent = resolve;
        })
    );

    const manager = {
      signinSilent: original,
    } as unknown as UserManager;

    installSigninSilentDedupe(manager);

    const p1 = manager.signinSilent();
    const p2 = manager.signinSilent();
    const p3 = manager.signinSilent();

    expect(original).toHaveBeenCalledTimes(1);

    const user = { access_token: "t" } as User;
    resolveSilent(user);

    await expect(Promise.all([p1, p2, p3])).resolves.toEqual([user, user, user]);
  });

  it("allows a new signinSilent after the previous one finishes", async () => {
    const { installSigninSilentDedupe } = await import("../src/user");

    const original = vi
      .fn()
      .mockResolvedValueOnce({ access_token: "a" } as User)
      .mockResolvedValueOnce({ access_token: "b" } as User);

    const manager = {
      signinSilent: original,
    } as unknown as UserManager;

    installSigninSilentDedupe(manager);

    await expect(manager.signinSilent()).resolves.toEqual({ access_token: "a" });
    await expect(manager.signinSilent()).resolves.toEqual({ access_token: "b" });
    expect(original).toHaveBeenCalledTimes(2);
  });
});

describe("setOidcConfig automaticSilentRenew default", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("defaults automaticSilentRenew to false", async () => {
    const { setOidcConfig, getOidcConfig } = await import("../src/user");

    setOidcConfig({
      userManagerSettings: {
        authority: "https://auth.example",
        client_id: "app",
        redirect_uri: "https://app.example/callback",
      },
    });

    expect(getOidcConfig().userManagerSettings.automaticSilentRenew).toBe(false);
  });

  it("keeps explicit automaticSilentRenew: true", async () => {
    const { setOidcConfig, getOidcConfig } = await import("../src/user");

    setOidcConfig({
      userManagerSettings: {
        authority: "https://auth.example",
        client_id: "app",
        redirect_uri: "https://app.example/callback",
        automaticSilentRenew: true,
      },
    });

    expect(getOidcConfig().userManagerSettings.automaticSilentRenew).toBe(true);
  });
});
