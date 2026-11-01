import { lookup as dnsLookup } from 'node:dns';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { BlockList, isIP, type LookupFunction } from 'node:net';
import axios, { type AxiosInstance } from 'axios';
import type {
  ExternalPharmacyCatalogPort,
  ExternalProduct,
  ExternalStockLine,
} from '../../application/ports/external-pharmacy-catalog.port';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import type { ExternalSystemConfig } from '../../domain/sync/external-system';

/** Tope de páginas que se recorren de un listado paginado. */
const MAX_PAGES = 200;
/** Tamaño de página que se le pide a la cadena (su máximo). */
const CHAIN_PER_PAGE = 50;
/** Tope de cada respuesta: el sistema lo controla la farmacia. */
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;
/** Tope de filas de un listado, sumando todas sus páginas. */
const MAX_ROWS = 20_000;

/**
 * Rangos que nunca se llaman en producción, aunque el nombre esté en la lista
 * de hosts: loopback, privados, link-local (metadatos de la nube), CGNAT,
 * multicast y reservados, en IPv4 e IPv6.
 */
const FORBIDDEN_RANGES = (() => {
  const list = new BlockList();
  for (const [net, prefix] of [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4],
  ] as const) {
    list.addSubnet(net, prefix, 'ipv4');
  }
  for (const [net, prefix] of [
    ['::', 128],
    ['::1', 128],
    ['fc00::', 7],
    ['fe80::', 10],
    ['ff00::', 8],
  ] as const) {
    list.addSubnet(net, prefix, 'ipv6');
  }
  return list;
})();

/** Si una IP cae en un rango que no se llama. */
export function isForbiddenAddress(address: string): boolean {
  // IPv4 mapeada en IPv6 (`::ffff:127.0.0.1`): vale lo que vale su IPv4.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (mapped) return isForbiddenAddress(mapped[1]);
  const family = isIP(address);
  if (family === 0) return true;
  return FORBIDDEN_RANGES.check(address, family === 6 ? 'ipv6' : 'ipv4');
}

/**
 * `lookup` que resuelve y rechaza las IP prohibidas **al conectar**: la IP que
 * se valida es la misma a la que se conecta, así un nombre permitido que
 * resuelve a una dirección interna (DNS rebinding) no pasa.
 */
const guardedLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, '', 0);
    const list = addresses;
    const bad = list.find((entry) => isForbiddenAddress(entry.address));
    if (bad || list.length === 0) {
      return callback(
        Object.assign(new Error('address not allowed'), {
          code: 'EADDRNOTALLOWED',
        }),
        '',
        0,
      );
    }
    if (options.all) return callback(null, list, 0);
    return callback(null, list[0].address, list[0].family);
  });
};

/** Opciones comunes de los dos clientes. */
function httpOptions(timeoutMs: number) {
  const production = process.env.NODE_ENV === 'production';
  return {
    timeout: timeoutMs,
    maxRedirects: 0,
    maxContentLength: MAX_RESPONSE_BYTES,
    maxBodyLength: MAX_RESPONSE_BYTES,
    // Fuera de producción el simulador vive en 127.0.0.1 o en la red de compose.
    ...(production
      ? {
          httpAgent: new HttpAgent({ lookup: guardedLookup }),
          httpsAgent: new HttpsAgent({ lookup: guardedLookup }),
        }
      : {}),
  };
}

/**
 * El cliente del sistema de una farmacia, según su formato (FAR-C9 · C9-3).
 *
 * Cada uno lee su formato y devuelve lo mismo que el sistema del servidor
 * (`HttpExternalPharmacyCatalogAdapter`): la sincronización no sabe con quién
 * habla. Validan la forma de cada respuesta: lo que no se entiende es lo mismo
 * que un sistema caído y no se convierte en stock.
 *
 * Ni la clave ni la dirección llegan a un mensaje de error: el detalle dice el
 * camino relativo y el código de respuesta.
 *
 * @param config - Formato, dirección y código de la farmacia en ese sistema.
 * @param apiKey - Clave de la farmacia, ya descifrada.
 * @param timeoutMs - Tope de cada llamada.
 */
export function createExternalSystemClient(
  config: ExternalSystemConfig,
  apiKey: string,
  timeoutMs: number,
): ExternalPharmacyCatalogPort {
  switch (config.format) {
    case 'ALOVIDA_STANDARD':
      return new AlovidaStandardClient(config, apiKey, timeoutMs);
    case 'SIMULATED_CHAIN':
      return new SimulatedChainClient(config, apiKey, timeoutMs);
  }
}

/** Una llamada `GET` que solo puede fallar con el error de dominio. */
async function getJson(
  http: AxiosInstance,
  path: string,
  params?: Record<string, string | number>,
): Promise<unknown> {
  try {
    const response = await http.get<unknown>(path, { params });
    return response.data;
  } catch (error) {
    const status = axios.isAxiosError(error)
      ? (error.response?.status ?? error.code ?? 'network')
      : 'unknown';
    throw new ExternalCatalogUnavailableError(`GET ${path} → ${status}`);
  }
}

function objectOf(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ExternalCatalogUnavailableError(`invalid ${what}`);
  }
  return value as Record<string, unknown>;
}

function arrayOf(value: unknown, what: string): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    throw new ExternalCatalogUnavailableError(`invalid ${what}`);
  }
  return value.map((item) => objectOf(item, what));
}

function quantityOf(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ExternalCatalogUnavailableError('invalid stock line');
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/**
 * Estándar ALOVIDA: `{base}/v1/pharmacies/{farmacia}/…`, clave en `X-Api-Key`.
 * El código de farmacia del sistema es el de la configuración; el de la
 * plataforma que pasa la sincronización no se usa.
 */
class AlovidaStandardClient implements ExternalPharmacyCatalogPort {
  private readonly http: AxiosInstance;
  private readonly prefix: string;

  constructor(config: ExternalSystemConfig, apiKey: string, timeoutMs: number) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      ...httpOptions(timeoutMs),
      headers: { 'X-Api-Key': apiKey },
    });
    this.prefix = `/v1/pharmacies/${encodeURIComponent(config.externalPharmacyCode)}`;
  }

  isConfigured(): boolean {
    return true;
  }

  async checkHealth(): Promise<void> {
    await getJson(this.http, `${this.prefix}/health`);
  }

  async listProducts(): Promise<ExternalProduct[]> {
    const body = objectOf(
      await getJson(this.http, `${this.prefix}/products`),
      'body',
    );
    return arrayOf(body.items, 'product').map((item) => {
      if (typeof item.code !== 'string' || typeof item.name !== 'string') {
        throw new ExternalCatalogUnavailableError('invalid product');
      }
      return {
        code: item.code,
        name: item.name,
        presentation: optionalString(item.presentation),
        unitCode: optionalString(item.unitCode),
      };
    });
  }

  async stockForSite(siteCode: string): Promise<ExternalStockLine[]> {
    const body = objectOf(
      await getJson(
        this.http,
        `${this.prefix}/sites/${encodeURIComponent(siteCode)}/stock`,
      ),
      'body',
    );
    return arrayOf(body.items, 'stock line').map((item) => {
      if (typeof item.code !== 'string') {
        throw new ExternalCatalogUnavailableError('invalid stock line');
      }
      return { code: item.code, quantity: quantityOf(item.quantity) };
    });
  }
}

/**
 * Cadena simulada: `{base}/chains/{cadena}/…`, `Authorization: Bearer`, todo en
 * `data` y paginado con `meta.total_pages`. Se recorren todas las páginas; un
 * listado que no termina dentro del tope se trata como sistema caído.
 */
class SimulatedChainClient implements ExternalPharmacyCatalogPort {
  private readonly http: AxiosInstance;
  private readonly prefix: string;

  constructor(config: ExternalSystemConfig, apiKey: string, timeoutMs: number) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      ...httpOptions(timeoutMs),
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    this.prefix = `/chains/${encodeURIComponent(config.externalPharmacyCode)}`;
  }

  isConfigured(): boolean {
    return true;
  }

  async checkHealth(): Promise<void> {
    const body = objectOf(
      await getJson(this.http, `${this.prefix}/ping`),
      'body',
    );
    if (body.ok !== true) {
      throw new ExternalCatalogUnavailableError('ping not ok');
    }
  }

  async listProducts(): Promise<ExternalProduct[]> {
    const rows = await this.allPages(`${this.prefix}/catalog`);
    return rows.map((row) => {
      if (typeof row.sku !== 'string' || typeof row.description !== 'string') {
        throw new ExternalCatalogUnavailableError('invalid product');
      }
      const pack =
        typeof row.pack === 'object' && row.pack !== null
          ? (row.pack as Record<string, unknown>)
          : {};
      return {
        code: row.sku,
        name: row.description,
        presentation: optionalString(pack.label),
        unitCode: optionalString(pack.unit),
      };
    });
  }

  async stockForSite(siteCode: string): Promise<ExternalStockLine[]> {
    const rows = await this.allPages(
      `${this.prefix}/branches/${encodeURIComponent(siteCode)}/inventory`,
    );
    return rows.map((row) => {
      const onHand = objectOf(row.on_hand, 'stock line');
      if (typeof row.sku !== 'string') {
        throw new ExternalCatalogUnavailableError('invalid stock line');
      }
      return { code: row.sku, quantity: quantityOf(onHand.units) };
    });
  }

  private async allPages(path: string): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const body = objectOf(
        await getJson(this.http, path, { page, per_page: CHAIN_PER_PAGE }),
        'body',
      );
      for (const row of arrayOf(body.data, 'row')) {
        if (rows.length >= MAX_ROWS) {
          throw new ExternalCatalogUnavailableError('too many rows');
        }
        rows.push(row);
      }
      const meta = objectOf(body.meta, 'meta');
      const totalPages = meta.total_pages;
      if (
        typeof totalPages !== 'number' ||
        !Number.isInteger(totalPages) ||
        totalPages < 1
      ) {
        throw new ExternalCatalogUnavailableError('invalid meta');
      }
      if (page >= totalPages) return rows;
    }
    throw new ExternalCatalogUnavailableError('too many pages');
  }
}
