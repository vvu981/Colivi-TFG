export interface IHttpClient {
  get<T>(path: string, queryParams?: Record<string, unknown>): Promise<T>;
}
