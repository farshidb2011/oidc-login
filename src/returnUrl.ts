const RETURN_URL_KEY = "oidc_login_return_url";

/** Only allow same-app relative paths (prevent open redirects). */
export function isSafeReturnUrl(path: string): boolean {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

export function saveReturnUrl(path: string): void {
  if (!isSafeReturnUrl(path)) return;
  try {
    sessionStorage.setItem(RETURN_URL_KEY, path);
  } catch {
    // sessionStorage may be unavailable (private mode / iframe restrictions)
  }
}

/**
 * Read and clear the saved post-login path.
 * Falls back to OIDC `user.state` (if it was a path string), then `/`.
 */
export function consumeReturnUrl(stateFallback?: unknown, fallback = "/"): string {
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(RETURN_URL_KEY);
    sessionStorage.removeItem(RETURN_URL_KEY);
  } catch {
    // ignore
  }

  if (stored && isSafeReturnUrl(stored)) return stored;

  if (typeof stateFallback === "string" && isSafeReturnUrl(stateFallback)) {
    return stateFallback;
  }

  return fallback;
}
