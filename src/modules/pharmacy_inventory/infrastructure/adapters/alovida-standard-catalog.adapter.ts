import type { AxiosInstance } from 'axios';
import type {
  ConnectedPharmacyCatalog,
  ExternalPrice,
  ExternalProduct,
  ExternalStockLine,
  PharmacySystemAccess,
} from '../../application/ports/external-pharmacy-catalog.port';
import {
  asArray,
  asNonNegativeInt,
  asRecord,
  asText,
  createPharmacySystemHttp,
  getJson,
  segment,
} from './pharmacy-system-http';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';

/**
 * Adaptador del **Estándar ALOVIDA**: el contrato que publica la API en
 * `docs/integrations/pharmacy-standard.openapi.yaml`. Cualquier farmacia que
 * lo cumpla se conecta solo con el formulario.
 *
 * Clave en `X-Api-Key`; rutas bajo `/v1/pharmacies/{código de farmacia}`.
 */
export class AlovidaStandardCatalogAdapter implements ConnectedPharmacyCatalog {
  private readonly http: AxiosInstance;
  private readonly base: string;

  constructor(access: PharmacySystemAccess) {
    this.http = createPharmacySystemHttp(access.baseUrl, access.timeoutMs, {
      'X-Api-Key': access.apiKey,
      Accept: 'application/json',
    });
    this.base = `/v1/pharmacies/${segment(access.pharmacyCode)}`;
  }

  isConfigured(): boolean {
    return true;
  }

  async checkHealth(): Promise<void> {
    const body = asRecord(
      await getJson(this.http, `${this.base}/health`),
      'health',
    );
    if (body.status !== 'OK') {
      throw new ExternalCatalogUnavailableError('health not OK');
    }
  }

  async listProducts(): Promise<ExternalProduct[]> {
    const body = asRecord(
      await getJson(this.http, `${this.base}/products`),
      'products',
    );
    return asArray(body.items, 'product').map((item) => ({
      code: asText(item.code, 'product code'),
      name: asText(item.name, 'product name'),
      ...(typeof item.presentation === 'string'
        ? { presentation: item.presentation }
        : {}),
      ...(typeof item.unitCode === 'string' ? { unitCode: item.unitCode } : {}),
    }));
  }

  async stockForSite(siteCode: string): Promise<ExternalStockLine[]> {
    const body = asRecord(
      await getJson(this.http, `${this.base}/sites/${segment(siteCode)}/stock`),
      'stock',
    );
    return asArray(body.items, 'stock line').map((item) => ({
      code: asText(item.code, 'stock code'),
      quantity: asNonNegativeInt(item.quantity, 'stock quantity'),
    }));
  }

  async listPrices(): Promise<ExternalPrice[]> {
    const body = asRecord(
      await getJson(this.http, `${this.base}/prices`),
      'prices',
    );
    const currency = asText(body.currency, 'currency');
    return asArray(body.items, 'price').map((item) => {
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        throw new ExternalCatalogUnavailableError('invalid unit price');
      }
      return {
        code: asText(item.code, 'price code'),
        unitPrice: item.unitPrice,
        currency,
      };
    });
  }
}
