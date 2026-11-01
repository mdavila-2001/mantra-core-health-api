import { Injectable } from '@nestjs/common';
import type {
  ConnectedPharmacyCatalog,
  PharmacyCatalogFactoryPort,
  PharmacySystemAccess,
} from '../../application/ports/external-pharmacy-catalog.port';
import type { PharmacySystemCode } from '../../domain/erp-connection/pharmacy-stock-mode';
import { AlovidaStandardCatalogAdapter } from './alovida-standard-catalog.adapter';
import { SimulatedChainCatalogAdapter } from './simulated-chain-catalog.adapter';

/**
 * Un adaptador por tipo de sistema, elegido por su `code`
 * (`integrations.external_providers.code`). Para sumar el de Hipermaxi cuando
 * llegue su documentación: su código en `PHARMACY_SYSTEM_CODES`, su fila de
 * proveedor y su clase acá.
 */
const ADAPTERS: Record<
  PharmacySystemCode,
  new (access: PharmacySystemAccess) => ConnectedPharmacyCatalog
> = {
  ALOVIDA_STANDARD: AlovidaStandardCatalogAdapter,
  SIMULATED_CHAIN: SimulatedChainCatalogAdapter,
};

@Injectable()
export class PharmacyCatalogFactory implements PharmacyCatalogFactoryPort {
  forAccess(access: PharmacySystemAccess): ConnectedPharmacyCatalog {
    const Adapter = ADAPTERS[access.systemCode];
    return new Adapter(access);
  }
}
