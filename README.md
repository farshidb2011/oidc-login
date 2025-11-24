# OIDC Login Plugin for Vue 3

A configurable Vue 3 plugin that provides OIDC authentication with router guards, axios interceptors, and Pinia integration.

## Installation

```bash
npm install oidc-login-plugin
# or
pnpm add oidc-login-plugin
```

## Quick Start

### 1. Add the callback route

```typescript
import { createRouter } from 'vue-router';
import { OidcCallback } from 'oidc-login-plugin';

const router = createRouter({
  routes: [
    {
      path: '/callback',
      component: OidcCallback
    },
    {
      path: '/dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    }
  ]
});
```

### 2. Install the plugin

```typescript
import OidcPlugin from 'oidc-login-plugin';

app.use(OidcPlugin, {
  pinia,
  router,
  axios: axiosInstance,
  oidc: {
    userManagerSettings: {
      authority: 'https://your-idp.com',
      client_id: 'your-client-id',
      redirect_uri: 'http://localhost:3000/callback',
      response_type: 'code',
      scope: 'openid profile email',
    }
  }
});
```

### 3. Use the store

```typescript
import { useUserStore } from 'oidc-login-plugin';

const userStore = useUserStore();
const isAuth = await userStore.isAuthenticated();
```

## Features

- ✅ Export OidcCallback component
- ✅ Router guards for protected routes
- ✅ Axios interceptor with token refresh
- ✅ Pinia store for user state
- ✅ Configurable storage keys
- ✅ Built-in loading UI

## Documentation

See [USAGE.md](./USAGE.md) for detailed documentation.

## License

ISC
