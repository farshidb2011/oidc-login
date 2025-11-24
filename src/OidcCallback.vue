<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from './user';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

onMounted(async () => {
  try {
    await userStore.handleCallback();
    await new Promise(resolve => setTimeout(resolve, 200));
    const isAuth = await userStore.isAuthenticated();
    if (isAuth && userStore.user) {
      await router.replace('/');
    } else {
      await router.replace('/');
    }
  } catch (error) {
    console.error('[OidcCallback] Error during callback:', error);
    await router.replace('/');
  }
});
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
