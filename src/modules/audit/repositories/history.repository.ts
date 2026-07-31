import { Injectable } from '@nestjs/common';
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
interface HistoryBinding {
  /**
   * Valor de entity mantenido por la instancia.
   */
  entity: any;
  /**
   * Valor de source field mantenido por la instancia.
   */
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
  medication_requests: {
    entity: MedicationRequestsHistory,
    sourceField: 'medicationRequestId',
  },
  appointment_bookings: {
    entity: AppointmentBookingsHistory,
    sourceField: 'appointmentBookingId',
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prev = await (em.find as any)(
      binding.entity,
      { [binding.sourceField]: id, validTo: null },
      {},
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of prev as any[]) row.validTo = now;

    const revisionNo =
      (await em.count(binding.entity, { [binding.sourceField]: id })) + 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (em.create as any)(
      binding.entity,
      {
        [binding.sourceField]: id,
        revisionNo,
        operationConceptId: data.operationConceptId,
        validFrom: now,
        dataSnapshot: data.dataSnapshot,
        changedByUserId: data.changedByUserId,
        changeReasonConceptId: data.changeReasonConceptId,
        recordedAt: now,
      },
      { partial: true },
    );
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
