import { Injectable } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import type {
  ExternalPharmacyCatalogPort,
  ExternalProduct,
  ExternalStockLine,
} from '../../application/ports/external-pharmacy-catalog.port';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import { loadPharmacyErpEnv, type PharmacyErpEnv } from './pharmacy-erp.env';

/**
 * Adaptador HTTP del sistema de la farmacia externa: `GET /pharmacy-erp/products`
 * y `GET /pharmacy-erp/stock?siteCode=&pharmacyCode=`, con `X-Api-Key`. En local apunta al
 * simulador de `mock-provider-server/`.
 *
 * Valida la forma de cada respuesta antes de devolverla: una respuesta que no
 * se entiende es lo mismo que un sistema caído, y no se convierte en stock.
 */
@Injectable()
export class HttpExternalPharmacyCatalogAdapter implements ExternalPharmacyCatalogPort {
  private readonly cfg: PharmacyErpEnv;
  private readonly http: AxiosInstance | null;

  constructor() {
    this.cfg = loadPharmacyErpEnv();
    this.http =
      this.cfg.baseUrl === ''
        ? null
        : axios.create({
            baseURL: this.cfg.baseUrl,
            timeout: this.cfg.timeoutMs,
            headers: this.cfg.apiKey ? { 'X-Api-Key': this.cfg.apiKey } : {},
          });
  }

  isConfigured(): boolean {
    return this.http !== null;
  }

  async listProducts(): Promise<ExternalProduct[]> {
    const body = await this.get('/pharmacy-erp/products');
    const items = itemsOf(body);
    return items.map((item) => {
      if (typeof item.code !== 'string' || typeof item.name !== 'string') {
        throw new ExternalCatalogUnavailableError('invalid product');
      }
      return {
        code: item.code,
        name: item.name,
        presentation:
          typeof item.presentation === 'string' ? item.presentation : undefined,
        unitCode: typeof item.unitCode === 'string' ? item.unitCode : undefined,
      };
    });
  }

  async stockForSite(
    siteCode: string,
    pharmacyCode?: string,
  ): Promise<ExternalStockLine[]> {
    const body = await this.get('/pharmacy-erp/stock', {
      siteCode,
      ...(pharmacyCode ? { pharmacyCode } : {}),
    });
    return itemsOf(body).map((item) => {
      const quantity = item.quantity;
      if (
        typeof item.code !== 'string' ||
        typeof quantity !== 'number' ||
        !Number.isInteger(quantity) ||
        quantity < 0
      ) {
        throw new ExternalCatalogUnavailableError('invalid stock line');
      }
      return { code: item.code, quantity };
    });
  }

  private async get(
    path: string,
    params?: Record<string, string>,
  ): Promise<unknown> {
    if (!this.http) {
      throw new ExternalCatalogUnavailableError('not configured');
    }
    try {
      const response = await this.http.get<unknown>(path, { params });
      return response.data;
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? (error.response?.status ?? error.code ?? 'network')
        : 'unknown';
      throw new ExternalCatalogUnavailableError(`GET ${path} → ${status}`);
    }
  }
}

function itemsOf(body: unknown): Record<string, unknown>[] {
  const items =
    typeof body === 'object' && body !== null
      ? (body as { items?: unknown }).items
      : undefined;
  if (!Array.isArray(items)) {
    throw new ExternalCatalogUnavailableError('invalid body');
  }
  return items.map((item) => {
    if (typeof item !== 'object' || item === null) {
      throw new ExternalCatalogUnavailableError('invalid item');
    }
    return item as Record<string, unknown>;
  });
}
