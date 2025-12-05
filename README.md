# OIDC Login Plugin for Vue 3

A configurable Vue 3 plugin that provides OIDC authentication with router guards, axios interceptors, and Pinia integration.

## Installation

```bash
npm install oidc-login-plugin
# or
pnpm add oidc-login-plugin
```

## Quick Start

### 1. Create your router

```typescript
import { createRouter } from 'vue-router';

const router = createRouter({
  routes: [
    {
      path: '/dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    }
  ]
});
```

### 2. Install the plugin

**Important:** Use this plugin BEFORE `app.use(router)` because it modifies the router by adding guards and routes.

```typescript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import axios from 'axios';
import OidcPlugin from 'oidc-login-plugin';
import router from './router';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

const axiosInstance = axios.create({
  baseURL: 'https://api.example.com'
});

// Install Pinia first
app.use(pinia);

// Install OIDC plugin BEFORE router
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

// Install router AFTER the plugin
app.use(router);

app.mount('#app');
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

## Important Notes

⚠️ **Plugin Installation Order**: Always use `app.use(OidcPlugin, ...)` BEFORE `app.use(router)` because the plugin modifies the router by:
- Adding the callback route dynamically based on your `redirect_uri`
- Setting up navigation guards for protected routes
- Configuring authentication flow

```typescript
// ✅ Correct order
app.use(pinia);
app.use(OidcPlugin, { ... });
app.use(router);

// ❌ Wrong order - guards and routes won't work properly
app.use(router);
app.use(OidcPlugin, { ... });
```

## Features

- ✅ OIDC authentication with oidc-client-ts
- ✅ Automatic callback route registration (no manual route needed)
- ✅ Built-in callback component with loading UI
- ✅ Router guards for protected routes (`meta: { requiresAuth: true }`)
- ✅ Axios interceptor with automatic token refresh on 401
- ✅ Pinia store for user state management
- ✅ Global logout with configurable redirect
- ✅ Configurable storage keys and redirect URLs
- ✅ Debug mode for development
- ✅ TypeScript support

## How It Works

The plugin automatically:

1. **Registers a callback route** - Dynamically adds the callback route based on your `redirect_uri` configuration
2. **Sets up router guards** - Protects routes with `meta: { requiresAuth: true }` and redirects unauthenticated users to OIDC sign-in
3. **Configures axios interceptor** - Adds Bearer token to requests and handles 401 errors with automatic token refresh
4. **Initializes user store** - Creates a Pinia store with user state, authentication methods, and UserManager instance

## Documentation

See [USAGE.md](./USAGE.md) for detailed documentation.

## License

ISC
