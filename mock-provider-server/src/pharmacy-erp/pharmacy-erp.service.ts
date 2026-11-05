import { createHash } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MOCK_ENV } from '../common/env.module';
import type { MockProviderEnv } from '../common/env';
import { rollFailure, simulatedDelay } from '../common/simulate';
import { ERP_PRODUCTS } from './pharmacy-erp.data';
import type {
  ErpProductsResponseDto,
  ErpStockResponseDto,
} from './pharmacy-erp.dto';

/** Tope de unidades por producto y sucursal. */
const MAX_QUANTITY = 40;

/**
 * Emula el sistema de gestión (ERP) de una farmacia externa: su catálogo con
 * códigos propios y el stock de cada sucursal.
 *
 * El stock es determinista: sale de un hash de la farmacia (`pharmacyCode`),
 * la sucursal (`siteCode`) y el código de producto, así que la misma sucursal
 * da siempre las mismas cantidades (dos sincronizaciones seguidas no cambian
 * nada), otra sucursal da otras y dos farmacias cuyas sedes se llaman igual
 * tampoco comparten stock. Algunos productos quedan en 0, como en una farmacia
 * de verdad.
 */
@Injectable()
export class PharmacyErpService {
  private readonly logger = new Logger(PharmacyErpService.name);

  constructor(@Inject(MOCK_ENV) private readonly env: MockProviderEnv) {}

  async products(): Promise<ErpProductsResponseDto> {
    await this.simulate();
    return { items: ERP_PRODUCTS.map((product) => ({ ...product })) };
  }

  async stock(
    siteCode: string | undefined,
    pharmacyCode?: string,
  ): Promise<ErpStockResponseDto> {
    const code = siteCode?.trim() ?? '';
    if (code === '') {
      throw new BadRequestException('siteCode es obligatorio');
    }
    const pharmacy = pharmacyCode?.trim() ?? '';
    await this.simulate();
    this.logger.log(`stock ${pharmacy === '' ? '' : `${pharmacy}/`}${code}`);
    return {
      siteCode: code,
      ...(pharmacy === '' ? {} : { pharmacyCode: pharmacy }),
      asOf: new Date().toISOString(),
      items: ERP_PRODUCTS.map((product) => ({
        code: product.code,
        quantity: deterministicQuantity(code, product.code, pharmacy),
      })),
    };
  }

  private async simulate(): Promise<void> {
    await simulatedDelay(this.env.simulatedLatencyMs);
    if (rollFailure(this.env.pharmacyErpFailureRate ?? 0)) {
      throw new ServiceUnavailableException('SIMULATED_ERP_UNAVAILABLE');
    }
  }
}

/**
 * 0…40 a partir de SHA-256(farmacia | siteCode | código); uno de cada cinco,
 * en 0. Sin farmacia, SHA-256(siteCode | código): lo que daba antes, para quien
 * llame sin ella.
 */
export function deterministicQuantity(
  siteCode: string,
  code: string,
  pharmacyCode = '',
): number {
  const seed =
    pharmacyCode === ''
      ? `${siteCode}|${code}`
      : `${pharmacyCode}|${siteCode}|${code}`;
  const digest = createHash('sha256').update(seed).digest();
  if (digest.readUInt8(0) % 5 === 0) return 0;
  return 1 + (digest.readUInt16BE(1) % MAX_QUANTITY);
}
