// src/index.ts
import type { App } from "vue";
import type { Router } from "vue-router";
import type { Pinia } from "pinia";
import type { AxiosInstance } from "axios";
import type { UserManagerSettings } from "oidc-client-ts";
import { setupRouterGuards } from "./router";
import { setupAxiosInterceptor } from "./axios";
import { setOidcConfig } from "./user";
import { debugLog, setDebug } from "./debug";
import { setIdentityAppsUrl } from "./logout";

export interface OidcConfig {
  userManagerSettings: UserManagerSettings;
  storageKey?: string;
  redirectUrl?: string;
}

export interface PluginOptions {
  router?: Router;
  pinia?: Pinia;
  axios?: AxiosInstance;
  oidc: OidcConfig;
  debug?: boolean;
  identityAppsUrl?: string;
}

export default {
  install(app: App, options: PluginOptions) {

    if (options.debug) {
      setDebug(true);
    }

    if (!options.oidc) {
      throw new Error("[oidc-login-plugin] OIDC configuration is required.");
    }

    // --- Set OIDC Config ---
    setOidcConfig(options.oidc);
    debugLog("[SetOidcConfig]")

    // --- Set Identity Apps URL ---
    if (options.identityAppsUrl) {
      setIdentityAppsUrl(options.identityAppsUrl);
    }

    // --- Pinia ---
    if (options.pinia) {
      // app.use(options.pinia);
      debugLog("[UsePinia]")
    } else {
      console.warn("[oidc-login-plugin] pinia instance not provided.");
    }

    // --- Router Guards ---
    if (options.router) {
      setupRouterGuards(options.router, options.oidc.userManagerSettings.redirect_uri);
    } else {
      console.warn("[oidc-login-plugin] router instance not provided.");
    }

    // --- Axios interceptor ---
    if (options.axios) {
      setupAxiosInterceptor(options.axios);
      debugLog("[SetupAxiosInterceptor]")
    } else {
      console.warn("[oidc-login-plugin] axios instance not provided.");
    }
  },
};

export { useUserStore } from "./user";
export { useGlobal } from './logout'
export { default as OidcCallback } from "./OidcCallback.vue";
