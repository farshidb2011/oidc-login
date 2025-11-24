import { Router } from "vue-router";
import { useUserStore } from "./user";
import { debugLog } from "./debug";

export const setupRouterGuards = (router: Router) => {
  debugLog("[SetupRouterGuards]")

  router.beforeEach(async (to) => {
    // Skip guard for callback route to prevent interference
    if (to.path === '/callback' || to.name === 'callback') {
      return true;
    }

    const userStore = useUserStore();
    if (to.meta?.requiresAuth) {
      const isAuth = await userStore.isAuthenticated();
      if (!isAuth) {
        debugLog("[RouterGuard] User not authenticated, redirecting to sign in");
        await userStore.oidc?.signinRedirect();
        return false;
      }
    }
    return true;
  });
};
