import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  FieldValues,
  FieldValueAudit,
  FieldValueProvenance,
} from '../entities';
import { createdBy } from '../../../common';

/** Columnas `value_*` derivadas del data_type (value[x] exclusivo). */
export interface ValueColumns {
  /**
   * Valor de value string mantenido por la instancia.
   */
  valueString?: string;
  /**
   * Valor de value text mantenido por la instancia.
   */
  valueText?: string;
  /**
   * Valor de value integer mantenido por la instancia.
   */
  valueInteger?: string;
  /**
   * Valor de value decimal mantenido por la instancia.
   */
  valueDecimal?: string;
  /**
   * Valor de value boolean mantenido por la instancia.
   */
  valueBoolean?: boolean;
  /**
   * Valor de value date mantenido por la instancia.
   */
  valueDate?: Date;
  /**
   * Valor de value datetime mantenido por la instancia.
   */
  valueDatetime?: Date;
  /**
   * Valor de value time mantenido por la instancia.
   */
  valueTime?: string;
  /**
   * Valor de value url mantenido por la instancia.
   */
  valueUrl?: string;
  /**
   * Valor de value json mantenido por la instancia.
   */
  valueJson?: unknown;
  /**
   * Identificador asociado a value concept.
   */
  valueConceptId?: string;
  /**
   * Valor de value reference type mantenido por la instancia.
   */
  valueReferenceType?: string;
  /**
   * Identificador asociado a value reference.
   */
  valueReferenceId?: string;
  /**
   * Identificador asociado a file.
   */
  fileId?: string;
}

/** Alta de un valor de campo. */
export interface CreateValueData extends ValueColumns {
  /**
   * Identificador asociado a form instance.
   */
  formInstanceId: string;
  /**
   * Identificador asociado a resource type concept.
   */
  resourceTypeConceptId: string;
  /**
   * Identificador asociado a resource.
   */
  resourceId: string;
  /**
   * Identificador asociado a field.
   */
  fieldId: string;
  /**
   * Identificador asociado a assignment.
   */
  assignmentId?: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Identificador asociado a unit concept.
   */
  unitConceptId?: string;
  /**
   * Identificador asociado a data source concept.
   */
  dataSourceConceptId?: string;
  /**
   * Identificador asociado a value status concept.
   */
  valueStatusConceptId?: string;
  /**
   * Valor de value version mantenido por la instancia.
   */
  valueVersion?: number;
  /**
   * Identificador asociado a supersedes value.
   */
  supersedesValueId?: string;
  /**
   * Valor de effective from mantenido por la instancia.
   */
  effectiveFrom?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta de una fila de auditoría de valor (append-only). */
export interface CreateAuditData {
  /**
   * Identificador asociado a field value.
   */
  fieldValueId: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId?: string;
  /**
   * Valor de previous snapshot json mantenido por la instancia.
   */
  previousSnapshotJson?: unknown;
  /**
   * Valor de new snapshot json mantenido por la instancia.
   */
  newSnapshotJson?: unknown;
}

/** Alta de una fila de procedencia (inmutable). */
export interface CreateProvenanceData {
  /**
   * Identificador asociado a field value.
   */
  fieldValueId: string;
  /**
   * Valor de source system uri mantenido por la instancia.
   */
  sourceSystemUri?: string;
  /**
   * Valor de source resource type mantenido por la instancia.
   */
  sourceResourceType?: string;
  /**
   * Identificador asociado a source resource.
   */
  sourceResourceId?: string;
  /**
   * Valor de source version mantenido por la instancia.
   */
  sourceVersion?: string;
  /**
   * Identificador asociado a import batch.
   */
  importBatchId?: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId?: string;
  /**
   * Valor de content hash mantenido por la instancia.
   */
  contentHash?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `forms.field_values`, su auditoría y su procedencia. */
@Injectable()
export class FieldValuesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<FieldValues | null>`.
   */
  findById(em: EntityManager, id: string): Promise<FieldValues | null> {
    return em.findOne(FieldValues, { id });
  }

  /**
   * Obtiene find preliminary by instance.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param formInstanceId - Identificador de form instance.
   * @param preliminaryStatusConceptId - Identificador de preliminary status concept.
   * @returns Resultado de find preliminary by instance conforme al contrato `Promise<FieldValues[]>`.
   */
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

  /**
   * Valores vigentes de una instancia: todos menos los reemplazados por una
   * corrección. El valor nuevo de un supersede convive con el viejo en la misma
   * tabla; la lectura muestra el vigente y deja el historial para la auditoría.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param formInstanceId - Identificador de form instance.
   * @param supersededStatusConceptId - Concepto del estado reemplazado, a excluir.
   * @returns Valores vigentes en orden de captura.
   */
  findCurrentByInstance(
    em: EntityManager,
    formInstanceId: string,
    supersededStatusConceptId: string,
  ): Promise<FieldValues[]> {
    return em.find(
      FieldValues,
      {
        formInstanceId,
        $or: [
          { valueStatusConceptId: null },
          { valueStatusConceptId: { $ne: supersededStatusConceptId } },
        ],
      },
      { orderBy: { ordinal: 'ASC', createdAt: 'ASC' } },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `FieldValues`.
   */
  create(em: EntityManager, data: CreateValueData): FieldValues {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldValues,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Crea create audit.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create audit conforme al contrato `FieldValueAudit`.
   */
  createAudit(em: EntityManager, data: CreateAuditData): FieldValueAudit {
    return em.create(
      FieldValueAudit,
      { ...data, recordedAt: new Date(), recordedByUserId: data.userId },
      { partial: true },
    );
  }

  /**
   * Crea create provenance.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create provenance conforme al contrato `FieldValueProvenance`.
   */
  createProvenance(
    em: EntityManager,
    data: CreateProvenanceData,
  ): FieldValueProvenance {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldValueProvenance,
      { ...rest, recordedAt: new Date(), recordedByUserId: actorUserId },
      { partial: true },
    );
  }
}
