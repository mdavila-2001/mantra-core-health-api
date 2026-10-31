import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy, withSystemRead } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { FourEyesRequests } from '../entities';

/** Datos para crear una solicitud de cuatro ojos. */
export interface CreateFourEyesRequestData {
  /** Organización (la del contexto verificado). */
  readonly tenantId: string;
  /** Concepto del tipo de solicitud (`FOUR_EYES_KIND_*`). */
  readonly kindConceptId: string;
  /** Quien pide. */
  readonly requesterUserId: string;
  /** Persona sobre la que se pide (si la hay). */
  readonly subjectUserId?: string;
  /** Vínculo afectado (si lo hay). */
  readonly organizationUserAssignmentId?: string;
  /** Átomo sobre el que se pide (si lo hay). */
  readonly permissionCode?: string;
  /** Concepto de quién debe aprobar (`authz:APPROVAL_*`). */
  readonly approverKindConceptId: string;
  /** Cuerpo de lo que se aprueba (sin datos del paciente). */
  readonly payload: unknown;
  /** SHA-256 hexadecimal del cuerpo canónico. */
  readonly payloadHash: string;
  /** Versión del esquema del cuerpo. */
  readonly payloadSchemaVersion: number;
  /** Motivo escrito por quien pide. */
  readonly reasonText?: string;
  /** Caducidad de la solicitud. */
  readonly expiresAt: Date;
  /** Quien la crea. */
  readonly actorUserId?: string;
}

/** Llave de la unicidad parcial de solicitudes pendientes. */
export interface FourEyesDuplicateKey {
  /** Organización. */
  readonly tenantId: string;
  /** Concepto del tipo. */
  readonly kindConceptId: string;
  /** Quien pide. */
  readonly requesterUserId: string;
  /** Átomo (ausente = vacío). */
  readonly permissionCode?: string;
  /** Hash del cuerpo. */
  readonly payloadHash: string;
}

/** Acceso a datos de `delegated_access.four_eyes_requests`. */
@Injectable()
export class FourEyesRepository {
  /**
   * Solicitud por id, acotada a la organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param id - Id de la solicitud.
   * @returns La solicitud o `null`.
   */
  findById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<FourEyesRequests | null> {
    return em.findOne(FourEyesRequests, { tenantId, id });
  }

  /**
   * Solicitudes pendientes de una organización, las que caducan antes primero
   * (orden estable por `expires_at, id`), con paginación por cursor.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param limit - Tope de filas.
   * @param options - `after`: cursor (última fila vista); `excludeRequesterUserId`:
   *   no trae las de esa persona; `notExpiredAt`: solo las que vencen después.
   * @returns Las solicitudes pendientes.
   */
  findPendingByTenant(
    em: EntityManager,
    tenantId: string,
    limit: number,
    options: {
      readonly after?: { readonly expiresAt: Date; readonly id: string };
      readonly excludeRequesterUserId?: string;
      readonly notExpiredAt?: Date;
    } = {},
  ): Promise<FourEyesRequests[]> {
    const extra: Record<string, unknown>[] = [];
    if (options.excludeRequesterUserId) {
      extra.push({
        requesterUserId: { $ne: options.excludeRequesterUserId },
      });
    }
    if (options.notExpiredAt) {
      extra.push({ expiresAt: { $gt: options.notExpiredAt } });
    }
    if (options.after) {
      const { expiresAt, id } = options.after;
      extra.push({
        $or: [
          { expiresAt: { $gt: expiresAt } },
          { expiresAt, id: { $gt: id } },
        ],
      });
    }
    const base = { tenantId, statusConceptId: DELEG.FOUR_EYES_PENDING };
    return em.find(
      FourEyesRequests,
      extra.length > 0 ? { $and: [base, ...extra] } : base,
      { orderBy: { expiresAt: 'asc', id: 'asc' }, limit },
    );
  }

  /**
   * Cuántas solicitudes de ACCIÓN pendientes y VIGENTES tiene una persona en la
   * organización (para topar la cola: una sola persona no la llena). No cuenta lo
   * vencido —sigue `PENDING` hasta el barrido diario, pero ya no ocupa lugar— ni
   * las solicitudes administrativas (`GRANT_CHANGE`, `REACTIVATION`…), que no son
   * cola de aprobadores de acciones.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param requesterUserId - Quien pidió.
   * @param now - Instante de la comprobación.
   * @returns La cantidad.
   */
  countPendingByRequester(
    em: EntityManager,
    tenantId: string,
    requesterUserId: string,
    now: Date = new Date(),
  ): Promise<number> {
    return em.count(FourEyesRequests, {
      tenantId,
      requesterUserId,
      statusConceptId: DELEG.FOUR_EYES_PENDING,
      kindConceptId: DELEG.FOUR_EYES_KIND_ACTION,
      expiresAt: { $gt: now },
    });
  }

  /**
   * Cerrojo de la cola de un solicitante (N-3): un advisory lock de la
   * TRANSACCIÓN, por organización y persona. Quien lo toma antes de contar y
   * crear hace que «contar y crear» sea atómico frente a otras peticiones del
   * mismo solicitante (se libera solo al confirmar o revertir). No bloquea a
   * otras personas.
   *
   * @param em - Transacción activa.
   * @param tenantId - Organización.
   * @param requesterUserId - Quien pide.
   */
  async lockRequesterQueue(
    em: EntityManager,
    tenantId: string,
    requesterUserId: string,
  ): Promise<void> {
    await em.execute('select pg_advisory_xact_lock(hashtextextended(?, 0))', [
      `four_eyes_queue:${tenantId}:${requesterUserId}`,
    ]);
  }

  /**
   * Solicitudes que una persona pidió (de cualquier organización; con RLS se
   * llama dentro del contexto de sistema de lectura de la propia persona),
   * las más recientes primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param requesterUserId - Quien pidió.
   * @param limit - Tope de filas.
   * @returns Las solicitudes de la persona.
   */
  findByRequester(
    em: EntityManager,
    requesterUserId: string,
    limit: number,
  ): Promise<FourEyesRequests[]> {
    return em.find(
      FourEyesRequests,
      { requesterUserId },
      { orderBy: { createdAt: 'desc', id: 'asc' }, limit },
    );
  }

  /**
   * Solicitud pendiente idéntica (misma llave que `uq_four_eyes_requests_pending_payload`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param key - Llave de unicidad.
   * @returns La solicitud pendiente o `null`.
   */
  findPendingDuplicate(
    em: EntityManager,
    key: FourEyesDuplicateKey,
  ): Promise<FourEyesRequests | null> {
    return em.findOne(FourEyesRequests, {
      tenantId: key.tenantId,
      kindConceptId: key.kindConceptId,
      requesterUserId: key.requesterUserId,
      permissionCode: key.permissionCode ?? null,
      payloadHash: key.payloadHash,
      statusConceptId: DELEG.FOUR_EYES_PENDING,
    });
  }

  /**
   * Crea una solicitud pendiente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la solicitud.
   * @returns La solicitud creada (aún sin flush).
   */
  create(em: EntityManager, data: CreateFourEyesRequestData): FourEyesRequests {
    return em.create(
      FourEyesRequests,
      {
        tenantId: data.tenantId,
        kindConceptId: data.kindConceptId,
        requesterUserId: data.requesterUserId,
        subjectUserId: data.subjectUserId,
        organizationUserAssignmentId: data.organizationUserAssignmentId,
        permissionCode: data.permissionCode,
        approverKindConceptId: data.approverKindConceptId,
        payloadJson: data.payload,
        payloadHash: data.payloadHash,
        payloadSchemaVersion: data.payloadSchemaVersion,
        reasonText: data.reasonText,
        statusConceptId: DELEG.FOUR_EYES_PENDING,
        expiresAt: data.expiresAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * CONSUME una aprobación de acción UNA sola vez: una única actualización
   * condicionada a «aprobada, sin consumir y vigente». Con diez usos
   * simultáneos gana uno; el resto recibe `false`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Id de la solicitud aprobada.
   * @param now - Instante del uso.
   * @returns `true` si esta llamada la consumió.
   */
  async consume(em: EntityManager, id: string, now: Date): Promise<boolean> {
    const affected = await em.nativeUpdate(
      FourEyesRequests,
      {
        id,
        statusConceptId: DELEG.FOUR_EYES_APPROVED,
        consumedAt: null,
        $or: [{ approvedUntil: null }, { approvedUntil: { $gt: now } }],
      },
      { consumedAt: now, updatedAt: now },
    );
    return affected > 0;
  }

  /**
   * Vence una aprobación de acción que nadie usó a tiempo: una única
   * actualización condicionada a «aprobada, sin consumir». Es lo que la política
   * hace al ver que `approved_until` ya pasó, para que la solicitud deje de
   * parecer utilizable.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Id de la solicitud aprobada y vencida.
   * @param now - Instante del vencimiento.
   * @returns `true` si esta llamada la venció.
   */
  async expireApproved(
    em: EntityManager,
    id: string,
    now: Date,
  ): Promise<boolean> {
    const affected = await em.nativeUpdate(
      FourEyesRequests,
      { id, statusConceptId: DELEG.FOUR_EYES_APPROVED, consumedAt: null },
      { statusConceptId: DELEG.FOUR_EYES_EXPIRED, updatedAt: now },
    );
    return affected > 0;
  }

  /**
   * Marca una solicitud como vencida.
   *
   * @param row - Solicitud pendiente cuya caducidad pasó.
   * @param now - Instante del barrido.
   */
  markExpired(row: FourEyesRequests, now: Date): void {
    row.statusConceptId = DELEG.FOUR_EYES_EXPIRED;
    row.updatedAt = now;
  }

  /**
   * Solicitudes pendientes ya caducadas de TODAS las organizaciones (solo
   * lectura, para el barrido). Con RLS abre el contexto de sistema solo
   * mientras lee; el cierre de cada una lo hace el barrido en su organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param now - Instante del barrido.
   * @param limit - Tope de filas por pasada.
   * @returns Las solicitudes caducadas, las más antiguas primero.
   */
  findExpiredPendingAcrossTenants(
    em: EntityManager,
    now: Date,
    limit: number,
  ): Promise<FourEyesRequests[]> {
    return withSystemRead(em, (db) =>
      db.find(
        FourEyesRequests,
        {
          statusConceptId: DELEG.FOUR_EYES_PENDING,
          expiresAt: { $lte: now },
        },
        { orderBy: { expiresAt: 'asc', id: 'asc' }, limit },
      ),
    );
  }
}
