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
import { createPinia } from 'pinia';
import axios from 'axios';
import OidcPlugin from 'oidc-login-plugin';

const pinia = createPinia();
const axiosInstance = axios.create({
  baseURL: 'https://api.example.com'
});

app.use(OidcPlugin, {
  pinia,
  router,
  axios: axiosInstance,
  oidc: {
    userManagerSettings: {
      authority: 'https://your-idp.com',
      client_id: 'your-client-id',
      redirect_uri: 'http://localhost:3000/callback',
      post_logout_redirect_uri: 'http://localhost:3000',
      response_type: 'code',
      scope: 'openid profile email',
    },
    storageKey: 'authToken',
    redirectUrl: '/login'
  },
  identityAppsUrl: 'https://your-idp.com/apps',
  debug: true
});
```

### 3. Use the store and composables

```typescript
import { useUserStore, useGlobal } from 'oidc-login-plugin';

// User store for authentication state
const userStore = useUserStore();
const isAuth = await userStore.isAuthenticated();
const user = userStore.user;

// Global composable for logout with redirect
const { logout } = useGlobal();
logout(); // Logs out and redirects to identityAppsUrl
```

## Features

- ✅ OIDC authentication with oidc-client-ts
- ✅ Built-in callback component with loading UI
- ✅ Router guards for protected routes
- ✅ Axios interceptor with automatic token refresh
- ✅ Pinia store for user state management
- ✅ Global logout with configurable redirect
- ✅ Configurable storage keys and redirect URLs
- ✅ Debug mode for development
- ✅ TypeScript support

## Documentation

See [USAGE.md](./USAGE.md) for detailed documentation.

## License

ISC
