import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common';
import {
  PRACTITIONER_AFFILIATIONS_PORT,
  type PractitionerAffiliationsPort,
} from '../ports/practitioner-affiliations.port';

/**
 * En qué situación está el profesional respecto de una organización.
 *
 * Es un veredicto y no una excepción a propósito: la misma comprobación sirve
 * para publicar agenda y para aceptar un turno, pero lo que hay que decirle al
 * médico cambia en cada caso. Devolver el veredicto deja que cada consumidor
 * ponga su frase, en vez de pasar una bandera que elija mensaje.
 */
export type AffiliationVerdict =
  /** No hay vínculo con sede que mirar: consultorio propio o recién llegado. */
  | 'sin-vinculos'
  /** La organización lo aceptó. */
  | 'aprobado'
  /** Pidió el vínculo y todavía no le respondieron. */
  | 'pendiente'
  /** Tiene vínculos con sede, pero ninguno con esta organización. */
  | 'ausente'
  /** Tiene un vínculo con esta organización y no está vigente. */
  | 'no-vigente';

/**
 * La regla de pertenencia del profesional a una organización.
 *
 * Vive acá y no en `profiles` porque es una regla de agenda —quién puede
 * publicar y quién puede comprometer turnos de una organización—, aunque los
 * datos que lee sean del historial laboral. Sus dos consumidores están en este
 * módulo.
 */
@Injectable()
export class PractitionerAffiliationGateService {
  constructor(
    @Inject(PRACTITIONER_AFFILIATIONS_PORT)
    private readonly affiliationsPort: PractitionerAffiliationsPort,
  ) {}

  /**
   * Evalúa el vínculo del actor con la organización.
   *
   * @param tenantId - Organización a la que pertenece lo que se quiere hacer.
   * @param actor - Quien actúa.
   * @returns El veredicto; `'sin-vinculos'` cuando no hay nada que mirar.
   */
  async evaluate(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<AffiliationVerdict> {
    if (actor.practitionerProfileId === undefined) return 'sin-vinculos';

    const withSite = await this.affiliationsPort.findOfPractitioner(
      actor.practitionerProfileId,
    );
    if (withSite.length === 0) return 'sin-vinculos';

    const tenantBySite = await this.affiliationsPort.tenantsOfSites(
      withSite.map((v) => v.practiceSiteId),
    );
    const ofThisOrganization = withSite.filter(
      (v) => tenantBySite.get(v.practiceSiteId) === tenantId,
    );
    if (ofThisOrganization.length === 0) return 'sin-vinculos';

    const approved = ofThisOrganization.some(
      (v) => v.status === 'APPROVED' || v.status === 'DECLARED',
    );
    if (approved) return 'aprobado';

    const pendingVerdict = ofThisOrganization.some(
      (v) => v.status === 'PENDING',
    );
    if (pendingVerdict) return 'pendiente';

    return ofThisOrganization.some(
      (v) => v.status === 'REJECTED' || v.status === 'REVOKED',
    )
      ? 'no-vigente'
      : 'ausente';
  }
}
