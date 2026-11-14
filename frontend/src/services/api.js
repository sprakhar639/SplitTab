const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Can't reach the server. Check that the backend is running on port 3000.",
      0,
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Let AuthContext drop the user when the Redis session has expired.
    if (response.status === 401) {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    throw new ApiError(
      data.message || `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return data;
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export default api;
