/**
 * Central API Configuration for Kharridlo Frontend
 * Defaults to the live Render FastAPI backend in production and cloud environments.
 */
export const DEFAULT_API_BASE_URL = "https://kharridlo-backend.onrender.com";

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL.trim();
    if (url) return url;
  }
  return DEFAULT_API_BASE_URL;
}
