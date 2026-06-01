import axios, { AxiosInstance } from "axios";
import { apiPath } from "@/src/lib/links";
import { toApiError } from "@/src/lib/errors";

export const apiBaseUrl = apiPath("");

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const apiErr = toApiError(err);
    if (apiErr.status === 401 && typeof window !== "undefined") {
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(apiErr);
  }
);

// Unwrap { success, message, data } → data
export async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}
