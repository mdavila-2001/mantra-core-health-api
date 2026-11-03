import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import { ClinicalErrorReason } from '../clinical.error-reasons';
import {
  DEFAULT_PERFORMER_SELECTION_CONCEPT,
  performerSelectionCodeOf,
} from '../performer-selection';
import { PerformerSiteReader } from './performer-site.reader';

/** Lo que la orden declara sobre quién la ejecuta. */
export interface PerformerSelectionInput {
  /** Procedimiento pedido (`codeConceptId` de la orden). */
  procedureConceptId: string;
  /** Concepto del modo; omitido ⇒ que elija el paciente. */
  performerSelectionConceptId?: string;
  /** Médico ejecutor (solo «lo hago yo»). */
  performerPractitionerProfileId?: string;
  /** Sede sugerida (con «lo hago yo» y «en este centro»). */
  suggestedPracticeSiteId?: string;
  /** Médico que pide la orden. */
  requesterProfileId?: string;
}

/** Lo que se persiste de la recomendación, ya resuelto. */
export interface ResolvedPerformerSelection {
  /** Concepto del modo, con el valor por defecto aplicado. */
  performerSelectionConceptId: string;
  /** Médico ejecutor, o `null`. */
  performerPractitionerProfileId: string | null;
  /** Sede sugerida, o `null`. */
  suggestedPracticeSiteId: string | null;
}

/**
 * Reglas del modo de ejecutor de la orden (contrato §3).
 *
 * El modo es una **recomendación**: no restringe qué centros ve el paciente ni
 * le da acceso a la orden a la sede sugerida. Esta clase solo decide si lo que
 * el médico declara es coherente; no toca `performer_tenant_id`.
 */
@Injectable()
export class PerformerSelectionValidator {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param sites - Lectura de ofertas y afiliaciones de las sedes.
   */
  constructor(private readonly sites: PerformerSiteReader) {}

  /**
   * Valida el modo declarado y devuelve lo que hay que guardar.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param input - Lo que la orden declara.
   * @returns La recomendación resuelta.
   * @throws PreconditionFailedException (422) ante cualquier incoherencia.
   */
  async resolve(
    em: EntityManager,
    input: PerformerSelectionInput,
  ): Promise<ResolvedPerformerSelection> {
    const conceptId =
      input.performerSelectionConceptId ?? DEFAULT_PERFORMER_SELECTION_CONCEPT;
    const mode = performerSelectionCodeOf(conceptId);
    if (!mode) {
      throw new PreconditionFailedException(
        'El modo de ejecutor no es válido',
        undefined,
        ClinicalErrorReason.PERFORMER_SELECTION_INVALID,
      );
    }

    const { performerPractitionerProfileId: doctor, suggestedPracticeSiteId } =
      input;

    if (mode === 'PATIENT_CHOICE') {
      if (doctor !== undefined || suggestedPracticeSiteId !== undefined) {
        throw new PreconditionFailedException(
          'Si elige el paciente, la orden no lleva médico ni sede sugeridos',
          undefined,
          ClinicalErrorReason.PERFORMER_FIELD_NOT_ALLOWED,
        );
      }
      return {
        performerSelectionConceptId: conceptId,
        performerPractitionerProfileId: null,
        suggestedPracticeSiteId: null,
      };
    }

    if (suggestedPracticeSiteId === undefined) {
      throw new PreconditionFailedException(
        'La orden necesita la sede sugerida',
        undefined,
        ClinicalErrorReason.PERFORMER_FIELD_REQUIRED,
      );
    }

    if (mode === 'ORGANIZATION') {
      if (doctor !== undefined) {
        throw new PreconditionFailedException(
          'Si se recomienda un centro, la orden no lleva médico ejecutor',
          undefined,
          ClinicalErrorReason.PERFORMER_FIELD_NOT_ALLOWED,
        );
      }
    } else {
      if (doctor === undefined) {
        throw new PreconditionFailedException(
          'Si lo hace el médico, la orden necesita el médico ejecutor',
          undefined,
          ClinicalErrorReason.PERFORMER_FIELD_REQUIRED,
        );
      }
      if (
        input.requesterProfileId === undefined ||
        doctor !== input.requesterProfileId
      ) {
        throw new PreconditionFailedException(
          'El médico ejecutor debe ser quien pide la orden',
          undefined,
          ClinicalErrorReason.PERFORMER_NOT_REQUESTER,
        );
      }
    }

    const offered = await this.sites.offersProcedureWithPrice(
      em,
      suggestedPracticeSiteId,
      input.procedureConceptId,
    );
    if (!offered) {
      throw new PreconditionFailedException(
        'La sede sugerida no ofrece ese procedimiento con precio',
        undefined,
        ClinicalErrorReason.SUGGESTED_SITE_DOES_NOT_OFFER_PROCEDURE,
      );
    }

    if (mode === 'SELF') {
      const affiliated = await this.sites.isActivelyAffiliated(
        em,
        doctor!,
        suggestedPracticeSiteId,
        input.procedureConceptId,
      );
      if (!affiliated) {
        throw new PreconditionFailedException(
          'El médico no tiene una afiliación activa para ese procedimiento en la sede sugerida',
          undefined,
          ClinicalErrorReason.PRACTITIONER_NOT_AFFILIATED_AT_SITE,
        );
      }
    }

    return {
      performerSelectionConceptId: conceptId,
      performerPractitionerProfileId: mode === 'SELF' ? doctor! : null,
      suggestedPracticeSiteId,
    };
  }
}
