import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SharedAccessLinks, SharedAccessLinkUses } from '../entities';
import { MedicationRequests } from '../../clinical/entities';
import { DELEG } from '../delegated_access.concepts';

/** Lo que hace falta para insertar un enlace compartido. */
export interface CreateSharedAccessLinkData {
  /** Tenant custodio de la receta compartida. */
  tenantId: string;
  /** Paciente dueño de la receta. */
  patientProfileId: string;
  /** `DELEG.SHARE_RESOURCE_*`: consulta o fármaco suelto. */
  resourceTypeConceptId: string;
  /** Encuentro o `medication_request` compartido. */
  resourceId: string;
  /** SHA-256 del token; el claro nunca llega acá. */
  tokenHash: string;
  /** `DELEG.SHARE_SCOPE_*`. */
  scopeConceptId: string;
  /** Vencimiento calculado (S-5). */
  expiresAt: Date;
  /** Estado inicial (`CONCEPTS.STATE_ACTIVE`). */
  statusConceptId: string;
  /** Usuario que lo crea. */
  actorUserId: string;
}

/** Un uso del enlace, para el registro append-only. */
export interface AppendSharedAccessLinkUseData {
  /** Enlace usado. */
  sharedAccessLinkId: string;
  /** `DELEG.SHARE_ACTION_*`. */
  actionConceptId: string;
  /** `DELEG.SHARE_OUTCOME_*`. */
  outcomeConceptId: string;
  /** IP de origen (columna `inet`), si es una IP válida. */
  sourceIp?: string;
  /** Agente de usuario, ya recortado. */
  userAgent?: string;
  /** Instante del uso. */
  occurredAt: Date;
}

/**
 * Acceso a datos de `delegated_access.shared_access_links` y de su registro de
 * usos `shared_access_link_uses` (append-only: solo se insertan filas).
 *
 * También lee los ítems de receta que un enlace comparte: son las filas de
 * `clinical.medication_requests` que su `resource_id` identifica, la misma
 * lectura cruzada de solo lectura que ya hace `DelegationScopeRepository`.
 */
@Injectable()
export class SharedAccessLinksRepository {
  /**
   * Inserta un enlace (queda pendiente del `flush` de la transacción).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Columnas del enlace.
   * @returns La entidad creada.
   */
  create(
    em: EntityManager,
    data: CreateSharedAccessLinkData,
  ): SharedAccessLinks {
    const now = new Date();
    return em.create(
      SharedAccessLinks,
      {
        tenantId: data.tenantId,
        patientProfileId: data.patientProfileId,
        resourceTypeConceptId: data.resourceTypeConceptId,
        resourceId: data.resourceId,
        tokenHash: data.tokenHash,
        scopeConceptId: data.scopeConceptId,
        expiresAt: data.expiresAt,
        statusConceptId: data.statusConceptId,
        createdAt: now,
        updatedAt: now,
        createdByUserId: data.actorUserId,
        updatedByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }

  /**
   * Enlace por el hash de su token.
   *
   * @param em - Contexto de persistencia.
   * @param tokenHash - SHA-256 del token.
   * @returns El enlace, o `null`.
   */
  findByTokenHash(
    em: EntityManager,
    tokenHash: string,
  ): Promise<SharedAccessLinks | null> {
    return em.findOne(SharedAccessLinks, { tokenHash });
  }

  /**
   * Enlace por su id.
   *
   * @param em - Contexto de persistencia.
   * @param id - Id del enlace.
   * @returns El enlace, o `null`.
   */
  findById(em: EntityManager, id: string): Promise<SharedAccessLinks | null> {
    return em.findOne(SharedAccessLinks, { id });
  }

  /**
   * Enlaces de receta de un paciente, del más nuevo al más viejo.
   *
   * @param em - Contexto de persistencia.
   * @param patientProfileId - Paciente dueño.
   * @param createdByUserId - Si viene, solo los que creó ese usuario.
   * @returns Los enlaces.
   */
  findByPatient(
    em: EntityManager,
    patientProfileId: string,
    createdByUserId?: string,
  ): Promise<SharedAccessLinks[]> {
    return em.find(
      SharedAccessLinks,
      {
        patientProfileId,
        resourceTypeConceptId: {
          $in: [
            DELEG.SHARE_RESOURCE_PRESCRIPTION_ENCOUNTER,
            DELEG.SHARE_RESOURCE_MEDICATION_REQUEST,
          ],
        },
        ...(createdByUserId ? { createdByUserId } : {}),
      },
      { orderBy: { createdAt: 'DESC', id: 'DESC' } },
    );
  }

  /**
   * Aperturas `OPENED` por enlace.
   *
   * @param em - Contexto de persistencia.
   * @param linkIds - Enlaces a contar.
   * @returns Cantidad por id de enlace (los que no tienen, ausentes).
   */
  async countOpenedByLinkIds(
    em: EntityManager,
    linkIds: readonly string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (linkIds.length === 0) return counts;
    const uses = await em.find(
      SharedAccessLinkUses,
      {
        sharedAccessLinkId: { $in: [...linkIds] },
        actionConceptId: DELEG.SHARE_ACTION_OPEN,
        outcomeConceptId: DELEG.SHARE_OUTCOME_OPENED,
      },
      { fields: ['id', 'sharedAccessLinkId'] },
    );
    for (const use of uses) {
      counts.set(
        use.sharedAccessLinkId,
        (counts.get(use.sharedAccessLinkId) ?? 0) + 1,
      );
    }
    return counts;
  }

  /**
   * Registra un uso del enlace (queda pendiente del `flush`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Acción, resultado y origen del uso.
   * @returns La fila creada.
   */
  appendUse(
    em: EntityManager,
    data: AppendSharedAccessLinkUseData,
  ): SharedAccessLinkUses {
    return em.create(
      SharedAccessLinkUses,
      {
        sharedAccessLinkId: data.sharedAccessLinkId,
        actionConceptId: data.actionConceptId,
        outcomeConceptId: data.outcomeConceptId,
        sourceIp: data.sourceIp,
        userAgent: data.userAgent,
        occurredAt: data.occurredAt,
        createdAt: data.occurredAt,
      },
      { partial: true },
    );
  }

  /**
   * Ítems de receta de un encuentro, ordenados como los lee el PDF.
   *
   * @param em - Contexto de persistencia.
   * @param encounterId - Encuentro de la receta.
   * @returns Sus `medication_requests`, en cualquier estado.
   */
  findItemsByEncounter(
    em: EntityManager,
    encounterId: string,
  ): Promise<MedicationRequests[]> {
    return em.find(
      MedicationRequests,
      { encounterId },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    );
  }

  /**
   * Un ítem de receta por su id.
   *
   * @param em - Contexto de persistencia.
   * @param id - Id del `medication_request`.
   * @returns El ítem, o `null`.
   */
  findItemById(
    em: EntityManager,
    id: string,
  ): Promise<MedicationRequests | null> {
    return em.findOne(MedicationRequests, { id });
  }

  /**
   * Ítems de varios recursos compartidos a la vez (la lista de enlaces).
   *
   * @param em - Contexto de persistencia.
   * @param encounterIds - Encuentros compartidos.
   * @param itemIds - `medication_requests` compartidos sueltos.
   * @returns Todas sus filas, en cualquier estado.
   */
  async findItemsForResources(
    em: EntityManager,
    encounterIds: readonly string[],
    itemIds: readonly string[],
  ): Promise<MedicationRequests[]> {
    const criteria = [
      ...(encounterIds.length > 0
        ? [{ encounterId: { $in: [...encounterIds] } }]
        : []),
      ...(itemIds.length > 0 ? [{ id: { $in: [...itemIds] } }] : []),
    ];
    if (criteria.length === 0) return [];
    return em.find(
      MedicationRequests,
      { $or: criteria },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    );
  }
}
