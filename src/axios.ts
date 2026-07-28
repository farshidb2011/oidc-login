import { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useUserStore, getOidcConfig } from "./user";
import { debugLog } from "./debug";

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<void> | null = null;

export const setupAxiosInterceptor = (api: AxiosInstance) => {
  const config = getOidcConfig();

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      if (error?.response?.status === 401) {
        const userStore = useUserStore();
        const requestConfig = error.config as RetryableRequestConfig | undefined;

        if (!requestConfig) {
          return Promise.reject(error);
        }

        if (requestConfig._retry) {
          debugLog("Already retried after refresh, redirecting to login");
          userStore.logout();
          location.href = (config.redirectUrl as string) || config.userManagerSettings.authority || "/";
          return Promise.reject(error);
        }

        requestConfig._retry = true;

        try {
          if (!refreshPromise) {
            debugLog("Call refresh token");
            refreshPromise = userStore.refreshToken().finally(() => {
              refreshPromise = null;
            });
          }
          await refreshPromise;

          const token = localStorage.getItem(config.storageKey as string);
          if (token && requestConfig.headers) {
            if (typeof requestConfig.headers.set === "function") {
              requestConfig.headers.set("Authorization", `Bearer ${token}`);
            } else {
              (requestConfig.headers as Record<string, string>).Authorization = `Bearer ${token}`;
            }
          }

          return api.request(requestConfig);
        } catch (refreshError) {
          debugLog("Refresh token error", refreshError);
          userStore.logout();
          location.href = config.redirectUrl as string;
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
  debugLog("Axios response interceptors", (api.interceptors.response as any).handlers)
};
