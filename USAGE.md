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
  debug: true // optional, enables debug logging
});

app.mount('#app');
```

## Configuration Options

### `OidcConfig`

- `userManagerSettings` (required): OIDC UserManager settings
- `storageKey` (optional): localStorage key for token (default: 'authToken')
- `redirectUrl` (optional): URL to redirect on 401 errors (default: '/')

### `PluginOptions`

- `pinia` (optional): Pinia instance
- `router` (optional): Vue Router instance
- `axios` (optional): Axios instance
- `oidc` (required): OIDC configuration
- `debug` (optional): Enable debug logging

## Using the User Store

```typescript
import { useUserStore } from 'oidc-login-plugin';

const userStore = useUserStore();

// Check authentication
const isAuth = await userStore.isAuthenticated();

// Access user info
const user = userStore.user;

// Logout
userStore.logout();
```

## Features

✅ Export OidcCallback component for easy integration  
✅ Router guards for protected routes  
✅ Axios interceptor with automatic token refresh  
✅ Pinia store for user state  
✅ Configurable storage keys and paths  
✅ Built-in callback UI component with loading animation
