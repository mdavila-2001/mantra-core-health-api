import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FieldValues, FieldValueAudit, FieldValueProvenance } from '../entities';
import { createdBy } from '../../../common';

/** Columnas `value_*` derivadas del data_type (value[x] exclusivo). */
export interface ValueColumns {
  valueString?: string;
  valueText?: string;
  valueInteger?: string;
  valueDecimal?: string;
  valueBoolean?: boolean;
  valueDate?: Date;
  valueDatetime?: Date;
  valueTime?: string;
  valueUrl?: string;
  valueJson?: unknown;
  valueConceptId?: string;
  valueReferenceType?: string;
  valueReferenceId?: string;
  fileId?: string;
}

/** Alta de un valor de campo. */
export interface CreateValueData extends ValueColumns {
  formInstanceId: string;
  resourceTypeConceptId: string;
  resourceId: string;
  fieldId: string;
  assignmentId?: string;
  ordinal: number;
  unitConceptId?: string;
  dataSourceConceptId?: string;
  valueStatusConceptId?: string;
  valueVersion?: number;
  supersedesValueId?: string;
  effectiveFrom?: Date;
  actorUserId?: string;
}

/** Alta de una fila de auditoría de valor (append-only). */
export interface CreateAuditData {
  fieldValueId: string;
  actionConceptId: string;
  userId: string;
  reasonConceptId?: string;
  previousSnapshotJson?: unknown;
  newSnapshotJson?: unknown;
}

/** Alta de una fila de procedencia (inmutable). */
export interface CreateProvenanceData {
  fieldValueId: string;
  sourceSystemUri?: string;
  sourceResourceType?: string;
  sourceResourceId?: string;
  sourceVersion?: string;
  importBatchId?: string;
  verificationStatusConceptId?: string;
  contentHash?: string;
  actorUserId?: string;
}

/** Acceso a datos de `forms.field_values`, su auditoría y su procedencia. */
@Injectable()
export class FieldValuesRepository {
  findById(em: EntityManager, id: string): Promise<FieldValues | null> {
    return em.findOne(FieldValues, { id });
  }

  findPreliminaryByInstance(
    em: EntityManager,
    formInstanceId: string,
    preliminaryStatusConceptId: string,
  ): Promise<FieldValues[]> {
    return em.find(FieldValues, {
      formInstanceId,
      valueStatusConceptId: preliminaryStatusConceptId,
    });
  }

  create(em: EntityManager, data: CreateValueData): FieldValues {
    const { actorUserId, ...rest } = data;
    return em.create(FieldValues, { ...rest, ...createdBy(actorUserId) }, { partial: true });
  }

  createAudit(em: EntityManager, data: CreateAuditData): FieldValueAudit {
    return em.create(
      FieldValueAudit,
      { ...data, recordedAt: new Date(), recordedByUserId: data.userId },
      { partial: true },
    );
  }

  createProvenance(em: EntityManager, data: CreateProvenanceData): FieldValueProvenance {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldValueProvenance,
      { ...rest, recordedAt: new Date(), recordedByUserId: actorUserId },
      { partial: true },
    );
  }
}
