import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';

import { CONCEPTS } from '../constants/concepts';
import { Addresses } from '../../modules/common/entities';
import { PublicProfiles } from '../../modules/community/entities';
import { COMM } from '../../modules/community/community.concepts';
import { Tenants } from '../../modules/directory/entities';
import { AuthenticationCredentials } from '../../modules/iam/entities';
import {
  NetworkProviderMemberships,
  ProviderNetworks,
} from '../../modules/insurance/entities';

/** Una línea del censo: cuántas filas hay de algo que la carga deja. */
export interface SeedCensusLine {
  /** Id del paso de la carga al que pertenece (el de `--only`). */
  readonly step: string;
  /** Qué se cuenta. */
  readonly label: string;
  /** Cuántas filas hay hoy en la base. */
  readonly count: number;
}

/**
 * Censo de lo que deja la carga, para comparar entornos con un solo comando.
 *
 * El resumen de `seed-cli` dice cuánto insertó **esta** pasada, que en una
 * segunda corrida es cero en todos los entornos y no distingue uno de otro. El
 * censo cuenta lo que **hay**: dos entornos con la misma carga dan las mismas
 * líneas, y la que difiere señala el paso que quedó distinto.
 *
 * Solo cuenta (`COUNT`), no lee contenido: ningún dato personal sale en el
 * resumen. Las cuentas se cuentan por el dominio reservado de pruebas.
 */
@Injectable()
export class SeedCensusService {
  /**
   * @param orm - Acceso al `EntityManager` para los conteos.
   */
  constructor(private readonly orm: MikroORM) {}

  /**
   * Cuenta las filas de cada paso de la carga, en un orden fijo.
   *
   * @returns Las líneas del censo, con las mismas etiquetas en todos los entornos.
   */
  async take(): Promise<SeedCensusLine[]> {
    const em = this.orm.em.fork();
    const line = async (
      step: string,
      label: string,
      count: Promise<number>,
    ): Promise<SeedCensusLine> => ({ step, label, count: await count });

    return [
      await line(
        'padron-organizaciones',
        'organizaciones del padrón (BO_EST_*)',
        em.count(Tenants, { code: { $like: 'BO_EST\\_%' } }),
      ),
      await line(
        'padron-organizaciones',
        'organizaciones de la carga anterior (CARGA_*)',
        em.count(Tenants, { code: { $like: 'CARGA\\_%' } }),
      ),
      await line(
        'padron-organizaciones',
        'organizaciones verificadas (todas)',
        em.count(Tenants, {
          verificationStatusConceptId: CONCEPTS.TENANT_VERIFIED,
        }),
      ),
      await line(
        'padron-organizaciones',
        'direcciones de organizaciones',
        em.count(Addresses, { ownerTypeConceptId: CONCEPTS.OWNER_TENANT }),
      ),
      await line(
        'padron-organizaciones',
        'vitrinas de organizaciones',
        em.count(PublicProfiles, {
          targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
        }),
      ),
      await line(
        'padron-organizaciones',
        'vitrinas de farmacias',
        em.count(PublicProfiles, {
          targetTypeConceptId: COMM.PROFILE_TARGET_PHARMACY,
        }),
      ),
      await line(
        'aseguradoras-de-bolivia',
        'aseguradoras (organizaciones)',
        em.count(Tenants, {
          tenantTypeConceptId: CONCEPTS.TENANT_TYPE_PAYER,
        }),
      ),
      await line(
        'aseguradoras-de-bolivia',
        'vitrinas de aseguradoras',
        em.count(PublicProfiles, {
          targetTypeConceptId: COMM.PROFILE_TARGET_INSURER,
        }),
      ),
      await line(
        'padron-administradores',
        'cuentas de administrador de organización',
        em.count(AuthenticationCredentials, {
          externalSubject: { $like: 'admin.%@alovida.test' },
        }),
      ),
      await line(
        'padron-de-personas',
        'cuentas de demostración (@alovida.test)',
        em.count(AuthenticationCredentials, {
          externalSubject: { $like: '%@alovida.test' },
        }),
      ),
      await line(
        'padron-de-personas',
        'vitrinas de profesionales',
        em.count(PublicProfiles, {
          targetTypeConceptId: COMM.PROFILE_TARGET_PRACTITIONER,
        }),
      ),
      await line(
        'directorio-de-redes-de-aseguradoras',
        'redes de prestadores',
        em.count(ProviderNetworks, {}),
      ),
      await line(
        'directorio-de-redes-de-aseguradoras',
        'membresías de red',
        em.count(NetworkProviderMemberships, {}),
      ),
    ];
  }
}

/**
 * Da forma de texto al censo, una línea por conteo, para guardarlo y comparar
 * dos entornos con `diff`.
 *
 * @param lines - El censo.
 * @returns Texto con `paso<TAB>etiqueta<TAB>conteo` por línea.
 */
export function formatSeedCensus(lines: readonly SeedCensusLine[]): string {
  return lines
    .map((entry) => `${entry.step}\t${entry.label}\t${entry.count}`)
    .join('\n');
}
