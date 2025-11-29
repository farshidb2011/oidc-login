# OIDC Login Plugin - Usage Guide

## Installation

```bash
npm install oidc-login-plugin
# or
pnpm add oidc-login-plugin
```

## Setup

### 1. Add the callback route to your router

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { OidcCallback } from 'oidc-login-plugin';
import Home from '@/views/Home.vue';
import Dashboard from '@/views/Dashboard.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Home
    },
    {
      path: '/callback',
      component: OidcCallback
    },
    {
      path: '/dashboard',
      component: Dashboard,
      meta: { requiresAuth: true } // Protected route
    },
    // Add catch-all route at the end
    {
      path: '/:pathMatch(.*)*',
      name: 'notfound',
      component: () => import('@/views/NotFound.vue')
    }
  ]
});

export default router;
```

### 2. Install the plugin

```typescript
// main.ts
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

app.use(OidcPlugin, {
  pinia,
  router,
  axios: axiosInstance,
  oidc: {
    userManagerSettings: {
      authority: 'https://your-identity-server.com',
      client_id: 'your-client-id',
      redirect_uri: 'http://localhost:3000/callback',
      post_logout_redirect_uri: 'http://localhost:3000',
      response_type: 'code',
      scope: 'openid profile email offline_access',
    },
    storageKey: 'authToken', // optional, defaults to 'authToken'
    redirectUrl: '/login' // optional, where to redirect on 401
  },
  identityAppsUrl: 'https://your-identity-server.com/apps', // optional, for logout redirect
  debug: true // optional, enables debug logging
});

app.mount('#app');
```

## Configuration Options

### `OidcConfig`

- `userManagerSettings` (required): OIDC UserManager settings from oidc-client-ts
- `storageKey` (optional): localStorage key for storing the access token (default: 'authToken')
- `redirectUrl` (optional): URL to redirect on 401 errors (default: '/')

### `PluginOptions`

- `pinia` (optional): Pinia instance for state management
- `router` (optional): Vue Router instance for navigation guards
- `axios` (optional): Axios instance for HTTP interceptors
- `oidc` (required): OIDC configuration object
- `identityAppsUrl` (optional): URL to redirect after logout (e.g., identity provider's apps page)
- `debug` (optional): Enable debug logging for troubleshooting

## Using the User Store

The `useUserStore` provides access to authentication state and user information:

```typescript
import { useUserStore } from 'oidc-login-plugin';

const userStore = useUserStore();

// Check authentication status
const isAuth = await userStore.isAuthenticated();

// Access user information
const user = userStore.user;
console.log(user?.profile.email);

// Access the UserManager instance
const userManager = userStore.oidc;

// Handle callback (automatically called by OidcCallback component)
await userStore.handleCallback();

// Refresh token
await userStore.refreshToken();

// Logout (removes user from store and localStorage)
userStore.logout();
```

### UserStore Properties

- `user`: Current user object from oidc-client-ts (User | null)
- `oidc`: UserManager instance for advanced operations
- `isAuthenticated()`: Check if user is authenticated and token is valid
- `handleCallback()`: Process OIDC callback after redirect
- `refreshToken()`: Refresh the access token using silent authentication
- `logout()`: Remove user from store and clear localStorage

## Using the Global Composable

The `useGlobal` composable provides a convenient logout method with automatic redirect:

```typescript
import { useGlobal } from 'oidc-login-plugin';

const { logout } = useGlobal();

// Logout and redirect to identityAppsUrl
logout();
```

This is useful for logout buttons in your application:

```vue
<template>
  <button @click="handleLogout">Logout</button>
</template>

<script setup>
import { useGlobal } from 'oidc-login-plugin';

const { logout } = useGlobal();

const handleLogout = () => {
  logout(); // Clears auth state and redirects to identity provider
};
</script>
```

## Router Guards

The plugin automatically sets up router guards for routes with `meta: { requiresAuth: true }`:

```typescript
{
  path: '/protected',
  component: ProtectedView,
  meta: { requiresAuth: true } // This route requires authentication
}
```

If a user tries to access a protected route without being authenticated, they will be redirected to the OIDC provider for login.

## Axios Interceptor

The plugin automatically adds an axios interceptor that:

1. Adds the access token to all requests as a Bearer token
2. Handles 401 responses by attempting to refresh the token
3. Redirects to the configured `redirectUrl` if token refresh fails

```typescript
// Your API calls will automatically include the token
const response = await axiosInstance.get('/api/user/profile');
```

## OidcCallback Component

The `OidcCallback` component handles the OIDC redirect callback with a built-in loading UI:

- Processes the authentication callback
- Displays a loading animation with "Signing in..." message
- Redirects to the home page after successful authentication
- Handles errors gracefully

The component uses Tailwind CSS classes for styling. Make sure Tailwind is configured in your project, or customize the component styling as needed.

## Features

✅ OIDC authentication using oidc-client-ts  
✅ Built-in callback component with loading UI  
✅ Automatic router guards for protected routes  
✅ Axios interceptor with automatic token refresh  
✅ Pinia store for user state management  
✅ Global logout composable with redirect  
✅ Configurable storage keys and redirect URLs  
✅ Debug mode for development  
✅ TypeScript support with full type definitions

## Troubleshooting

### Enable Debug Mode

Set `debug: true` in plugin options to see detailed logs:

```typescript
app.use(OidcPlugin, {
  // ... other options
  debug: true
});
```

### Common Issues

**Authentication not persisting**: Make sure the `storageKey` is consistent and localStorage is accessible.

**Token refresh failing**: Verify that your OIDC provider supports silent authentication and the `offline_access` scope is included.

**Router guards not working**: Ensure the router instance is passed to the plugin before mounting the app.

**Axios interceptor not adding token**: Verify the axios instance is passed to the plugin and the user is authenticated.
