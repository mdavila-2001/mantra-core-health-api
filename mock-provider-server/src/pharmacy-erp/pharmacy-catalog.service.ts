import { timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { MOCK_ENV } from '../common/env.module';
import type { MockProviderEnv } from '../common/env';
import { rollFailure, simulatedDelay } from '../common/simulate';
import { ERP_PRODUCTS, type ErpProduct } from './pharmacy-erp.data';
import { stockWindow, unitPriceCents, windowedQuantity } from './stock-window';

/** Reloj inyectable: las pruebas fijan la hora para moverse entre ventanas. */
export const PHARMACY_ERP_CLOCK = Symbol('PHARMACY_ERP_CLOCK');
export type PharmacyErpClock = () => Date;

export interface StockSnapshot {
  pharmacyCode: string;
  siteCode: string;
  asOf: Date;
  windowStart: Date;
  windowEnd: Date;
  items: { code: string; quantity: number }[];
}

export interface PriceLine {
  code: string;
  unitPriceCents: number;
}

/**
 * El sistema de una farmacia como lo ve un tercero: clave propia, catálogo,
 * stock por sucursal que cambia cada cinco minutos y precios. Los dos formatos
 * (Estándar ALOVIDA y cadena simulada) son solo dos maneras de exponer esto.
 */
@Injectable()
export class PharmacyCatalogService {
  constructor(
    @Inject(MOCK_ENV) private readonly env: MockProviderEnv,
    @Inject(PHARMACY_ERP_CLOCK) private readonly clock: PharmacyErpClock,
  ) {}

  /**
   * 401 si la farmacia no tiene clave en el simulador o si la clave no es la
   * suya. El mismo mensaje en los dos casos, como haría un tercero.
   */
  authenticate(pharmacyCode: string, provided: string | undefined): void {
    const expected = (this.env.pharmacyKeys ?? {})[pharmacyCode];
    if (
      expected === undefined ||
      provided === undefined ||
      !sameSecret(expected, provided)
    ) {
      throw new UnauthorizedException('Clave inválida para esta farmacia');
    }
  }

  async products(): Promise<ErpProduct[]> {
    await this.simulate();
    return ERP_PRODUCTS.map((product) => ({ ...product }));
  }

  async stock(
    pharmacyCode: string,
    siteCode: string,
    codes?: readonly string[],
  ): Promise<StockSnapshot> {
    const site = siteCode.trim();
    if (site === '') throw new BadRequestException('siteCode es obligatorio');
    await this.simulate();
    const now = this.clock();
    const window = stockWindow(now);
    const wanted = codes && codes.length > 0 ? new Set(codes) : null;
    return {
      pharmacyCode,
      siteCode: site,
      asOf: now,
      windowStart: window.start,
      windowEnd: window.end,
      items: ERP_PRODUCTS.filter(
        (p) => wanted === null || wanted.has(p.code),
      ).map((product) => ({
        code: product.code,
        quantity: windowedQuantity(
          pharmacyCode,
          site,
          product.code,
          window.index,
        ),
      })),
    };
  }

  async prices(pharmacyCode: string): Promise<PriceLine[]> {
    await this.simulate();
    return ERP_PRODUCTS.map((product) => ({
      code: product.code,
      unitPriceCents: unitPriceCents(pharmacyCode, product.code),
    }));
  }

  now(): Date {
    return this.clock();
  }

  private async simulate(): Promise<void> {
    await simulatedDelay(this.env.simulatedLatencyMs);
    if (rollFailure(this.env.pharmacyErpFailureRate ?? 0)) {
      throw new ServiceUnavailableException('SIMULATED_ERP_UNAVAILABLE');
    }
  }
}

function sameSecret(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}
