import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerAdmissionsRepository } from '../../infrastructure/repositories';
import {
  visibleVerifications,
  type PractitionerVerificationView,
} from '../../domain/admissions/admission-status';

/**
 * El sello visible de verificación de profesionales, para quien no es `profiles`.
 *
 * Es la misma proyección que alimenta la Guía y la búsqueda de profesionales
 * (`PractitionerAdmissionsReadService.verificationOf`): una consulta por lote
 * a la admisión vigente y `visibleVerifications`, sin una segunda
 * interpretación del estado. Existe aparte porque la lectura de admisiones
 * arrastra el checklist, la evidencia y los puertos del personal, y un
 * consumidor de **sólo el sello** (la bandeja de mensajes de `community`, que
 * no puede importar `ProfilesModule` —éste ya la importa a ella—) no debe
 * cargar todo eso. Sólo depende de un repositorio propio sin estado.
 *
 * Sólo lee, y nunca escribe `PRACT_VERIF_*`: el único escritor sigue siendo
 * `PractitionerVerificationProjector`.
 */
@Injectable()
export class PractitionerVerificationReader {
  constructor(
    private readonly admissionsRepo: PractitionerAdmissionsRepository,
  ) {}

  /**
   * El sello de cada profesional pedido, en **una** consulta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileIds - Perfiles profesionales (`person_id`).
   * @param now - Instante de referencia (una vigencia pasada se ve `EXPIRED`).
   * @returns Un sello por cada id pedido; sin admisión, `UNVERIFIED`.
   */
  async verificationOf(
    em: EntityManager,
    practitionerProfileIds: readonly string[],
    now: Date = new Date(),
  ): Promise<Map<string, PractitionerVerificationView>> {
    if (practitionerProfileIds.length === 0) return new Map();
    const current = await this.admissionsRepo.findCurrentByPractitioners(
      em,
      practitionerProfileIds,
    );
    return visibleVerifications(practitionerProfileIds, current, now);
  }
}
