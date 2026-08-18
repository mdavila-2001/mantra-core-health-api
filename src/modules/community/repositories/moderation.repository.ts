import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ContentReports,
  ModerationQueue,
  ModerationDecisions,
  ModerationStrikes,
  ModerationAppeals,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create report data.
 */
export interface CreateReportData {
  /**
   * Identificador asociado a reporter user.
   */
  reporterUserId: string;
  /**
   * Identificador asociado a target type concept.
   */
  targetTypeConceptId: string;
  /**
   * Identificador asociado a target.
   */
  targetId: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId: string;
  /**
   * Valor de detail text mantenido por la instancia.
   */
  detailText?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
}

/**
 * Describe el contrato estructural de create queue data.
 */
export interface CreateQueueData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a content type concept.
   */
  contentTypeConceptId: string;
  /**
   * Identificador asociado a content ref.
   */
  contentRefId: string;
  /**
   * Identificador asociado a source concept.
   */
  sourceConceptId: string;
  /**
   * Identificador asociado a content report.
   */
  contentReportId?: string;
  /**
   * Identificador asociado a priority concept.
   */
  priorityConceptId?: string;
  /**
   * Valor de ml score mantenido por la instancia.
   */
  mlScore?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create decision data.
 */
export interface CreateDecisionData {
  /**
   * Identificador asociado a moderation queue.
   */
  moderationQueueId: string;
  /**
   * Identificador asociado a decision concept.
   */
  decisionConceptId: string;
  /**
   * Identificador asociado a policy concept.
   */
  policyConceptId: string;
  /**
   * Valor de rationale text mantenido por la instancia.
   */
  rationaleText?: string;
  /**
   * Identificador asociado a action taken concept.
   */
  actionTakenConceptId?: string;
  /**
   * Identificador asociado a decided by user.
   */
  decidedByUserId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create strike data.
 */
export interface CreateStrikeData {
  /**
   * Identificador asociado a subject profile.
   */
  subjectProfileId: string;
  /**
   * Identificador asociado a moderation decision.
   */
  moderationDecisionId: string;
  /**
   * Identificador asociado a severity concept.
   */
  severityConceptId: string;
  /**
   * Valor de points mantenido por la instancia.
   */
  points: number;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create appeal data.
 */
export interface CreateAppealData {
  /**
   * Identificador asociado a moderation decision.
   */
  moderationDecisionId: string;
  /**
   * Identificador asociado a appellant profile.
   */
  appellantProfileId: string;
  /**
   * Valor de reason text mantenido por la instancia.
   */
  reasonText: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de reportes, cola de moderación, decisiones, strikes y apelaciones. */
@Injectable()
export class ModerationRepository {
  // --- Reports ---
  /**
   * Crea create report.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create report conforme al contrato `ContentReports`.
   */
  createReport(em: EntityManager, data: CreateReportData): ContentReports {
    return em.create(
      ContentReports,
      {
        reporterUserId: data.reporterUserId,
        targetTypeConceptId: data.targetTypeConceptId,
        targetId: data.targetId,
        reasonConceptId: data.reasonConceptId,
        detailText: data.detailText,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find reports by target.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param targetId - Identificador de target.
   * @returns Resultado de find reports by target conforme al contrato `Promise<ContentReports[]>`.
   */
  findReportsByTarget(
    em: EntityManager,
    targetId: string,
  ): Promise<ContentReports[]> {
    return em.find(ContentReports, { targetId });
  }

  // --- Queue ---
  /**
   * Obtiene find queue by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find queue by id conforme al contrato `Promise<ModerationQueue | null>`.
   */
  findQueueById(
    em: EntityManager,
    id: string,
  ): Promise<ModerationQueue | null> {
    return em.findOne(ModerationQueue, { id });
  }

  /** Entrada de cola abierta para un contenido (dedup por content_ref). */
  findOpenQueueForContent(
    em: EntityManager,
    contentRefId: string,
    excludeResolvedStatusConceptId: string,
  ): Promise<ModerationQueue | null> {
    return em.findOne(ModerationQueue, {
      contentRefId,
      statusConceptId: { $ne: excludeResolvedStatusConceptId },
    });
  }

  /**
   * Crea create queue.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create queue conforme al contrato `ModerationQueue`.
   */
  createQueue(em: EntityManager, data: CreateQueueData): ModerationQueue {
    return em.create(
      ModerationQueue,
      {
        tenantId: data.tenantId,
        contentTypeConceptId: data.contentTypeConceptId,
        contentRefId: data.contentRefId,
        sourceConceptId: data.sourceConceptId,
        contentReportId: data.contentReportId,
        priorityConceptId: data.priorityConceptId,
        mlScore: data.mlScore,
        statusConceptId: data.statusConceptId,
        queuedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Decisions ---
  /**
   * Obtiene find decision by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find decision by id conforme al contrato `Promise<ModerationDecisions | null>`.
   */
  findDecisionById(
    em: EntityManager,
    id: string,
  ): Promise<ModerationDecisions | null> {
    return em.findOne(ModerationDecisions, { id });
  }

  /**
   * Crea create decision.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create decision conforme al contrato `ModerationDecisions`.
   */
  createDecision(
    em: EntityManager,
    data: CreateDecisionData,
  ): ModerationDecisions {
    return em.create(
      ModerationDecisions,
      {
        moderationQueueId: data.moderationQueueId,
        decisionConceptId: data.decisionConceptId,
        policyConceptId: data.policyConceptId,
        rationaleText: data.rationaleText,
        actionTakenConceptId: data.actionTakenConceptId,
        decidedByUserId: data.decidedByUserId,
        decidedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Strikes ---
  /**
   * Crea create strike.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create strike conforme al contrato `ModerationStrikes`.
   */
  createStrike(em: EntityManager, data: CreateStrikeData): ModerationStrikes {
    return em.create(
      ModerationStrikes,
      {
        subjectProfileId: data.subjectProfileId,
        moderationDecisionId: data.moderationDecisionId,
        severityConceptId: data.severityConceptId,
        points: data.points,
        expiresAt: data.expiresAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Appeals ---
  /**
   * Crea create appeal.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create appeal conforme al contrato `ModerationAppeals`.
   */
  createAppeal(em: EntityManager, data: CreateAppealData): ModerationAppeals {
    return em.create(
      ModerationAppeals,
      {
        moderationDecisionId: data.moderationDecisionId,
        appellantProfileId: data.appellantProfileId,
        reasonText: data.reasonText,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find open appeal for decision.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param moderationDecisionId - Identificador de moderation decision.
   * @param openStatusConceptId - Identificador de open status concept.
   * @returns Resultado de find open appeal for decision conforme al contrato `Promise<ModerationAppeals | null>`.
   */
  findOpenAppealForDecision(
    em: EntityManager,
    moderationDecisionId: string,
    openStatusConceptId: string,
  ): Promise<ModerationAppeals | null> {
    return em.findOne(ModerationAppeals, {
      moderationDecisionId,
      statusConceptId: openStatusConceptId,
    });
  }

  /**
   * Una apelación por su id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la apelación.
   * @returns La apelación, o `null`.
   */
  findAppealById(
    em: EntityManager,
    id: string,
  ): Promise<ModerationAppeals | null> {
    return em.findOne(ModerationAppeals, { id });
  }

  // --- Lecturas de la cola de trabajo (UC-19-09/10, cara de lectura) ---
  //
  // Sin estas tres, la moderación se podía **decidir** pero no **trabajar**: un
  // moderador podía resolver una entrada cuyo uuid ya conociera, y no había
  // forma de saber qué entradas había. Una cola que no se puede leer no es una
  // cola.

  /**
   * Página de la cola de moderación, con filtros de trabajo.
   *
   * ## Orden y determinismo
   *
   * Ordena por prioridad declarada y luego por antigüedad —lo urgente primero,
   * y a igual urgencia lo que lleva más tiempo esperando—. El desempate final es
   * por `id`, y no es un adorno: sin él, dos filas con el mismo instante podrían
   * salir en orden distinto entre dos páginas y el cursor saltearía una o
   * repetiría otra.
   *
   * `queued_at` puede ser nulo en filas viejas, así que el orden usa
   * `coalesce(queued_at, created_at)`: una entrada sin marca de encolado no
   * puede irse al final de la cola para siempre.
   *
   * El `tenantId` es **obligatorio y no opcional**, igual que en `groups`: la
   * cola es el listado abierto de una tabla con `tenant_id`, así que servirla
   * sin acotar mostraría a un moderador el contenido reportado de otra
   * organización. `SECURITY_ADMIN` es un rol **global de plataforma**, de modo
   * que el rol por sí solo no acota nada — el límite lo pone el tenant del
   * contexto del request.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización cuya cola se lee.
   * @param filtros - Estado, prioridad, tipo de contenido y antigüedad mínima.
   * @param after - Clave de continuación `(queuedAt, id)`.
   * @param limit - Tope de filas.
   * @returns Página de entradas de cola.
   */
  async listQueuePage(
    em: EntityManager,
    tenantId: string,
    filtros: {
      /** Estados admitidos; vacío o ausente significa todos. */
      statusConceptIds?: string[];
      /** Prioridades admitidas; vacío o ausente significa todas. */
      priorityConceptIds?: string[];
      /** Tipos de contenido admitidos; vacío o ausente significa todos. */
      contentTypeConceptIds?: string[];
      /** Sólo lo encolado antes de este instante (antigüedad mínima). */
      queuedBefore?: Date;
    },
    after: { queuedAt: string; id: string } | undefined,
    limit: number,
  ): Promise<ModerationQueue[]> {
    const where: Record<string, unknown> = { tenantId };
    if (filtros.statusConceptIds?.length) {
      where.statusConceptId = { $in: filtros.statusConceptIds };
    }
    if (filtros.priorityConceptIds?.length) {
      where.priorityConceptId = { $in: filtros.priorityConceptIds };
    }
    if (filtros.contentTypeConceptIds?.length) {
      where.contentTypeConceptId = { $in: filtros.contentTypeConceptIds };
    }
    if (filtros.queuedBefore) {
      where.queuedAt = { $lte: filtros.queuedBefore };
    }
    if (after) {
      // Keyset sobre `(queuedAt, id)` ascendente: lo más viejo primero.
      where.$or = [
        { queuedAt: { $gt: new Date(after.queuedAt) } },
        { queuedAt: new Date(after.queuedAt), id: { $gt: after.id } },
      ];
    }

    return em.find(ModerationQueue, where, {
      orderBy: { queuedAt: 'ASC', id: 'ASC' },
      limit,
    });
  }

  /**
   * Los reportes que originaron un conjunto de entradas de cola.
   *
   * Da el contexto que el moderador necesita —razón declarada y detalle— sin
   * una consulta por fila.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Identificadores de reporte.
   * @returns Los reportes encontrados.
   */
  listReportsByIds(
    em: EntityManager,
    ids: string[],
  ): Promise<ContentReports[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(ContentReports, { id: { $in: ids } });
  }

  /**
   * Cuántos reportes tiene cada contenido de una página.
   *
   * Diez personas reportando lo mismo es una señal distinta de una sola, y la
   * cola deduplica por contenido: sin este recuento, las dos entradas se ven
   * iguales.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param contentRefIds - Contenidos de la página.
   * @returns Pares contenido → cantidad de reportes.
   */
  async countReportsByContent(
    em: EntityManager,
    contentRefIds: string[],
  ): Promise<{ targetId: string; count: number }[]> {
    if (contentRefIds.length === 0) return [];
    const rows = await em
      .getConnection()
      .execute<Array<{ target_id: string; count: number }>>(
        `select target_id, count(*)::int as count
           from community.content_reports
          where target_id = any(?)
          group by target_id`,
        [contentRefIds],
        'all',
      );
    return rows.map((row) => ({ targetId: row.target_id, count: row.count }));
  }

  /**
   * Página de decisiones tomadas, de la más reciente hacia atrás.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filtros - Cola concreta o decisión concreta, si se acota.
   * @param after - Clave de continuación `(decidedAt, id)`.
   * @param limit - Tope de filas.
   * @returns Página de decisiones.
   */
  listDecisionsPage(
    em: EntityManager,
    filtros: {
      /** Acota a una entrada de cola. */
      moderationQueueId?: string;
      /** Acota a un tipo de decisión. */
      decisionConceptIds?: string[];
    },
    after: { decidedAt: string; id: string } | undefined,
    limit: number,
  ): Promise<ModerationDecisions[]> {
    const where: Record<string, unknown> = {};
    if (filtros.moderationQueueId) {
      where.moderationQueueId = filtros.moderationQueueId;
    }
    if (filtros.decisionConceptIds?.length) {
      where.decisionConceptId = { $in: filtros.decisionConceptIds };
    }
    if (after) {
      // Descendente: lo último decidido es lo que un moderador quiere revisar.
      where.$or = [
        { decidedAt: { $lt: new Date(after.decidedAt) } },
        { decidedAt: new Date(after.decidedAt), id: { $lt: after.id } },
      ];
    }

    return em.find(ModerationDecisions, where, {
      orderBy: { decidedAt: 'DESC', id: 'DESC' },
      limit,
    });
  }

  /**
   * Las decisiones de un conjunto de ids, para hidratar apelaciones.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Identificadores de decisión.
   * @returns Las decisiones encontradas.
   */
  listDecisionsByIds(
    em: EntityManager,
    ids: string[],
  ): Promise<ModerationDecisions[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(ModerationDecisions, { id: { $in: ids } });
  }

  /**
   * Página de apelaciones, de la más antigua hacia adelante.
   *
   * Ascendente y no descendente como las decisiones: una apelación es trabajo
   * **pendiente**, y el trabajo pendiente se atiende por orden de llegada.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filtros - Estado y apelante, si se acota.
   * @param after - Clave de continuación `(createdAt, id)`.
   * @param limit - Tope de filas.
   * @returns Página de apelaciones.
   */
  listAppealsPage(
    em: EntityManager,
    filtros: {
      /** Estados admitidos; vacío o ausente significa todos. */
      statusConceptIds?: string[];
      /** Acota a un apelante concreto. */
      appellantProfileId?: string;
    },
    after: { createdAt: string; id: string } | undefined,
    limit: number,
  ): Promise<ModerationAppeals[]> {
    const where: Record<string, unknown> = {};
    if (filtros.statusConceptIds?.length) {
      where.statusConceptId = { $in: filtros.statusConceptIds };
    }
    if (filtros.appellantProfileId) {
      where.appellantProfileId = filtros.appellantProfileId;
    }
    if (after) {
      where.$or = [
        { createdAt: { $gt: new Date(after.createdAt) } },
        { createdAt: new Date(after.createdAt), id: { $gt: after.id } },
      ];
    }

    return em.find(ModerationAppeals, where, {
      orderBy: { createdAt: 'ASC', id: 'ASC' },
      limit,
    });
  }
}
