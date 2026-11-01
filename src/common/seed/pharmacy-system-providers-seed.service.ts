import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ExternalProviders } from '../../modules/integrations/entities';
import { INTEG } from '../../modules/integrations/integrations.concepts';
import { deterministicId } from '../constants/concepts';

/**
 * Los tipos de sistema con que una farmacia puede conectar su API (FAR-C9):
 * una fila de `integrations.external_providers` por tipo, elegida por su
 * `code`. La dirección de cada farmacia va en su conexión, no acá: `base_url`
 * queda vacío.
 *
 * Para sumar Hipermaxi cuando llegue su documentación: su fila acá y su
 * adaptador en `pharmacy_inventory`.
 */
export const PHARMACY_SYSTEM_PROVIDERS = [
  {
    id: deterministicId('seed:integrations-provider:pharmacy-alovida-standard'),
    code: 'ALOVIDA_STANDARD',
    name: 'Estándar ALOVIDA (sistema de farmacia)',
    docUrl: 'docs/integrations/pharmacy-standard.openapi.yaml',
  },
  {
    id: deterministicId('seed:integrations-provider:pharmacy-simulated-chain'),
    code: 'SIMULATED_CHAIN',
    name: 'Cadena simulada (sistema de farmacia de prueba)',
    docUrl: 'mock-provider-server/README.md',
  },
] as const;

/** Siembra idempotente de los tipos de sistema de farmacia. */
@Injectable()
export class PharmacySystemProvidersSeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacySystemProvidersSeedService.name);
  }

  async run(): Promise<{ inserted: number }> {
    const em = this.orm.em.fork();
    const now = new Date();
    let inserted = 0;
    for (const provider of PHARMACY_SYSTEM_PROVIDERS) {
      const exists =
        (await em.findOne(ExternalProviders, { id: provider.id })) ??
        (await em.findOne(ExternalProviders, { code: provider.code }));
      if (exists) continue;
      em.create(
        ExternalProviders,
        {
          id: provider.id,
          code: provider.code,
          name: provider.name,
          providerTypeConceptId: INTEG.PROVIDER_TYPE_GENERIC,
          authTypeConceptId: INTEG.AUTH_API_KEY,
          docUrl: provider.docUrl,
          stateConceptId: INTEG.PROVIDER_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
    }
    await em.flush();
    if (inserted > 0) {
      this.logger.info(
        { inserted },
        'Tipos de sistema de farmacia materializados',
      );
    }
    return { inserted };
  }
}
