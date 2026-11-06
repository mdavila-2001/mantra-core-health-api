import { ExternalOrderStock } from './application/pharmacy-orders/external-order-stock';
import { EXTERNAL_PHARMACY_SYSTEM_PORT } from './application/ports/external-pharmacy-system.port';
import { PharmacyExternalSystemAdapter } from './infrastructure/adapters/pharmacy-external-system.adapter';
import { ExternalSystemRepository } from './infrastructure/repositories/external-system.repository';
import { ConfigureExternalSystemUseCase } from './application/inventory-sync/configure-external-system.use-case';

export const EXTERNAL_SYSTEM_PROVIDERS = [
  ExternalSystemRepository,
  PharmacyExternalSystemAdapter,
  {
    provide: EXTERNAL_PHARMACY_SYSTEM_PORT,
    useExisting: PharmacyExternalSystemAdapter,
  },
  ConfigureExternalSystemUseCase,
  ExternalOrderStock,
];
