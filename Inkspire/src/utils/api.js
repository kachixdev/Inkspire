const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:9090/api"
    : "https://inkspire-izwl.onrender.com/api")
).replace(/\/+$/, "");
const API_ORIGIN = API_URL ? new URL(API_URL).origin : "";

export async function apiRequest(path, options = {}) {
  if (!API_URL) {
    throw new Error("Set VITE_API_URL to the deployed backend API URL.");
  }

  const headers = { ...options.headers };
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  let data = null;
  if (response.status !== 204) {
    const responseBody = await response.text();
    if (responseBody) {
      const contentType = response.headers.get('content-type') || '';
      data = contentType.includes('json')
        ? JSON.parse(responseBody)
        : responseBody;
    }
  }

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.message;
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return data;
}

export function getId(item) {
  return item?._id ?? item?.id;
}

export function getImageUrl(image) {
  if (!image || !image.startsWith("/")) {
    return image;
  }

  return `${API_ORIGIN}${image}`;
}

export function newestFirst(items) {
  return [...items].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  );
}

export function getAuthor(item) {
  return item?.author && typeof item.author === "object"
    ? item.author
    : null;
}

export function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function formatRelativeTime(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const secondsAgo = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (secondsAgo < 60) {
    return "just now";
  }

  const units = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["min", 60],
  ];

  const [unit, secondsPerUnit] = units.find(([, seconds]) => secondsAgo >= seconds);
  const amount = Math.floor(secondsAgo / secondsPerUnit);
  return `${amount} ${unit}${amount === 1 ? "" : "s"} ago`;
}

export function getCurrentUser() {
  try {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}
