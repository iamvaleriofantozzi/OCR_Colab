const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const RETRY_STATUS_CODES = new Set([429, 500, 503]);
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  input: RequestInfo,
  init?: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  const url = typeof input === 'string' && input.startsWith('http') ? input : `${API_URL}${input}`;
  try {
    const res = await fetch(url, init);
    if (RETRY_STATUS_CODES.has(res.status) && retries > 0) {
      const delay = BASE_DELAY * (MAX_RETRIES - retries + 1);
      await sleep(delay);
      return fetchWithRetry(input, init, retries - 1);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      const delay = BASE_DELAY * (MAX_RETRIES - retries + 1);
      await sleep(delay);
      return fetchWithRetry(input, init, retries - 1);
    }
    throw err;
  }
}
