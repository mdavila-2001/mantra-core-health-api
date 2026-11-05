import { HttpStatus, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DomainException, ErrorCode } from '../../../common';
import { CONS } from '../../consent/consent.concepts';
import {
  Consents,
  PrivacyRestrictions,
  ProcessingPurposes,
} from '../../consent/entities';
import { GraphErrorReason } from '../graph_intelligence.error-reasons';

/** Qué se pregunta a la compuerta de consentimiento antes de recorrer el grafo. */
export interface GraphConsentQuery {
  /** Tenant activo del contexto autenticado. */
  readonly tenantId: string;
  /** Paciente del contexto de la consulta. */
  readonly patientProfileId: string;
  /** Propósito de uso declarado (`code` de `consent.processing_purposes`). */
  readonly purposeOfUse: string;
  /** Actor que consulta; una restricción dirigida a otro actor no le aplica. */
  readonly actorId?: string;
  /** Instante de evaluación (inyectable en pruebas). */
  readonly now?: Date;
}

/**
 * Compuerta de consentimiento del recorrido con contexto de paciente (UC-61-05).
 *
 * Un `patientProfileId` aportado en la consulta no es una autorización: el
 * paciente pudo retirar el consentimiento o restringir el uso. La consulta sólo
 * procede si, **para el tenant activo**:
 *  1. el propósito declarado existe en `consent.processing_purposes`;
 *  2. hay un consentimiento `ACTIVE` del paciente para ese propósito, dentro de
 *     su ventana de vigencia y emitido para ese tenant (un consentimiento sin
 *     tenant o de otro no cuenta: se deniega por defecto);
 *  3. no hay una restricción de privacidad `ACTIVE` y vigente que le aplique al
 *     actor (sin destinatario, o dirigida a él). La restricción no declara
 *     propósito, así que una restricción vigente niega el uso por completo.
 *
 * Toda denegación es la misma (`403 FORBIDDEN / GRAPH_CONSENT_REQUIRED`, mismo
 * mensaje, sin `details`): distinguir "revocado" de "inexistente" o de
 * "restringido" revelaría el estado de privacidad del paciente a quien consulta.
 */
@Injectable()
export class GraphConsentGate {
  /**
   * Exige consentimiento vigente y ausencia de restricciones para el propósito.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param query - Tenant, paciente, propósito y actor de la consulta.
   * @throws DomainException 403 `GRAPH_CONSENT_REQUIRED` si no se autoriza.
   */
  async assertAllowed(
    em: EntityManager,
    query: GraphConsentQuery,
  ): Promise<void> {
    const now = query.now ?? new Date();

    const purpose = await em.findOne(ProcessingPurposes, {
      code: query.purposeOfUse,
    });
    if (!purpose) this.deny();

    const consents = await em.find(Consents, {
      patientProfileId: query.patientProfileId,
      processingPurposeId: purpose.id,
      statusConceptId: CONS.CONSENT_ACTIVE,
      tenantId: query.tenantId,
    });
    const consentActive = consents.some(
      (consent) =>
        (!consent.validFrom || consent.validFrom <= now) &&
        (!consent.validTo || consent.validTo > now) &&
        !consent.withdrawnAt,
    );
    if (!consentActive) this.deny();

    const restrictions = await em.find(PrivacyRestrictions, {
      patientProfileId: query.patientProfileId,
      tenantId: query.tenantId,
      statusConceptId: CONS.RESTRICTION_ACTIVE,
    });
    const restricted = restrictions.some(
      (restriction) =>
        (!restriction.validFrom || restriction.validFrom <= now) &&
        (!restriction.validTo || restriction.validTo > now) &&
        (!restriction.targetActorId ||
          restriction.targetActorId === query.actorId),
    );
    if (restricted) this.deny();
  }

  /**
   * Respuesta única de denegación.
   *
   * @throws DomainException 403 siempre.
   */
  private deny(): never {
    throw new DomainException(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      'La consulta con contexto de paciente requiere un consentimiento vigente.',
      undefined,
      GraphErrorReason.CONSENT_REQUIRED,
    );
  }
}
