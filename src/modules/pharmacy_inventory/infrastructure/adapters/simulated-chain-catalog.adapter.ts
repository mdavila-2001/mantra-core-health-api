import type { AxiosInstance } from 'axios';
import type {
  ConnectedPharmacyCatalog,
  ExternalPrice,
  ExternalProduct,
  ExternalStockLine,
  PharmacySystemAccess,
} from '../../application/ports/external-pharmacy-catalog.port';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import {
  asArray,
  asNonNegativeInt,
  asRecord,
  asText,
  createPharmacySystemHttp,
  getJson,
  segment,
} from './pharmacy-system-http';

/** Tope de páginas que se recorren: una respuesta que nunca termina no cuelga el pedido. */
const MAX_PAGES = 50;
const PER_PAGE = '50';

/**
 * Adaptador de la **cadena simulada**: un formato a propósito distinto del
 * Estándar ALOVIDA (`mock-provider-server`, `simulated-chain`), para probar el
 * camino del adaptador antes de tener una cadena real. Traduce al modelo
 * interno:
 *
 * - la clave va en `Authorization: Bearer`;
 * - `sku` → código, `description` → nombre, `pack.label`/`pack.unit` →
 *   presentación y unidad, `on_hand.units` → cantidad,
 *   `price.amount_cents` → precio con decimales;
 * - todo viene en `data` y se recorren las páginas hasta `meta.total_pages`.
 */
export class SimulatedChainCatalogAdapter implements ConnectedPharmacyCatalog {
  private readonly http: AxiosInstance;
  private readonly base: string;

  constructor(access: PharmacySystemAccess) {
    this.http = createPharmacySystemHttp(access.baseUrl, access.timeoutMs, {
      Authorization: `Bearer ${access.apiKey}`,
      Accept: 'application/json',
    });
    this.base = `/chains/${segment(access.pharmacyCode)}`;
  }

  isConfigured(): boolean {
    return true;
  }

  async checkHealth(): Promise<void> {
    const body = asRecord(
      await getJson(this.http, `${this.base}/ping`),
      'ping',
    );
    if (body.ok !== true) {
      throw new ExternalCatalogUnavailableError('ping not ok');
    }
  }

  async listProducts(): Promise<ExternalProduct[]> {
    const rows = await this.allPages(`${this.base}/catalog`);
    return rows.map((row) => {
      const pack =
        row.pack === undefined ? undefined : asRecord(row.pack, 'pack');
      return {
        code: asText(row.sku, 'sku'),
        name: asText(row.description, 'description'),
        ...(typeof pack?.label === 'string'
          ? { presentation: pack.label }
          : {}),
        ...(typeof pack?.unit === 'string' ? { unitCode: pack.unit } : {}),
      };
    });
  }

  async stockForSite(siteCode: string): Promise<ExternalStockLine[]> {
    const rows = await this.allPages(
      `${this.base}/branches/${segment(siteCode)}/inventory`,
    );
    return rows.map((row) => ({
      code: asText(row.sku, 'sku'),
      quantity: asNonNegativeInt(
        asRecord(row.on_hand, 'on_hand').units,
        'units',
      ),
    }));
  }

  async listPrices(): Promise<ExternalPrice[]> {
    const rows = await this.allPages(`${this.base}/catalog/prices`);
    return rows.map((row) => {
      const price = asRecord(row.price, 'price');
      return {
        code: asText(row.sku, 'sku'),
        unitPrice: asNonNegativeInt(price.amount_cents, 'amount_cents') / 100,
        currency: asText(price.currency, 'currency'),
      };
    });
  }

  private async allPages(path: string): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const body = asRecord(
        await getJson(this.http, path, {
          page: String(page),
          per_page: PER_PAGE,
        }),
        'page',
      );
      rows.push(...asArray(body.data, 'row'));
      const meta = asRecord(body.meta, 'meta');
      const totalPages = asNonNegativeInt(meta.total_pages, 'total_pages');
      if (page >= totalPages) return rows;
    }
    throw new ExternalCatalogUnavailableError('too many pages');
  }
}
