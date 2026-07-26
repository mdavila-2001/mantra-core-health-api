import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Procedures } from '../entities';
import { createdBy } from '../../../common';

export interface CreateProcedureData {
  custodianTenantId: string;
  patientProfileId: string;
  encounterId?: string;
  codeConceptId: string;
  statusConceptId: string;
  performerProfileId?: string;
  serviceRequestId?: string;
  parentProcedureId?: string;
  categoryConceptId?: string;
  outcomeConceptId?: string;
  practiceSiteId?: string;
  careSpaceId?: string;
  occurrenceStartAt?: Date;
  occurrenceEndAt?: Date;
  recordedAt?: Date;
  followUpText?: string;
  operativeReportFileId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `clinical.procedures` (stateless). */
@Injectable()
export class ProceduresRepository {
  findById(em: EntityManager, id: string): Promise<Procedures | null> {
    return em.findOne(Procedures, { id });
  }

  create(em: EntityManager, data: CreateProcedureData): Procedures {
    return em.create(
      Procedures,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        codeConceptId: data.codeConceptId,
        statusConceptId: data.statusConceptId,
        performerProfileId: data.performerProfileId,
        serviceRequestId: data.serviceRequestId,
        parentProcedureId: data.parentProcedureId,
        categoryConceptId: data.categoryConceptId,
        outcomeConceptId: data.outcomeConceptId,
        practiceSiteId: data.practiceSiteId,
        careSpaceId: data.careSpaceId,
        occurrenceStartAt: data.occurrenceStartAt,
        occurrenceEndAt: data.occurrenceEndAt,
        recordedAt: data.recordedAt,
        followUpText: data.followUpText,
        operativeReportFileId: data.operativeReportFileId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
