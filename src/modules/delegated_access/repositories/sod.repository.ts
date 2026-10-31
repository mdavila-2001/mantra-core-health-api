import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, createdBy, withSystemRead } from '../../../common';
import { SodExceptions, SodRules } from '../entities';

/** Datos para crear una regla de segregación de funciones. */
export interface CreateSodRuleData {
  /** Id fijo (reglas de plataforma con id determinista). */
  readonly id?: string;
  /** Organización dueña; ausente = regla de plataforma. */
  readonly tenantId?: string;
  /** Código estable (`SOD-BILL-01`). */
  readonly code: string;
  /** Nombre visible. */
  readonly name: string;
  /** Regla de plataforma que esta endurece. */
  readonly baseRuleId?: string;
  /** Átomos del conjunto A. */
  readonly atomsA: readonly string[];
  /** Átomos del conjunto B. */
  readonly atomsB: readonly string[];
  /** Concepto del alcance (`SOD_SCOPE_*`). */
  readonly scopeConceptId: string;
  /** Concepto de la acción (`SOD_ACTION_*`). */
  readonly actionConceptId: string;
  /** Sin excepción posible. */
  readonly isHard?: boolean;
  /** Tope de días de una excepción (1-180); ausente si es `is_hard`. */
  readonly maxExceptionDays?: number;
  /** Por qué existe la regla. */
  readonly rationaleText?: string;
  /** Número de versión (1 por omisión). */
  readonly versionNumber?: number;
  /** Quien la crea. */
  readonly actorUserId?: string;
}

/** Datos para crear una excepción a una regla de segregación de funciones. */
export interface CreateSodExceptionData {
  /** Organización (la del contexto verificado). */
  readonly tenantId: string;
  /** Regla que se exceptúa. */
  readonly sodRuleId: string;
  /** Vínculo exceptuado. */
  readonly organizationUserAssignmentId: string;
  /** Aprobación de cuatro ojos que la respalda. */
  readonly fourEyesRequestId: string;
  /** Justificación (mínimo 30 caracteres). */
  readonly justificationText: string;
  /** Inicio de vigencia. */
  readonly validFrom: Date;
  /** Fin de vigencia (obligatorio, tope 180 días). */
  readonly validTo: Date;
  /** Quien la crea. */
  readonly actorUserId?: string;
}

/** Acceso a datos de `sod_rules` y `sod_exceptions` (segregación de funciones). */
@Injectable()
export class SodRepository {
  /**
   * Reglas activas visibles para una organización: las suyas y las de plataforma (`tenant_id` NULL).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @returns Las reglas ordenadas por código y versión descendente.
   */
  findRulesVisible(em: EntityManager, tenantId: string): Promise<SodRules[]> {
    return em.find(
      SodRules,
      {
        $or: [{ tenantId }, { tenantId: null }],
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      },
      { orderBy: { code: 'asc', versionNumber: 'desc', id: 'asc' } },
    );
  }

  /**
   * Reglas activas de plataforma (las lee cualquier organización por `global_catalog_read`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @returns Las reglas ordenadas por código y versión descendente.
   */
  findPlatformRules(em: EntityManager): Promise<SodRules[]> {
    return em.find(
      SodRules,
      { tenantId: null, statusConceptId: CONCEPTS.STATE_ACTIVE },
      { orderBy: { code: 'asc', versionNumber: 'desc', id: 'asc' } },
    );
  }

  /**
   * Regla por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Id de la regla.
   * @returns La regla o `null`.
   */
  findRuleById(em: EntityManager, id: string): Promise<SodRules | null> {
    return em.findOne(SodRules, { id });
  }

  /**
   * Crea una regla (de organización, o de plataforma si no trae `tenantId`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la regla.
   * @returns La regla creada (aún sin flush).
   */
  createRule(em: EntityManager, data: CreateSodRuleData): SodRules {
    return em.create(
      SodRules,
      {
        ...(data.id ? { id: data.id } : {}),
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        baseRuleId: data.baseRuleId,
        atomsAJson: [...data.atomsA],
        atomsBJson: [...data.atomsB],
        scopeConceptId: data.scopeConceptId,
        actionConceptId: data.actionConceptId,
        isHard: data.isHard ?? false,
        maxExceptionDays: data.maxExceptionDays,
        rationaleText: data.rationaleText,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        versionNumber: data.versionNumber ?? 1,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Excepciones activas y vigentes de una organización (o de ciertos vínculos).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param now - Instante de evaluación.
   * @param assignmentIds - Solo estos vínculos; ausente = toda la organización.
   * @returns Las excepciones vigentes.
   */
  findActiveExceptions(
    em: EntityManager,
    tenantId: string,
    now: Date,
    assignmentIds?: readonly string[],
  ): Promise<SodExceptions[]> {
    return em.find(
      SodExceptions,
      {
        tenantId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: { $lte: now },
        validTo: { $gt: now },
        ...(assignmentIds
          ? { organizationUserAssignmentId: { $in: [...assignmentIds] } }
          : {}),
      },
      { orderBy: { validTo: 'asc', id: 'asc' } },
    );
  }

  /**
   * Excepción por id, acotada a la organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param id - Id de la excepción.
   * @returns La excepción o `null`.
   */
  findExceptionById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<SodExceptions | null> {
    return em.findOne(SodExceptions, { tenantId, id });
  }

  /**
   * Crea una excepción activa.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la excepción.
   * @returns La excepción creada (aún sin flush).
   */
  createException(
    em: EntityManager,
    data: CreateSodExceptionData,
  ): SodExceptions {
    return em.create(
      SodExceptions,
      {
        tenantId: data.tenantId,
        sodRuleId: data.sodRuleId,
        organizationUserAssignmentId: data.organizationUserAssignmentId,
        fourEyesRequestId: data.fourEyesRequestId,
        justificationText: data.justificationText,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Revoca una excepción antes de su vencimiento.
   *
   * @param row - Excepción a revocar.
   * @param actorUserId - Quien la revoca.
   * @param reason - Por qué.
   * @param now - Instante de la revocación.
   */
  revokeException(
    row: SodExceptions,
    actorUserId: string | undefined,
    reason: string,
    now: Date,
  ): void {
    row.statusConceptId = CONCEPTS.STATE_REVOKED;
    row.revokedAt = now;
    row.revokedByUserId = actorUserId;
    row.revokeReasonText = reason;
    row.updatedAt = now;
    row.updatedByUserId = actorUserId;
  }

  /**
   * Marca una excepción como vencida (la llama el barrido, una organización a la vez).
   *
   * @param row - Excepción vencida.
   * @param now - Instante del barrido.
   */
  markExpired(row: SodExceptions, now: Date): void {
    row.statusConceptId = CONCEPTS.STATE_EXPIRED;
    row.updatedAt = now;
  }

  /**
   * Excepciones activas ya vencidas de TODAS las organizaciones (solo lectura,
   * para el barrido de vencimientos). Con RLS abre el contexto de sistema solo
   * mientras lee; la escritura de cada una la hace el barrido dentro de la
   * organización de la fila.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param now - Instante del barrido.
   * @param limit - Tope de filas por pasada.
   * @returns Las excepciones vencidas, las más antiguas primero.
   */
  findDueExceptionsAcrossTenants(
    em: EntityManager,
    now: Date,
    limit: number,
  ): Promise<SodExceptions[]> {
    return withSystemRead(em, (db) =>
      db.find(
        SodExceptions,
        { statusConceptId: CONCEPTS.STATE_ACTIVE, validTo: { $lte: now } },
        { orderBy: { validTo: 'asc', id: 'asc' }, limit },
      ),
    );
  }
}
