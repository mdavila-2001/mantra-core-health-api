import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticUnitAccreditations } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de una acreditación de la unidad (UC-23-01/11). */
export interface CreateAccreditationData {
  diagnosticUnitId: string;
  accreditationConceptId: string;
  diagnosticUnitSiteId?: string;
  accreditationNumber?: string;
  issuerTenantId?: string;
  validFrom?: Date;
  validTo?: Date;
  evidenceFileId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `diagnostic_units.diagnostic_unit_accreditations`. */
@Injectable()
export class DiagnosticUnitAccreditationsRepository {
  findById(em: EntityManager, id: string): Promise<DiagnosticUnitAccreditations | null> {
    return em.findOne(DiagnosticUnitAccreditations, { id });
  }

  create(em: EntityManager, data: CreateAccreditationData): DiagnosticUnitAccreditations {
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
  verifyOpenForUnit(em: EntityManager, diagnosticUnitId: string): Promise<number> {
    return em.nativeUpdate(
      DiagnosticUnitAccreditations,
      { diagnosticUnitId, validTo: null },
      { verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED, updatedAt: new Date() },
    );
  }
}
