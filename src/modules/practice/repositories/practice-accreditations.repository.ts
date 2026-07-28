import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PracticeAccreditations } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar una acreditación de práctica/sitio. */
export interface CreateAccreditationData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Identificador asociado a accreditation type concept.
   */
  accreditationTypeConceptId: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId: string;
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId?: string;
  /**
   * Valor de accreditation number mantenido por la instancia.
   */
  accreditationNumber?: string;
  /**
   * Identificador asociado a issuer tenant.
   */
  issuerTenantId?: string;
  /**
   * Valor de issuer name mantenido por la instancia.
   */
  issuerName?: string;
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

/** Acceso a datos de `practice.practice_accreditations` (stateless). */
@Injectable()
export class PracticeAccreditationsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PracticeAccreditations | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PracticeAccreditations | null> {
    return em.findOne(PracticeAccreditations, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PracticeAccreditations`.
   */
  create(
    em: EntityManager,
    data: CreateAccreditationData,
  ): PracticeAccreditations {
    return em.create(
      PracticeAccreditations,
      {
        practiceId: data.practiceId,
        practiceSiteId: data.practiceSiteId,
        accreditationTypeConceptId: data.accreditationTypeConceptId,
        accreditationNumber: data.accreditationNumber,
        issuerTenantId: data.issuerTenantId,
        issuerName: data.issuerName,
        validFrom: data.validFrom,
        validTo: data.validTo,
        evidenceFileId: data.evidenceFileId,
        verificationStatusConceptId: data.verificationStatusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
