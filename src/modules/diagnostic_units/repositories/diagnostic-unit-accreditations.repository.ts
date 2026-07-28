import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticUnitAccreditations } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de una acreditación de la unidad (UC-23-01/11). */
export interface CreateAccreditationData {
  /**
   * Identificador asociado a diagnostic unit.
   */
  diagnosticUnitId: string;
  /**
   * Identificador asociado a accreditation concept.
   */
  accreditationConceptId: string;
  /**
   * Identificador asociado a diagnostic unit site.
   */
  diagnosticUnitSiteId?: string;
  /**
   * Valor de accreditation number mantenido por la instancia.
   */
  accreditationNumber?: string;
  /**
   * Identificador asociado a issuer tenant.
   */
  issuerTenantId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a evidence file.
   */
  evidenceFileId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `diagnostic_units.diagnostic_unit_accreditations`. */
@Injectable()
export class DiagnosticUnitAccreditationsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DiagnosticUnitAccreditations | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<DiagnosticUnitAccreditations | null> {
    return em.findOne(DiagnosticUnitAccreditations, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DiagnosticUnitAccreditations`.
   */
  create(
    em: EntityManager,
    data: CreateAccreditationData,
  ): DiagnosticUnitAccreditations {
    return em.create(
      DiagnosticUnitAccreditations,
      {
        diagnosticUnitId: data.diagnosticUnitId,
        diagnosticUnitSiteId: data.diagnosticUnitSiteId,
        accreditationConceptId: data.accreditationConceptId,
        accreditationNumber: data.accreditationNumber,
        issuerTenantId: data.issuerTenantId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        evidenceFileId: data.evidenceFileId,
        verificationStatusConceptId: DUNIT.VERIFICATION_PENDING,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Marca VERIFIED las acreditaciones vigentes de la unidad (UC-23-03). */
  verifyOpenForUnit(
    em: EntityManager,
    diagnosticUnitId: string,
  ): Promise<number> {
    return em.nativeUpdate(
      DiagnosticUnitAccreditations,
      { diagnosticUnitId, validTo: null },
      {
        verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED,
        updatedAt: new Date(),
      },
    );
  }
}
