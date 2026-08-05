import { Injectable } from '@nestjs/common';
import type { EntityClass, EntityData, FilterQuery } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  UsersHistory,
  PatientProfilesHistory,
  ConsentsHistory,
  ModerationDecisionsHistory,
  MedicationRequestsHistory,
  AppointmentBookingsHistory,
} from '../entities';

/** Datos para sellar una revisión en una tabla `*_history` (write-side). */
export interface AppendHistoryData {
  operationConceptId: string;
  dataSnapshot: unknown;
  changedByUserId?: string;
  changeReasonConceptId?: string;
}

/** Una revisión de la línea de tiempo de un registro (proyección de lectura). */
export interface HistoryRevision {
  /**
   * Valor de revision no mantenido por la instancia.
   */
  revisionNo?: number;
  /**
   * Identificador asociado a operation concept.
   */
  operationConceptId: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a changed by user.
   */
  changedByUserId?: string;
  /**
   * Identificador asociado a change reason concept.
   */
  changeReasonConceptId?: string;
  /**
   * Valor de recorded at mantenido por la instancia.
   */
  recordedAt: Date;
  /**
   * Valor de data snapshot mantenido por la instancia.
   */
  dataSnapshot: unknown;
}

/**
 * Describe el contrato estructural de history binding.
 */
interface HistoryEntity {
  revisionNo?: number;
  rowVersion?: number;
  operationConceptId: string;
  validFrom?: Date;
  validTo?: Date;
  changedByUserId?: string;
  changeReasonConceptId?: string;
  recordedAt: Date;
  dataSnapshot: unknown;
}

interface HistoryBinding {
  /**
   * Valor de entity mantenido por la instancia.
   */
  entity: EntityClass<HistoryEntity>;
  /**
   * Valor de source field mantenido por la instancia.
   */
  sourceField: string;
  /** Campo correlativo real de la tabla; algunos historiales legados usan row_version. */
  revisionField: 'revisionNo' | 'rowVersion';
}

/**
 * Registro de entidades `audit.<tabla>_history` soportadas por la consulta de
 * historial (UC-10-05). La validación del `entity` polimórfico se hace contra este
 * mapa (nunca crudo del cliente), evitando exponer tablas arbitrarias. Ampliable
 * añadiendo entradas.
 */
const HISTORY_REGISTRY: Record<string, HistoryBinding> = {
  users: {
    entity: UsersHistory,
    sourceField: 'userId',
    revisionField: 'revisionNo',
  },
  patient_profiles: {
    entity: PatientProfilesHistory,
    sourceField: 'patientProfileId',
    revisionField: 'revisionNo',
  },
  consents: {
    entity: ConsentsHistory,
    sourceField: 'consentId',
    revisionField: 'revisionNo',
  },
  moderation_decisions: {
    entity: ModerationDecisionsHistory,
    sourceField: 'moderationDecisionsId',
    revisionField: 'rowVersion',
  },
  medication_requests: {
    entity: MedicationRequestsHistory,
    sourceField: 'medicationRequestId',
    revisionField: 'revisionNo',
  },
  appointment_bookings: {
    entity: AppointmentBookingsHistory,
    sourceField: 'appointmentBookingId',
    revisionField: 'revisionNo',
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
   * Write-side genérico del versionado append-only (§2 «consumidor verificable»):
   * sella una revisión en `<entity>_history` dentro de la transacción del llamador.
   * El nº de revisión es el siguiente correlativo del agregado. Cierra la ventana
   * (`valid_to`) de la revisión anterior para reconstruir el estado point-in-time.
   * Ampliar cobertura = registrar la entidad en `HISTORY_REGISTRY` y llamar aquí en
   * su punto de mutación (mismo patrón que `AuditTrailService`).
   */
  async append(
    em: EntityManager,
    entity: string,
    id: string,
    data: AppendHistoryData,
  ): Promise<void> {
    const binding = HISTORY_REGISTRY[entity];
    if (!binding) {
      throw new Error(`Entidad de historial no registrada: ${entity}`);
    }
    const now = new Date();
    const sourceFilter = {
      [binding.sourceField]: id,
    } as FilterQuery<HistoryEntity>;
    const prev = await em.find(binding.entity, {
      ...sourceFilter,
      validTo: null,
    });
    for (const row of prev) row.validTo = now;

    const revisionNo = (await em.count(binding.entity, sourceFilter)) + 1;

    const historyData: EntityData<HistoryEntity> & Record<string, unknown> = {
      operationConceptId: data.operationConceptId,
      validFrom: now,
      dataSnapshot: data.dataSnapshot,
      changedByUserId: data.changedByUserId,
      changeReasonConceptId: data.changeReasonConceptId,
      recordedAt: now,
    };
    historyData[binding.sourceField] = id;
    historyData[binding.revisionField] = revisionNo;
    em.create(binding.entity, historyData, { partial: true });
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

    const where = (
      asOf
        ? {
            [binding.sourceField]: id,
            validFrom: { $lte: asOf },
            $or: [{ validTo: null }, { validTo: { $gt: asOf } }],
          }
        : { [binding.sourceField]: id }
    ) as FilterQuery<HistoryEntity>;

    const rows = await em.find(binding.entity, where, {
      orderBy: { recordedAt: 'asc' },
    });

    return rows.map((r) => ({
      revisionNo: r.revisionNo ?? r.rowVersion,
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
