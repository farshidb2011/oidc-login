interface ImportMetaEnv {
    readonly VITE_AUTHORITY: string;
    readonly VITE_CLIENT_ID: string;
    readonly VITE_REDIRECT_URI: string;
    readonly VITE_POST_LOGOUT_REDIRECT_URI: string;
    readonly VITE_API_RESOURCE_OIDC: string;
    readonly VITE_IDENTITY_APPS: string;
}

interface ImportMeta {
    env: ImportMetaEnv;
}
