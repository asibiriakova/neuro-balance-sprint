/**
 * Thin fetch wrapper the HTTP-backed services build on: base URL, bearer
 * auth-header injection, retry-once-on-401, and error normalization. This
 * is the frontend's "single, typed way to call the FastAPI backend" that
 * `_docs/tasks.md` (#4) calls for; `HttpSprintService`/`HttpPlanningService`
 * are the only callers.
 *
 * The app has no login screen yet (`_docs/tasks.md` #3), so there's no real
 * user to authenticate as. Until that lands, every page session bootstraps
 * itself against the backend's seeded demo user (see `DEMO_EMAIL`/
 * `DEMO_PASSWORD` in `backend/app/store.py`) and reuses the resulting
 * bearer token for the lifetime of the page. Swap `login()` for a real
 * auth flow once one exists.
 */

const env = import.meta.env as Record<string, string | undefined>;

const API_BASE_URL = env["VITE_API_BASE_URL"]?.replace(/\/+$/, "") ?? "http://localhost:8000/api";
const DEMO_EMAIL = env["VITE_DEMO_EMAIL"] ?? "demo@neurosprint.app";
const DEMO_PASSWORD = env["VITE_DEMO_PASSWORD"] ?? "sprint-demo-pw";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

let cachedToken: string | null = null;
let loginPromise: Promise<string> | null = null;

/** Logs in as the seeded demo user and caches the resulting bearer token. */
async function login(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  });
  if (!res.ok) {
    throw new ApiError(`Demo login failed (${res.status})`, res.status);
  }
  const body = (await res.json()) as TokenResponse;
  cachedToken = body.access_token;
  return cachedToken;
}

async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  loginPromise ??= login().finally(() => {
    loginPromise = null;
  });
  return loginPromise;
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.clone().json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
  } catch {
    /* body wasn't JSON (or had no `detail`); fall back to the status text */
  }
  return res.statusText || `Request failed (${res.status})`;
}

/**
 * Issues an authenticated JSON request against the backend. Retries once
 * with a freshly-issued token on 401 — tokens live in the backend's
 * in-memory store, so a backend restart silently invalidates any cached
 * one.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && !isRetry) {
    cachedToken = null;
    return apiRequest<T>(path, init, true);
  }
  if (!res.ok) {
    throw new ApiError(await parseErrorMessage(res), res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
