import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  UsersHistory,
  PatientProfilesHistory,
  ConsentsHistory,
  ModerationDecisionsHistory,
} from '../entities';

/** Una revisión de la línea de tiempo de un registro (proyección de lectura). */
export interface HistoryRevision {
  revisionNo?: number;
  operationConceptId: string;
  validFrom?: Date;
  validTo?: Date;
  changedByUserId?: string;
  changeReasonConceptId?: string;
  recordedAt: Date;
  dataSnapshot: unknown;
}

interface HistoryBinding {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entity: any;
  sourceField: string;
}

/**
 * Registro de entidades `audit.<tabla>_history` soportadas por la consulta de
 * historial (UC-10-05). La validación del `entity` polimórfico se hace contra este
 * mapa (nunca crudo del cliente), evitando exponer tablas arbitrarias. Ampliable
 * añadiendo entradas.
 */
const HISTORY_REGISTRY: Record<string, HistoryBinding> = {
  users: { entity: UsersHistory, sourceField: 'userId' },
  patient_profiles: {
    entity: PatientProfilesHistory,
    sourceField: 'patientProfileId',
  },
  consents: { entity: ConsentsHistory, sourceField: 'consentId' },
  moderation_decisions: {
    entity: ModerationDecisionsHistory,
    sourceField: 'moderationDecisionsId',
  },
};

/**
 * Lectura de las tablas de versionado append-only. Solo lectura; reconstruye la
 * línea de tiempo (o el estado point-in-time con `asOf`) de un agregado. Stateless.
 */
@Injectable()
export class HistoryRepository {
  /** ¿Está soportada la entidad polimórfica? */
  isSupported(entity: string): boolean {
    return entity in HISTORY_REGISTRY;
  }

  /**
   * Devuelve la línea de tiempo de `id` en `<entity>_history`. Con `asOf` filtra la
   * fila vigente a esa fecha (valid_from <= asOf < valid_to).
   */
  async timeline(
    em: EntityManager,
    entity: string,
    id: string,
    asOf?: Date,
  ): Promise<HistoryRevision[]> {
    const binding = HISTORY_REGISTRY[entity];
    if (!binding) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { [binding.sourceField]: id };
    if (asOf) {
      where.validFrom = { $lte: asOf };
      where.$or = [{ validTo: null }, { validTo: { $gt: asOf } }];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (em.find as any)(binding.entity, where, {
      orderBy: { recordedAt: 'asc' },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (rows as any[]).map((r) => ({
      revisionNo: r.revisionNo,
      operationConceptId: r.operationConceptId,
      validFrom: r.validFrom,
      validTo: r.validTo,
      changedByUserId: r.changedByUserId,
      changeReasonConceptId: r.changeReasonConceptId,
      recordedAt: r.recordedAt,
      dataSnapshot: r.dataSnapshot,
    }));
  }
}
