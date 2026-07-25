<script setup lang="ts">
import { useUserStore } from './user';
import { consumeReturnUrl } from './returnUrl';

const userStore = useUserStore();
const isSilentIframe = window.parent !== window;

try {
  const result = await userStore.handleCallback();
  // Silent renew completes via postMessage; do not navigate the iframe SPA
  if (!isSilentIframe) {
    window.location.href = consumeReturnUrl(
      result && typeof result === 'object' && 'state' in result ? result.state : undefined
    );
  }
} catch (error) {
  console.error('[OidcCallback] Error during callback:', error);
  if (!isSilentIframe) {
    window.location.href = consumeReturnUrl();
  }
}
</script>

<template>
  <div
    class="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 via-purple-400 to-pink-400">
    <div class="flex flex-col items-center">
      <svg class="animate-spin h-16 w-16 text-white mb-6" xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24">
        <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <h1 class="text-white text-3xl font-bold mb-2">Signing in...</h1>
      <p class="text-white text-lg opacity-80">Please wait while we sign you in</p>
    </div>
  </div>
</template>
