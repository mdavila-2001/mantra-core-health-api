import axios, { type AxiosInstance } from 'axios';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';

/**
 * Lo común a los adaptadores del sistema de cada farmacia (FAR-C9): un cliente
 * HTTP sin reintentos, con tiempo máximo, y la traducción de cualquier falla a
 * `ExternalCatalogUnavailableError` con su motivo.
 *
 * - 401 o 403: la clave fue rechazada (`AUTH_REJECTED`).
 * - Cualquier otra cosa (sin respuesta, tiempo agotado, 404, 5xx, una
 *   respuesta que no se entiende): no responde (`UNREACHABLE`).
 *
 * El detalle que queda en el error es para el log: método, ruta y estado.
 * Nunca la clave ni el cuerpo de la respuesta.
 */
export function createPharmacySystemHttp(
  baseUrl: string,
  timeoutMs: number,
  headers: Record<string, string>,
): AxiosInstance {
  return axios.create({
    baseURL: baseUrl,
    timeout: timeoutMs,
    headers,
    // Una redirección podría llevar la clave a otro host.
    maxRedirects: 0,
    // Solo se habla JSON; nada de seguir proxies del entorno con la clave.
    validateStatus: (status) => status >= 200 && status < 300,
  });
}

/** GET que devuelve el cuerpo o lanza el error del dominio con su motivo. */
export async function getJson(
  http: AxiosInstance,
  path: string,
  params?: Record<string, string>,
): Promise<unknown> {
  try {
    const response = await http.get<unknown>(path, { params });
    return response.data;
  } catch (error) {
    throw classifyFailure(error, path);
  }
}

export function classifyFailure(
  error: unknown,
  path: string,
): ExternalCatalogUnavailableError {
  if (!axios.isAxiosError(error)) {
    return new ExternalCatalogUnavailableError(`GET ${path} → unknown`);
  }
  const status = error.response?.status;
  if (status === 401 || status === 403) {
    return new ExternalCatalogUnavailableError(
      `GET ${path} → ${status}`,
      'AUTH_REJECTED',
    );
  }
  return new ExternalCatalogUnavailableError(
    `GET ${path} → ${status ?? error.code ?? 'network'}`,
  );
}

/** Lo que vino tiene que ser un objeto; si no, el sistema «no responde» bien. */
export function asRecord(
  value: unknown,
  what: string,
): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ExternalCatalogUnavailableError(`invalid ${what}`);
  }
  return value as Record<string, unknown>;
}

export function asArray(
  value: unknown,
  what: string,
): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    throw new ExternalCatalogUnavailableError(`invalid ${what}`);
  }
  return value.map((item) => asRecord(item, what));
}

export function asNonNegativeInt(value: unknown, what: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ExternalCatalogUnavailableError(`invalid ${what}`);
  }
  return value;
}

export function asText(value: unknown, what: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ExternalCatalogUnavailableError(`invalid ${what}`);
  }
  return value;
}

/** Un segmento de ruta con el código que cargó la farmacia, escapado. */
export function segment(value: string): string {
  return encodeURIComponent(value);
}
