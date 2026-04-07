// Shared API helpers for frontend requests.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiFetch(path, options = {}) {
  const { token, headers, ...rest } = options;
  const finalHeaders = {
    ...(headers || {}),
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  if (rest.body && !("Content-Type" in finalHeaders)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });
}

export async function apiFetchJson(path, options = {}) {
  const response = await apiFetch(path, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || options.errorMessage || "Request failed.");
  }

  return payload;
}
