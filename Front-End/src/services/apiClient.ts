const BASE_URL = typeof window !== 'undefined' 
  ? '/qpr/api' 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  
  const headers: Record<string, string> = {};
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorJson.detail || errorMessage;
    } catch (e) {
      if (errorText && errorText.trim().length > 0) {
        // Strip HTML tags if HTML error page returned by proxy/server
        const cleanText = errorText.replace(/<[^>]*>/g, '').trim().slice(0, 150);
        if (cleanText) {
          errorMessage = `API Error ${response.status}: ${cleanText}`;
        }
      }
    }
    console.warn(`[apiClient Error ${response.status}] ${path}:`, errorMessage);
    throw new Error(errorMessage);
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
