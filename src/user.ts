import { defineStore } from 'pinia';
import { ref } from 'vue';
import { User, UserManager, UserManagerSettings } from 'oidc-client-ts';

interface OidcConfig {
    userManagerSettings: UserManagerSettings;
    storageKey?: string;
    redirectUrl?: string;
}

let oidcConfig: OidcConfig | null = null;

export const setOidcConfig = (config: OidcConfig) => {
    oidcConfig = {
        userManagerSettings: config.userManagerSettings,
        storageKey: config.storageKey || 'authToken',
        redirectUrl: config.redirectUrl || '/'
    };
};

export const getOidcConfig = () => {
    if (!oidcConfig) {
        throw new Error('OIDC config not initialized.');
    }
    return oidcConfig;
};

export interface UserStoreState {
    user: User | null;
    oidc: UserManager | null;
    handleCallback: () => Promise<void>;
    refreshToken: () => Promise<void>;
    logout: () => void;
    isAuthenticated: () => Promise<boolean>;
}

export const useUserStore = defineStore('user', (): UserStoreState => {
    if (!oidcConfig) {
        throw new Error('OIDC config not initialized. Make sure to install the plugin first.');
    }

    const user = ref<User | null>(null);
    const managerInstance = ref<UserManager | null>(null);
    const isHandlingCallback = ref(false);

    const setUser = (u: User | null) => {
        user.value = u;
        if (u) localStorage.setItem(oidcConfig!.storageKey as string, u.access_token);
    };

    const handleCallback = async () => {
        isHandlingCallback.value = true;
        try {
            const u = await managerInstance.value?.signinRedirectCallback();
            setUser(u || null);
            // Ensure state is fully persisted before resolving
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            console.error('SignIn callback error : ', error);
            throw error;
        } finally {
            isHandlingCallback.value = false;
        }
    };

    const refreshToken = async () => {
        if (!user.value) throw new Error('User not found');
        try {
            const u = await managerInstance.value?.signinSilent();
            if (u) setUser(u);
        } catch (error) {
            console.error('Refresh token error : ', error);
            throw error;
        }
    };

    const isAuthenticated = async () => {
        // Wait for any pending callback handling to complete
        while (isHandlingCallback.value) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        try {
            const u = await managerInstance.value?.getUser();
            if (u) {
                user.value = u;

                return !(!user.value?.expires_at || Date.now() >= user.value.expires_at * 1000);
            }
            return false;
        } catch (error) {
            return false;
        }
    };

    const logout = () => {
        managerInstance.value?.removeUser();
        localStorage.removeItem(oidcConfig!.storageKey as string);
    };

    managerInstance.value = new UserManager(oidcConfig!.userManagerSettings);

    managerInstance.value?.getUser().then(setUser);

    managerInstance.value?.events.addUserLoaded(setUser);

    return {
        user: user as any,
        oidc: managerInstance as any,
        handleCallback,
        refreshToken,
        logout,
        isAuthenticated
    };
});
