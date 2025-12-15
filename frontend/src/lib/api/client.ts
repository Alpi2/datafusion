import { getAuthHeader } from "../auth";

type RequestOptions = Omit<RequestInit, "body"> & { body?: any };

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request<T>(
  path: string,
  opts: RequestOptions = {},
  retries = 2
): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> | undefined),
    ...getAuthHeader(),
  };

  let body = opts.body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, { ...opts, headers, body });
    if (!res.ok) {
      const contentType = res.headers.get("content-type") || "";
      let txt = await res.text().catch(() => "");
      let parsedJson: any = null;
      if (contentType.includes("application/json")) {
        try {
          parsedJson = JSON.parse(txt || "{}");
        } catch (e) {
          parsedJson = null;
        }
      }

      const defaultUserMessage =
        res.status === 401
          ? "Your session has expired. Please sign in again."
          : "Server error. Please try again later.";

      const errorMessage =
        parsedJson?.error?.message || parsedJson?.message || txt || defaultUserMessage;
      const err: any = new Error(errorMessage || `HTTP ${res.status}`);
      err.status = res.status;
      // Prefer canonical error.code, fall back to top-level code
      err.code = parsedJson?.error?.code || parsedJson?.code || "internal_error";
      // userMessage: friendly string for UI
      err.userMessage = parsedJson?.error?.message || parsedJson?.message || defaultUserMessage;
      // include optional details if present
      err.details = parsedJson?.error?.details || parsedJson?.details;
      throw err;
    }
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json: any = await res.json();
      return (json.data ?? json) as T;
    }
    return (await res.text()) as unknown as T;
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 200 * (3 - retries)));
      return request(path, opts, retries - 1);
    }
    // normalize thrown error
    const out: any = err instanceof Error ? err : new Error("Unknown error");
    if (!out.userMessage) {
      out.userMessage = out.message || "An error occurred";
    }
    throw out;
  }
}

export const apiClient = {
  get: <T = any>(path: string) => request<T>(path, { method: "GET" }),
  post: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "POST", body }),
  put: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "PUT", body }),
  del: <T = any>(path: string) => request<T>(path, { method: "DELETE" }),
  rawRequest: request,
};

export default apiClient;
