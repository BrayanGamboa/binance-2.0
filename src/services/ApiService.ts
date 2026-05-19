export class ApiService {
  readonly #baseUrl: string;
  readonly #defaultHeaders: Record<string, string>;

  constructor(baseUrl = '', defaultHeaders: Record<string, string> = {}) {
    this.#baseUrl = baseUrl;
    this.#defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  #buildUrl(endpoint: string, params: Record<string, unknown> = {}): string {
    const url = new URL(`${this.#baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    return url.toString();
  }

  async #request<T>(
    method: string,
    endpoint: string,
    {
      params = {},
      body,
      headers = {},
    }: {
      params?: Record<string, unknown>;
      body?: unknown;
      headers?: Record<string, string>;
    } = {},
  ): Promise<T> {
    const url = this.#buildUrl(endpoint, params);
    const options: RequestInit = {
      method,
      headers: { ...this.#defaultHeaders, ...headers },
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `HTTP ${response.status} ${response.statusText}${text ? `: ${text}` : ''}`,
      );
    }

    return response.json() as Promise<T>;
  }

  get<T = unknown>(endpoint: string, params: Record<string, unknown> = {}, headers: Record<string, string> = {}): Promise<T> {
    return this.#request<T>('GET', endpoint, { params, headers });
  }

  post<T = unknown>(endpoint: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
    return this.#request<T>('POST', endpoint, { body, headers });
  }

  put<T = unknown>(endpoint: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
    return this.#request<T>('PUT', endpoint, { body, headers });
  }

  delete<T = unknown>(endpoint: string, headers: Record<string, string> = {}): Promise<T> {
    return this.#request<T>('DELETE', endpoint, { headers });
  }
}
