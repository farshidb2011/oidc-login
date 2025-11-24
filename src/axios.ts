import { AxiosInstance } from "axios";
import { useUserStore, getOidcConfig } from "./user";
import { debugLog } from "./debug";

let callRefreshToken = false;

export const setupAxiosInterceptor = (api: AxiosInstance) => {
  const userStore = useUserStore();
  const config = getOidcConfig();

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      if (error?.response?.status === 401) {
        if (!callRefreshToken) {
          try {
            await userStore.refreshToken();
            debugLog("Call refresh token");
            callRefreshToken = true;
            setTimeout(() => {
              callRefreshToken = false;
            }, 30000);
            return api.request(error.config);
          } catch (error) {
            debugLog("Refresh token error", error)
            userStore.logout();
            location.href = config.redirectUrl as string;
          }
        }
      }
      return Promise.reject(error);
    }
  );
  debugLog("Axios response interceptors", (api.interceptors.response as any).handlers)
};
