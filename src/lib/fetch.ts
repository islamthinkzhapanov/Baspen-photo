export async function fetchJson<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}
