import { Router } from "vue-router";
import { useUserStore } from "./user";
import { debugLog } from "./debug";

export const setupRouterGuards = (router: Router) => {
  debugLog("[SetupRouterGuards]")

  router.beforeEach(async (to) => {
    const userStore = useUserStore();
    if (to.meta?.requiresAuth) {
      if ((await userStore.isAuthenticated()) == false) {
        await userStore.oidc?.signinRedirect();
      }
    }
  });
};
