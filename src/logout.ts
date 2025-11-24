import { useUserStore } from "./user";

let identityAppsUrl = "";

export const setIdentityAppsUrl = (url: string) => {
    identityAppsUrl = url;
};

export const useGlobal = () => {
    const userStore = useUserStore();

    const redirect = () => {
        if (identityAppsUrl) {
            location.href = identityAppsUrl;
        } else {
            console.warn("[oidc-login-plugin] identityAppsUrl not configured");
        }
    };

    const logout = () => {
        userStore.logout();
        redirect();
    };

    return {
        logout,
    };
};
