import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const AUTH_LOGOUT_EVENT = "auth:logout";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) throw new Error("No refresh token available");

  // Deduplicate concurrent refresh attempts — if several requests 401 at
  // once, only one refresh call should hit the server.
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${api.defaults.baseURL}/users/token/refresh/`, { refresh })
      .then((res) => {
        const access = res.data.access as string;
        localStorage.setItem("access_token", access);
        return access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    const isAuthEndpoint =
      originalRequest?.url?.includes("/signin/") ||
      originalRequest?.url?.includes("/signup/") ||
      originalRequest?.url?.includes("/token/refresh/");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !isAuthEndpoint
    ) {
      originalRequest._retried = true;
      try {
        const newAccess = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
      }
    }

    return Promise.reject(error);
  },
);
