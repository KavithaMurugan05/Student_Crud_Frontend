export const API_URL = import.meta.env.VITE_API_URL || "/api";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}
export async function waitForServer(onWaiting, maxWaitMs = 180000) {
  const start = Date.now();
  let notified = false;
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetchWithTimeout(`${API_URL}/health`, { cache: "no-store" }, 30000);
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === "UP") {
          return true;
        }
      }
    } catch {
    }
    if (!notified) {
      notified = true;
      if (onWaiting) onWaiting();
    }
    await sleep(3000);
  }
  return false;
}