import { Router } from "vue-router";
import { useUserStore } from "./user";
import { debugLog } from "./debug";

export const setupRouterGuards = (router: Router, redirectUri: string) => {
  debugLog("[SetupRouterGuards]")

  const routes = router.getRoutes();

  const url = new URL(redirectUri);

  const route = routes.find(r => r.path == url.pathname);

  if (!route) {
    router.addRoute({
      path: url.pathname,
      name: 'authCallback',
      component: () => ({ template: '<div></div>' }),
      beforeEnter: async () => {
        // Call useUserStore inside the guard, not at setup time
        const userStore = useUserStore();
        try {
          await userStore.handleCallback();
          return router.replace('/');
        } catch {
          location.href = '/';
        }
      }
    });
  }


  router.beforeEach(async (to) => {
    // Call useUserStore inside the guard, not at setup time
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


