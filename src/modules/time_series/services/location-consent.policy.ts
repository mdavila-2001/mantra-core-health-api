import { HttpStatus, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, DomainException, ErrorCode } from '../../../common';
import { CONS } from '../../consent/consent.concepts';
import { Consents, ProcessingPurposes } from '../../consent/entities';
import { Devices } from '../../iam/entities';
import { PersonAccountLinks } from '../../profiles/entities';
import { PROF } from '../../profiles/profiles.concepts';
import { LOCATION_CONSENT_PURPOSE_CODES } from '../constants';
import { TimeSeriesErrorReason } from '../time_series.error-reasons';

/** Qué se pregunta a la política antes de insertar un ping de ubicación. */
export interface LocationConsentQuery {
  /** Tenant activo del contexto autenticado (nunca el del cuerpo). */
  readonly tenantId: string;
  /** Consentimiento que declara el lote. */
  readonly consentId: string;
  /** Sujetos (`subject_id`) de todos los pings del lote. */
  readonly subjectIds: readonly string[];
  /** Instante del ping más antiguo del lote. */
  readonly capturedFrom: Date;
  /** Instante del ping más reciente del lote. */
  readonly capturedTo: Date;
  /** Instante de evaluación (inyectable en pruebas). */
  readonly now?: Date;
}

/**
 * Política de consentimiento de la ingesta de ubicación (UC-58-13, TS-01).
 *
 * Una referencia de consentimiento enviada por el cliente no es una
 * autorización: hay que contrastarla con `consent.consents`. El lote se acepta
 * sólo si, **para el tenant activo**:
 *  1. el consentimiento existe y fue emitido para ese tenant (uno sin tenant o
 *     de otro no cuenta);
 *  2. está `ACTIVE`, no retirado, y su vigencia `[valid_from, valid_to)` cubre
 *     tanto el instante de ingesta como cada ping del lote. `valid_to` es
 *     exclusivo: un ping fechado exactamente en `valid_to` queda fuera;
 *  3. su propósito de procesamiento es de ubicación y está activo;
 *  4. todos los sujetos del lote son el titular del consentimiento: su perfil
 *     de paciente (que es su id de persona) o un dispositivo de una cuenta con
 *     vínculo vigente a esa persona.
 *
 * Toda denegación es la misma (`403 FORBIDDEN / TIME_SERIES_LOCATION_CONSENT_INVALID`,
 * mismo mensaje, sin `details`). Sólo se registra el código estable y qué
 * comprobación falló, nunca el consentimiento ni el sujeto.
 */
@Injectable()
export class LocationConsentPolicy {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param logger - Registro estructurado.
   */
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LocationConsentPolicy.name);
  }

  /**
   * Exige un consentimiento de ubicación vigente que ampare el lote.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param query - Tenant, consentimiento, sujetos y ventana del lote.
   * @throws DomainException 403 `TIME_SERIES_LOCATION_CONSENT_INVALID` si no se autoriza.
   */
  async assertAllowed(
    em: EntityManager,
    query: LocationConsentQuery,
  ): Promise<void> {
    const now = query.now ?? new Date();

    const consent = await em.findOne(Consents, { id: query.consentId });
    if (!consent) this.deny('consent');
    if (!consent.tenantId || consent.tenantId !== query.tenantId) {
      this.deny('tenant');
    }
    if (
      consent.statusConceptId !== CONS.CONSENT_ACTIVE ||
      consent.withdrawnAt
    ) {
      this.deny('status');
    }
    if (
      (consent.validFrom && consent.validFrom > now) ||
      (consent.validTo && consent.validTo <= now) ||
      (consent.validFrom && query.capturedFrom < consent.validFrom) ||
      (consent.validTo && query.capturedTo >= consent.validTo)
    ) {
      this.deny('validity');
    }

    const purpose = await em.findOne(ProcessingPurposes, {
      id: consent.processingPurposeId,
    });
    if (
      !purpose ||
      purpose.statusConceptId !== CONCEPTS.STATE_ACTIVE ||
      !LOCATION_CONSENT_PURPOSE_CODES.includes(purpose.code)
    ) {
      this.deny('purpose');
    }

    const holders = await this.holderSubjectIds(
      em,
      consent.patientProfileId,
      now,
    );
    if (!query.subjectIds.every((subjectId) => holders.has(subjectId))) {
      this.deny('subject');
    }
  }

  /**
   * Identificadores que pueden ser «el sujeto» del titular: su persona y los
   * dispositivos de las cuentas con vínculo vigente a esa persona.
   */
  private async holderSubjectIds(
    em: EntityManager,
    patientProfileId: string,
    now: Date,
  ): Promise<Set<string>> {
    const holders = new Set<string>([patientProfileId]);
    const links = await em.find(PersonAccountLinks, {
      personId: patientProfileId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    const userIds = links
      .filter((link) => !link.validTo || link.validTo > now)
      .map((link) => link.userId);
    if (userIds.length === 0) return holders;
    const devices = await em.find(Devices, { userId: { $in: userIds } });
    for (const device of devices) holders.add(device.id);
    return holders;
  }

  /**
   * Respuesta única de denegación.
   *
   * @param check - Comprobación que falló (sólo para el log).
   * @throws DomainException 403 siempre.
   */
  private deny(check: string): never {
    this.logger.warn(
      {
        operation: 'ts.ingest.location',
        reason: TimeSeriesErrorReason.LOCATION_CONSENT_INVALID,
        check,
      },
      'Location ping batch rejected: consent not valid',
    );
    throw new DomainException(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      'El consentimiento de ubicación no es válido para este registro.',
      undefined,
      TimeSeriesErrorReason.LOCATION_CONSENT_INVALID,
    );
  }
}
