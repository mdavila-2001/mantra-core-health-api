import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { ModerationRepository } from '../repositories';
import { CommunityVisibilityService } from './community-visibility.service';
import {
  APPEAL_STATUS_BY_CODE,
  CONTENT_TYPE_BY_CODE,
  MODERATION_DECISION_BY_CODE,
  QUEUE_PRIORITY_BY_CODE,
  QUEUE_STATUS_BY_CODE,
} from '../community.concepts';
import type {
  ModerationAppealItemDto,
  ModerationAppealPageDto,
  ModerationAppealsQueryDto,
  ModerationDecisionItemDto,
  ModerationDecisionPageDto,
  ModerationDecisionsQueryDto,
  ModerationQueuePageDto,
  ModerationQueueQueryDto,
  MyModerationDecisionPageDto,
  MyModerationDecisionsQueryDto,
} from '../dto';
import type { ModerationDecisions } from '../entities';

/** Milisegundos en una hora, para traducir la antigüedad pedida a un instante. */
const UNA_HORA_MS = 60 * 60 * 1000;

/**
 * Cara de lectura de la moderación (UC-19-09/10).
 *
 * ## Por qué existe
 *
 * El módulo podía **decidir** sobre una entrada de cola y **resolver** una
 * apelación, pero no había forma de saber qué entradas había: cero `GET` sobre
 * `moderation_queue`, `moderation_decisions` y `moderation_appeals`. En la
 * práctica, un moderador sólo podía actuar sobre un uuid que ya conociera por
 * otro medio. Una cola que no se puede leer no es una cola.
 *
 * ## Todo pasa por rol, y el rol lo comprueba el guard
 *
 * Estas tres lecturas exponen contenido reportado, motivos escritos por
 * usuarios y quién decidió qué. El `@Roles('SECURITY_ADMIN')` vive en el
 * controlador porque es donde el guard lo lee; acá no se vuelve a comprobar para
 * no dejar dos verdades sobre quién puede leer.
 *
 * ## Los filtros llegan por código, no por uuid
 *
 * La pantalla filtra por `QUEUED` o `HIGH`, no por el uuid del concepto: pedirle
 * uuids la ataría a la semilla de terminología de cada ambiente. La traducción
 * se hace acá, y un código fuera del enum ya lo rechazó el `ValidationPipe`.
 */
@Injectable()
export class CommunityModerationReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param moderationRepo - Acceso a cola, decisiones, reportes y apelaciones.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly moderationRepo: ModerationRepository,
    private readonly visibility: CommunityVisibilityService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityModerationReadService.name);
  }

  /**
   * Página de la cola de moderación, con su contexto de reporte.
   *
   * Se acota al tenant del contexto: `SECURITY_ADMIN` es un rol global de
   * plataforma, así que sin esto un moderador veía el contenido reportado de
   * todas las organizaciones. Si el request no fijó tenant, `requireTenantId()`
   * lo dice (422) en vez de devolver una página vacía, que sería mentir sobre
   * el motivo.
   *
   * @param query - Filtros, cursor y tope.
   * @param limit - Tope efectivo ya resuelto por el controlador.
   * @returns Página de entradas con el reporte que las originó.
   */
  async listQueue(
    query: ModerationQueueQueryDto,
    limit: number,
  ): Promise<ModerationQueuePageDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();

    const after = query.cursor ? decodeKeysetCursor(query.cursor) : undefined;
    const afterKey =
      typeof after?.queuedAt === 'string' && typeof after?.id === 'string'
        ? { queuedAt: after.queuedAt, id: after.id }
        : undefined;

    // Una fila de más para saber si hay página siguiente sin contar la tabla.
    const rows = await this.moderationRepo.listQueuePage(
      em,
      tenantId,
      {
        statusConceptIds: query.status?.map(
          (code) => QUEUE_STATUS_BY_CODE[code],
        ),
        priorityConceptIds: query.priority?.map(
          (code) => QUEUE_PRIORITY_BY_CODE[code],
        ),
        contentTypeConceptIds: query.contentType?.map(
          (code) => CONTENT_TYPE_BY_CODE[code],
        ),
        ...(query.minAgeHours !== undefined
          ? {
              queuedBefore: new Date(
                Date.now() - query.minAgeHours * UNA_HORA_MS,
              ),
            }
          : {}),
      },
      afterKey,
      limit + 1,
    );

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const [reportes, recuentos] = await Promise.all([
      this.moderationRepo.listReportsByIds(
        em,
        page
          .map((fila) => fila.contentReportId)
          .filter((id): id is string => id !== undefined),
      ),
      this.moderationRepo.countReportsByContent(
        em,
        page.map((fila) => fila.contentRefId),
      ),
    ]);

    const reportePorId = new Map(reportes.map((r) => [r.id, r]));
    const recuentoPorContenido = new Map(
      recuentos.map((r) => [r.targetId, r.count]),
    );

    const last = page.at(-1);
    return {
      items: page.map((fila) => {
        const reporte = fila.contentReportId
          ? reportePorId.get(fila.contentReportId)
          : undefined;
        return {
          id: fila.id,
          contentTypeConceptId: fila.contentTypeConceptId,
          contentRefId: fila.contentRefId,
          sourceConceptId: fila.sourceConceptId,
          priorityConceptId: fila.priorityConceptId ?? null,
          statusConceptId: fila.statusConceptId,
          assignedToUserId: fila.assignedToUserId ?? null,
          queuedAt: fila.queuedAt ?? null,
          reportCount: recuentoPorContenido.get(fila.contentRefId) ?? 0,
          report: reporte
            ? {
                id: reporte.id,
                reasonConceptId: reporte.reasonConceptId,
                detailText: reporte.detailText ?? null,
                createdAt: reporte.createdAt,
              }
            : null,
        };
      }),
      count: page.length,
      limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              // `queuedAt` es nullable en filas viejas; el cursor cae en
              // `createdAt` para que una entrada sin marca de encolado no
              // rompa la paginación ni se repita.
              queuedAt: (last.queuedAt ?? last.createdAt).toISOString(),
              id: last.id,
            })
          : null,
    };
  }

  /**
   * Página de decisiones tomadas, de la más reciente hacia atrás.
   *
   * @param query - Filtros, cursor y tope.
   * @param limit - Tope efectivo ya resuelto por el controlador.
   * @returns Página de decisiones.
   */
  async listDecisions(
    query: ModerationDecisionsQueryDto,
    limit: number,
  ): Promise<ModerationDecisionPageDto> {
    const em = this.em.fork();

    const after = query.cursor ? decodeKeysetCursor(query.cursor) : undefined;
    const afterKey =
      typeof after?.decidedAt === 'string' && typeof after?.id === 'string'
        ? { decidedAt: after.decidedAt, id: after.id }
        : undefined;

    const rows = await this.moderationRepo.listDecisionsPage(
      em,
      {
        ...(query.moderationQueueId
          ? { moderationQueueId: query.moderationQueueId }
          : {}),
        decisionConceptIds: query.decision?.map(
          (code) => MODERATION_DECISION_BY_CODE[code].decision,
        ),
      },
      afterKey,
      limit + 1,
    );

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map((fila) => this.toDecision(fila)),
      count: page.length,
      limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              decidedAt: (last.decidedAt ?? last.createdAt).toISOString(),
              id: last.id,
            })
          : null,
    };
  }

  /**
   * Página de apelaciones, con la decisión que cada una impugna.
   *
   * @param query - Filtros, cursor y tope.
   * @param limit - Tope efectivo ya resuelto por el controlador.
   * @returns Página de apelaciones.
   */
  async listAppeals(
    query: ModerationAppealsQueryDto,
    limit: number,
  ): Promise<ModerationAppealPageDto> {
    const em = this.em.fork();

    const after = query.cursor ? decodeKeysetCursor(query.cursor) : undefined;
    const afterKey =
      typeof after?.createdAt === 'string' && typeof after?.id === 'string'
        ? { createdAt: after.createdAt, id: after.id }
        : undefined;

    const rows = await this.moderationRepo.listAppealsPage(
      em,
      {
        statusConceptIds: query.status?.map(
          (code) => APPEAL_STATUS_BY_CODE[code],
        ),
        ...(query.appellantProfileId
          ? { appellantProfileId: query.appellantProfileId }
          : {}),
      },
      afterKey,
      limit + 1,
    );

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    // Las decisiones de toda la página en una consulta: resolver una apelación
    // sin leer qué se decidió es resolverla a ciegas, y pedirla por fila serían
    // N lecturas por pantalla.
    const decisiones = await this.moderationRepo.listDecisionsByIds(em, [
      ...new Set(page.map((fila) => fila.moderationDecisionId)),
    ]);
    const decisionPorId = new Map(decisiones.map((d) => [d.id, d]));

    const last = page.at(-1);
    return {
      items: page.map((fila): ModerationAppealItemDto => {
        const decision = decisionPorId.get(fila.moderationDecisionId);
        return {
          id: fila.id,
          moderationDecisionId: fila.moderationDecisionId,
          appellantProfileId: fila.appellantProfileId,
          reasonText: fila.reasonText,
          statusConceptId: fila.statusConceptId,
          resolutionConceptId: fila.resolutionConceptId ?? null,
          reviewedByUserId: fila.reviewedByUserId ?? null,
          resolvedAt: fila.resolvedAt ?? null,
          createdAt: fila.createdAt,
          decision: decision ? this.toDecision(decision) : null,
        };
      }),
      count: page.length,
      limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            })
          : null,
    };
  }

  /**
   * Las decisiones propias de un perfil, vistas por quien las sufrió (AG-18).
   *
   * ## De dónde sale «propias»
   *
   * Por los strikes: `moderation_strikes.subject_profile_id` es el único lugar
   * donde el sistema anota a quién sancionó una decisión (una decisión
   * `DISMISSED` no genera strike y no tiene nada que mostrar acá). Es la misma
   * fuente que ya usa `appeal()` para comprobar que el apelante sea el
   * sancionado — dos lugares, un solo vínculo.
   *
   * ## Qué no trae
   *
   * Nunca el denunciante ni notas internas del moderador: sólo política,
   * decisión, motivo, fecha y si todavía se puede apelar.
   *
   * @param profileId - El perfil cuyas decisiones se piden.
   * @param query - Cursor y tope.
   * @param limit - Tope efectivo ya resuelto por el controlador.
   * @param actor - Quien pide la lectura; tiene que ser el titular del
   *   perfil (o plataforma), la misma regla que rige el resto de las
   *   lecturas privadas del módulo (feed, marcadores, bloqueos).
   * @returns Página de decisiones propias, de la más reciente a la más vieja.
   * @throws ForbiddenException si `profileId` no es del actor.
   */
  async listMyDecisions(
    profileId: string,
    query: MyModerationDecisionsQueryDto,
    limit: number,
    actor: AuthenticatedUser,
  ): Promise<MyModerationDecisionPageDto> {
    const em = this.em.fork();
    await this.visibility.assertOwnProfile(em, profileId, actor);

    const strikes = await this.moderationRepo.listStrikesBySubject(
      em,
      profileId,
    );
    const decisionIds = [
      ...new Set(strikes.map((strike) => strike.moderationDecisionId)),
    ];
    const decisiones = await this.moderationRepo.listDecisionsByIds(
      em,
      decisionIds,
    );
    // Más reciente primero; `id` desempata para que el orden sea estable
    // cuando dos decisiones se tomaron en el mismo instante.
    const ordenadas = [...decisiones].sort((a, b) => {
      const diferencia =
        (b.decidedAt?.getTime() ?? 0) - (a.decidedAt?.getTime() ?? 0);
      return diferencia !== 0 ? diferencia : b.id.localeCompare(a.id);
    });

    // El listado de una persona es chico —son sanciones, no actividad—, así
    // que el cursor corta en memoria por posición en vez de pedir un `JOIN`
    // keyset sólo para un puñado de filas.
    const indiceCursor = query.cursor
      ? ordenadas.findIndex(
          (d) => d.id === decodeKeysetCursor(query.cursor!).id,
        )
      : -1;
    const desde = indiceCursor >= 0 ? indiceCursor + 1 : 0;
    const ventana = ordenadas.slice(desde, desde + limit + 1);
    const hasMore = ventana.length > limit;
    const page = hasMore ? ventana.slice(0, limit) : ventana;
    const last = page.at(-1);

    const abiertas = await Promise.all(
      page.map((decision) =>
        this.moderationRepo.findOpenAppealForDecision(
          em,
          decision.id,
          APPEAL_STATUS_BY_CODE.OPEN,
        ),
      ),
    );

    return {
      items: page.map((decision, i) => ({
        decisionId: decision.id,
        policyConceptId: decision.policyConceptId,
        decisionConceptId: decision.decisionConceptId,
        rationaleText: decision.rationaleText ?? null,
        decidedAt: decision.decidedAt ?? null,
        appealable: !abiertas[i],
      })),
      count: page.length,
      limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              decidedAt: (last.decidedAt ?? last.createdAt).toISOString(),
              id: last.id,
            })
          : null,
    };
  }

  /** Proyecta la entidad de decisión a su DTO. */
  private toDecision(fila: ModerationDecisions): ModerationDecisionItemDto {
    return {
      id: fila.id,
      moderationQueueId: fila.moderationQueueId,
      decisionConceptId: fila.decisionConceptId,
      policyConceptId: fila.policyConceptId,
      rationaleText: fila.rationaleText ?? null,
      actionTakenConceptId: fila.actionTakenConceptId ?? null,
      decidedByUserId: fila.decidedByUserId,
      decidedAt: fila.decidedAt ?? null,
    };
  }
}
