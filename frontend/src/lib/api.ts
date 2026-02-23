const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const sanitizeBaseUrl = (value: string): string => {
  const withoutTrailingSlash = value.replace(/\/+$/, "");
  // Biar tetap aman kalau user isi base URL sampai ".../api"
  return withoutTrailingSlash.replace(/\/api$/i, "");
};

const API_BASE_URL = rawApiBaseUrl
  ? sanitizeBaseUrl(rawApiBaseUrl)
  : "http://localhost:8080";

export const apiUrl = (path: string): string => {
  if (path.startsWith("/")) {
    return `${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}/${path}`;
};
