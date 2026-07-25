import { Router } from "vue-router";
import { useUserStore } from "./user";
import { debugLog } from "./debug";
import { consumeReturnUrl, saveReturnUrl } from "./returnUrl";

export const setupRouterGuards = (router: Router, redirectUri: string) => {
  debugLog("[SetupRouterGuards]")

  const routes = router.getRoutes();

  const url = new URL(redirectUri);
  const callbackPath = url.pathname;

  const route = routes.find(r => r.path == callbackPath);

  if (!route) {
    router.addRoute({
      path: callbackPath,
      name: 'authCallback',
      component: () => ({ template: '<div></div>' }),
      beforeEnter: async () => {
        // Call useUserStore inside the guard, not at setup time
        const userStore = useUserStore();
        const isSilentIframe = window.parent !== window;
        try {
          const result = await userStore.handleCallback();
          // Silent renew runs in a hidden iframe — do not navigate the SPA there
          if (isSilentIframe) {
            return false;
          }
          const returnUrl = consumeReturnUrl(result && 'state' in result ? result.state : undefined);
          return router.replace(returnUrl);
        } catch {
          if (isSilentIframe) {
            return false;
          }
          location.href = consumeReturnUrl();
        }
      }
    });
  }


  router.beforeEach(async (to) => {
    // Call useUserStore inside the guard, not at setup time
    const userStore = useUserStore();

    // Never treat the OIDC callback as a protected destination
    if (to.path === callbackPath) {
      return true;
    }

    if (to.meta?.requiresAuth) {
      const isAuth = await userStore.isAuthenticated();
      if (!isAuth) {
        debugLog("[RouterGuard] Not authenticated, trying silent renew");
        const renewed = await userStore.trySilentRenew();
        if (renewed) {
          debugLog("[RouterGuard] Silent renew succeeded");
          return true;
        }

        debugLog("[RouterGuard] Silent renew failed, redirecting to sign in");
        saveReturnUrl(to.fullPath);
        await userStore.oidc?.signinRedirect({ state: to.fullPath });
        return false;
      }
    }
    return true;
  });
};
