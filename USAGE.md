# OIDC Login Plugin - Usage Guide

## Installation

```bash
npm install oidc-login-plugin
# or
pnpm add oidc-login-plugin
```

## Setup

### 1. Create your router

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
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

**Note:** You don't need to manually add the callback route. The plugin automatically registers it based on your `redirect_uri` configuration.

### 2. Install the plugin

⚠️ **IMPORTANT**: Install the plugin BEFORE `app.use(router)` because it modifies the router.

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

// Install Pinia first
app.use(pinia);

// Install OIDC plugin BEFORE router
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

// Install router AFTER the plugin
app.use(router);

app.mount('#app');
```

## What the Plugin Does

When you install the plugin, it automatically:

1. **Registers the callback route** - Extracts the path from your `redirect_uri` and adds a route with a `beforeEnter` guard that handles the OIDC callback
2. **Sets up router guards** - Adds a global `beforeEach` guard that checks authentication for routes with `meta: { requiresAuth: true }`
3. **Configures axios interceptor** - Adds a response interceptor that:
   - Attaches the Bearer token to all requests
   - Handles 401 errors by attempting to refresh the token
   - Redirects to `redirectUrl` if refresh fails
4. **Initializes the user store** - Creates a Pinia store with the UserManager instance and authentication state

## Configuration Options

### `OidcConfig`

- `userManagerSettings` (required): OIDC UserManager settings from oidc-client-ts
  - `authority`: Your identity provider URL
  - `client_id`: Your application's client ID
  - `redirect_uri`: Where to redirect after login (e.g., 'http://localhost:3000/callback')
  - `post_logout_redirect_uri`: Where to redirect after logout
  - `response_type`: OAuth flow type (typically 'code')
  - `scope`: Requested scopes (e.g., 'openid profile email offline_access')
- `storageKey` (optional): localStorage key for storing the access token (default: 'authToken')
- `redirectUrl` (optional): URL to redirect on 401 errors (default: '/')

### `PluginOptions`

- `pinia` (optional but recommended): Pinia instance for state management
- `router` (optional but recommended): Vue Router instance for navigation guards
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

### Automatic Callback Route

The plugin automatically registers a callback route based on your `redirect_uri`. For example, if your `redirect_uri` is `http://localhost:3000/callback`, the plugin will:

1. Extract the path `/callback`
2. Check if a route with that path already exists
3. If not, add a new route with a `beforeEnter` guard that:
   - Calls `userStore.handleCallback()` to process the OIDC response
   - Redirects to the home page (`/`) after successful authentication
   - Handles errors gracefully

This means you don't need to manually add the callback route or use the `OidcCallback` component in your router configuration.

## Axios Interceptor

The plugin automatically adds a response interceptor to your axios instance that:

1. **Handles 401 errors**: When a request receives a 401 response, the interceptor:
   - Attempts to refresh the token using `userStore.refreshToken()`
   - Retries the original request with the new token
   - Implements a 30-second cooldown to prevent multiple simultaneous refresh attempts
2. **Redirects on failure**: If token refresh fails, it:
   - Calls `userStore.logout()` to clear authentication state
   - Redirects to the configured `redirectUrl`

**Note**: The interceptor does NOT automatically add the Bearer token to requests. You need to configure axios to include the token from localStorage:

```typescript
// Configure axios to include the token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken'); // Use your configured storageKey
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Your API calls will now include the token
const response = await axiosInstance.get('/api/user/profile');
```

## OidcCallback Component (Optional)

The plugin includes an optional `OidcCallback` component with a built-in loading UI that you can use if you prefer a visual callback page:

```typescript
import { OidcCallback } from 'oidc-login-plugin';

// Add to your router if you want a custom callback page
{
  path: '/callback',
  component: OidcCallback
}
```

The component:
- Processes the authentication callback using `userStore.handleCallback()`
- Displays a loading animation with "Signing in..." message
- Redirects to the home page after successful authentication
- Handles errors gracefully

The component uses Tailwind CSS classes for styling. Make sure Tailwind is configured in your project, or customize the component styling as needed.

**Note**: If you don't manually add this route, the plugin will still handle the callback automatically with a minimal route that has no UI.

## Features

✅ OIDC authentication using oidc-client-ts  
✅ Automatic callback route registration (no manual setup needed)  
✅ Optional callback component with loading UI  
✅ Automatic router guards for protected routes (`meta: { requiresAuth: true }`)  
✅ Axios interceptor with automatic token refresh on 401  
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

**Router guards not working**: Ensure the plugin is installed BEFORE `app.use(router)` and the router instance is passed to the plugin.

**Callback route not found**: The plugin automatically registers the callback route based on your `redirect_uri`. Make sure the `redirect_uri` in your configuration matches the URL your identity provider redirects to.

**Axios requests not including token**: The plugin's interceptor only handles 401 errors and token refresh. You need to manually configure a request interceptor to add the Bearer token to outgoing requests (see Axios Interceptor section above).

**Plugin installation order**: Always use the plugin BEFORE `app.use(router)`. The correct order is:
```typescript
app.use(pinia);
app.use(OidcPlugin, { ... });
app.use(router);
```
