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
      beforeEnter: () => {
        const userStore = useUserStore();
        userStore.handleCallback().then(() => {
          router.replace('/');
        }).catch(() => {
          location.href = '/';
        })
      },
      component: () => null
    });
  }


  router.beforeEach(async (to) => {
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


