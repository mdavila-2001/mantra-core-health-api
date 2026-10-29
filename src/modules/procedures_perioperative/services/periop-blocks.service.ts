import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { DateTime } from 'luxon';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories/history.repository';
import { OutboxService } from '../../messaging/services/outbox.service';
import {
  CareSpaces,
  ClinicalUnits,
  PracticeSettings,
  PracticeSites,
} from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import { structureSnapshot } from '../../practice/services/structure-history';
import { SchedulableResources } from '../../scheduling/entities';
import {
  OperatingRoomAccessService,
  operatingRoomNotFound,
} from '../policies/operating-room-access.service';
import { isOwnBlock, minutesOf, type Interval } from '../domain/or-window';
import { PeriopBlocksRepository, PeriopCasesRepository } from '../repositories';
import { PERIOP } from '../procedures_perioperative.concepts';
import { ProceduresPerioperativeErrorReason as Reason } from '../procedures_perioperative.error-reasons';
import type {
  BlockOwnerKind,
  CreateOrBlocksDto,
  ListOperatingRoomsQueryDto,
  ListOrBlocksQueryDto,
} from '../dto';
import type {
  OperatingRoomBlockSeries,
  OperatingRoomBlocks,
  ProcedureCases,
} from '../entities';
import { PeriopOperatingRoomService } from './periop-operating-room.service';
import { PractitionerScopeService } from '../policies/practitioner-scope.service';

/** Tope de instancias por solicitud (CONTRATO-F2-F5 §F4.3). */
export const MAX_BLOCK_INSTANCES = 400;

/** Clave de `practice_settings` con las horas de liberación por omisión. */
export const SETTING_OR_BLOCK_RELEASE_HOURS = 'infra.or_block_release_hours';
/** Valor por omisión de la regla de liberación (CONTRATO-F2-F5 §F4.1). */
export const DEFAULT_OR_BLOCK_RELEASE_HOURS = 72;
/** Zona horaria si la sede no declara una. */
const FALLBACK_TIME_ZONE = 'America/La_Paz';

/** Eventos que publica la gestión de bloques (`asyncapi/asyncapi.yaml`). */
export const OR_BLOCK_EVENTS = {
  created: 'periop.or_block.created',
  released: 'periop.or_block.released',
  cancelled: 'periop.or_block.cancelled',
} as const;

/** Estados vivos de un caso: los que todavía ocupan el quirófano. */
export const LIVE_CASE_STATES: readonly string[] = [
  CONCEPTS.CASE_SCHEDULED,
  CONCEPTS.CASE_READY_FOR_SURGERY,
  CONCEPTS.SURGICAL_CASE_IN_PROGRESS,
];

/** Dueño de un bloque, como lo ve el cliente. */
export interface BlockOwnerView {
  kind: BlockOwnerKind;
  clinicalUnitId: string | null;
  surgicalSpecialtyConceptId: string | null;
  surgeonProfileId: string | null;
}

/** Un caso ligado a un bloque (sin datos del paciente). */
export interface BlockCaseView {
  id: string;
  caseNumber: string;
  statusConceptId: string;
  scheduledStartAt: Date | null;
  scheduledEndAt: Date | null;
  reservedStartAt: Date | null;
  reservedEndAt: Date | null;
}

/** Un bloque, como lo ve el cliente. */
export interface BlockView {
  id: string;
  seriesId: string | null;
  operatingRoomId: string;
  owner: BlockOwnerView;
  startsAt: Date;
  endsAt: Date;
  releaseAt: Date;
  status: 'ACTIVE' | 'RELEASED' | 'CANCELLED';
  releasedAt: Date | null;
  releasedMinutes: number | null;
  releaseReason: string | null;
  usedMinutes: number;
  cases: BlockCaseView[];
}

/** Respuesta de crear bloques. */
export interface CreateBlocksResult {
  /** La serie si hay recurrencia; si no, el bloque creado (sirve de id del hecho auditado). */
  id: string;
  seriesId?: string;
  blocks: BlockView[];
}

/** Respuesta del barrido de liberación. */
export interface ReleaseTickResult {
  released: number;
  blockIds: string[];
}

/** Resultado de comprobar el dueño del bloque al programar un caso. */
export interface BlockOwnershipResult {
  /** Bloque propio en el que cae la ventana. */
  blockId?: string;
  /** Bloques ajenos sobre los que se programó por urgencia. */
  overriddenBlockIds: string[];
}

/** Una sala en la lista de quirófanos de la sede. */
export interface OperatingRoomView {
  careSpace: {
    id: string;
    code: string;
    name: string;
    statusConceptId: string;
  };
  resourceId: string | null;
  prepMinutes: number | null;
  cleanupMinutes: number | null;
  cell: null;
  todayCases: BlockCaseView[];
  todayBlocks: Pick<
    BlockView,
    'id' | 'owner' | 'startsAt' | 'endsAt' | 'status'
  >[];
}

/**
 * Bloques de quirófano por servicio o cirujano: alta (suelto o en serie), lectura,
 * liberación manual y automática, cancelación, y la regla de a quién pertenece el tiempo al
 * programar un caso (CONTRATO-F2-F5 §F4.1 y §F4.3; `procesos/06` flujo A).
 *
 * Todo se hace dentro de una transacción con su historia (`audit.operating_room_blocks_history`)
 * y su evento en el outbox. `ex_operating_room_blocks_time` impide dos bloques activos
 * solapados en la sala aunque la validación de la API falle o dos peticiones corran a la vez.
 */
@Injectable()
export class PeriopBlocksService {
  /**
   * @param em - Contexto de persistencia.
   * @param repo - Bloques y series.
   * @param casesRepo - Casos (para los bloques con casos ligados).
   * @param rooms - Reglas de «esto es un quirófano».
   * @param access - Política de acceso al quirófano.
   * @param outbox - Outbox transaccional.
   * @param history - Historia append-only.
   * @param logger - Registro estructurado.
   * @param practitioners - Pertenencia de los profesionales citados al tenant.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PeriopBlocksRepository,
    private readonly casesRepo: PeriopCasesRepository,
    private readonly rooms: PeriopOperatingRoomService,
    private readonly access: OperatingRoomAccessService,
    private readonly outbox: OutboxService,
    private readonly history: HistoryRepository,
    private readonly logger: PinoLogger,
    private readonly practitioners: PractitionerScopeService,
  ) {
    this.logger.setContext(PeriopBlocksService.name);
  }

  // ------------------------------------------------------------------ alta

  /**
   * `POST /sites/:siteId/or-blocks`: crea un bloque, o una serie recurrente con sus
   * instancias (máximo {@link MAX_BLOCK_INSTANCES}).
   *
   * @param siteId - Sede de la ruta.
   * @param dto - Cuerpo validado.
   * @param actor - Quien lo pide (jefe de quirófano).
   * @param correlationId - Id de correlación de la petición.
   * @returns La serie (si hay recurrencia) y las instancias creadas.
   */
  async createBlocks(
    siteId: string,
    dto: CreateOrBlocksDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<CreateBlocksResult> {
    const tenantId = requireTenantId();
    this.logger.info(
      { operation: 'periop.or_block.create', siteId },
      'Creating operating room blocks',
    );
    return this.em.transactional(async (tx) => {
      const site = await this.access.loadSite(tx, siteId);
      if (!site) throw operatingRoomNotFound();
      const found = await this.access.loadRoom(tx, dto.operatingRoomId);
      if (!found) throw operatingRoomNotFound();
      await this.access.assertCan(tx, actor, 'OR_BLOCK_MANAGE', {
        site: found.site,
        space: found.space,
      });
      await this.rooms.resolveRoom(tx, dto.operatingRoomId, siteId, 'BLOCK');

      const owner = await this.resolveOwner(tx, tenantId, dto);
      const zone = site.timeZone ?? FALLBACK_TIME_ZONE;
      const instances = this.expandInstances(dto, zone);
      const now = new Date();
      if (instances[0].start < now) {
        throw new PreconditionFailedException(
          'El bloque no puede empezar en el pasado',
          { startsAt: instances[0].start.toISOString() },
          Reason.OR_BLOCK_IN_PAST,
        );
      }

      const releaseHours =
        dto.releaseHours ?? (await this.defaultReleaseHours(tx, site));

      // Solape con bloques activos: se informa el primero. La base lo vuelve a impedir.
      const active = await this.repo.findOverlapping(
        tx,
        tenantId,
        dto.operatingRoomId,
        instances[0].start,
        instances[instances.length - 1].end,
        PERIOP.ORB_ACTIVE,
      );
      for (const instance of instances) {
        const clash = active.find(
          (b) => b.startsAt < instance.end && instance.start < b.endsAt,
        );
        if (clash) {
          throw new ConflictException(
            'El quirófano ya tiene un bloque activo en esa franja',
            {
              operatingRoomId: dto.operatingRoomId,
              blockId: clash.id,
              startsAt: clash.startsAt.toISOString(),
              endsAt: clash.endsAt.toISOString(),
            },
            Reason.OR_BLOCK_OVERLAP,
          );
        }
      }

      let series: OperatingRoomBlockSeries | undefined;
      if (dto.recurrence) {
        const first = DateTime.fromJSDate(new Date(dto.startsAt), { zone });
        const last = DateTime.fromJSDate(new Date(dto.endsAt), { zone });
        series = this.repo.createSeries(tx, {
          tenantId,
          practiceSiteId: siteId,
          operatingRoomId: dto.operatingRoomId,
          ownerKindConceptId: owner.kindConceptId,
          clinicalUnitId: owner.clinicalUnitId,
          surgicalSpecialtyConceptId: owner.surgicalSpecialtyConceptId,
          surgeonProfileId: owner.surgeonProfileId,
          weekdays: [...new Set(dto.recurrence.weekdays)].sort(),
          startTime: first.toFormat('HH:mm:ss'),
          endTime: last.toFormat('HH:mm:ss'),
          validFrom: first.startOf('day').toJSDate(),
          validTo: DateTime.fromISO(dto.recurrence.until, { zone })
            .startOf('day')
            .toJSDate(),
          releaseHours,
          statusConceptId: PERIOP.ORB_ACTIVE,
          actorUserId: actor.id,
        });
        // Las instancias referencian la serie por una columna uuid: la serie va primero.
        await tx.flush();
        await this.history.append(
          tx,
          'operating_room_block_series',
          series.id,
          {
            operationConceptId: AUD.OPERATION_INSERT,
            dataSnapshot: structureSnapshot(series),
            changedByUserId: actor.id,
            tenantId,
            firstRevision: true,
          },
        );
      }

      const created = instances.map((instance) =>
        this.repo.createBlock(tx, {
          tenantId,
          seriesId: series?.id,
          operatingRoomId: dto.operatingRoomId,
          ownerKindConceptId: owner.kindConceptId,
          clinicalUnitId: owner.clinicalUnitId,
          surgicalSpecialtyConceptId: owner.surgicalSpecialtyConceptId,
          surgeonProfileId: owner.surgeonProfileId,
          startsAt: instance.start,
          endsAt: instance.end,
          releaseAt: new Date(
            instance.start.getTime() - releaseHours * 3_600_000,
          ),
          statusConceptId: PERIOP.ORB_ACTIVE,
          actorUserId: actor.id,
        }),
      );
      await tx.flush();
      for (const block of created) {
        await this.history.append(tx, 'operating_room_blocks', block.id, {
          operationConceptId: AUD.OPERATION_INSERT,
          dataSnapshot: structureSnapshot(block),
          changedByUserId: actor.id,
          tenantId,
          firstRevision: true,
        });
      }
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: OR_BLOCK_EVENTS.created,
        aggregateType: series
          ? 'operating_room_block_series'
          : 'operating_room_block',
        aggregateId: series?.id ?? created[0].id,
        payloadJson: {
          seriesId: series?.id ?? null,
          blockIds: created.map((b) => b.id),
          operatingRoomId: dto.operatingRoomId,
          practiceSiteId: siteId,
          ownerKind: owner.kind,
          releaseHours,
          count: created.length,
          tenantId,
          actorUserId: actor.id,
          requestId: correlationId ?? null,
        },
        correlationId,
        actorUserId: actor.id,
      });

      return {
        id: series?.id ?? created[0].id,
        seriesId: series?.id,
        blocks: created.map((b) => this.toView(b, [])),
      };
    });
  }

  // ------------------------------------------------------------------ lectura

  /**
   * `GET /sites/:siteId/or-blocks`: bloques de la sede en el rango, con minutos usados y los
   * casos ligados.
   *
   * @param siteId - Sede de la ruta.
   * @param query - Rango y filtros.
   * @param actor - Quien lee.
   */
  async listBlocks(
    siteId: string,
    query: ListOrBlocksQueryDto,
    actor: AuthenticatedUser,
  ): Promise<{ items: BlockView[] }> {
    const tenantId = requireTenantId();
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (!(to > from)) {
      throw new PreconditionFailedException(
        'El rango debe terminar después de empezar',
        { from: query.from, to: query.to },
        Reason.OR_BLOCK_WINDOW_INVALID,
      );
    }
    const site = await this.access.loadSite(this.em, siteId);
    if (!site) throw operatingRoomNotFound();
    await this.access.assertCan(this.em, actor, 'OR_SCHEDULE_VIEW', { site });

    const roomIds = await this.siteRoomIds(
      siteId,
      tenantId,
      query.operatingRoomId,
      { actor, site },
    );
    if (query.operatingRoomId && roomIds.length === 0) {
      throw operatingRoomNotFound();
    }
    const blocks = await this.repo.list(this.em, tenantId, {
      roomIds,
      from,
      to,
      ownerKindConceptId: query.owner
        ? this.ownerKindConcept(query.owner)
        : undefined,
    });
    const casesByBlock = await this.casesOfBlocks(
      tenantId,
      blocks.map((b) => b.id),
    );
    return {
      items: blocks.map((b) => this.toView(b, casesByBlock.get(b.id) ?? [])),
    };
  }

  /**
   * `GET /sites/:siteId/operating-rooms`: los quirófanos de la sede con su recurso agendable,
   * preparación y limpieza, y los casos y bloques del día.
   *
   * @param siteId - Sede de la ruta.
   * @param query - Día pedido (por omisión, hoy en la zona de la sede).
   * @param actor - Quien lee.
   */
  async listOperatingRooms(
    siteId: string,
    query: ListOperatingRoomsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<{ items: OperatingRoomView[] }> {
    const tenantId = requireTenantId();
    const site = await this.access.loadSite(this.em, siteId);
    if (!site) throw operatingRoomNotFound();
    await this.access.assertCan(this.em, actor, 'OR_SCHEDULE_VIEW', { site });

    const zone = site.timeZone ?? FALLBACK_TIME_ZONE;
    const day = query.date
      ? DateTime.fromISO(query.date, { zone }).startOf('day')
      : DateTime.now().setZone(zone).startOf('day');
    const from = day.toJSDate();
    const to = day.plus({ days: 1 }).toJSDate();

    const spaces = await this.access.visibleRooms(
      this.em,
      actor,
      'OR_SCHEDULE_VIEW',
      site,
      await this.em.find(
        CareSpaces,
        {
          tenantId,
          practiceSiteId: siteId,
          spaceTypeConceptId: this.operatingRoomFunction(),
        },
        { orderBy: { code: 'ASC' } },
      ),
    );
    const resources = spaces.length
      ? await this.em.find(SchedulableResources, {
          tenantId,
          careSpaceId: { $in: spaces.map((s) => s.id) },
          stateConceptId: CONCEPTS.STATE_ACTIVE,
        })
      : [];
    const blocks = await this.repo.list(this.em, tenantId, {
      roomIds: spaces.map((s) => s.id),
      from,
      to,
      statusConceptIds: [PERIOP.ORB_ACTIVE, PERIOP.ORB_RELEASED],
    });
    const cases = spaces.length
      ? await this.casesRepo.findCasesInWindow(
          this.em,
          tenantId,
          spaces.map((s) => s.id),
          from,
          to,
        )
      : [];

    return {
      items: spaces.map((space) => ({
        careSpace: {
          id: space.id,
          code: space.code,
          name: space.name,
          statusConceptId: space.statusConceptId,
        },
        resourceId:
          resources.find((r) => r.careSpaceId === space.id)?.id ?? null,
        prepMinutes: space.prepMinutes ?? null,
        cleanupMinutes: space.cleanupMinutes ?? null,
        // El estado operativo de la sala lo aporta F2 (`BedBoardCell`).
        cell: null,
        todayCases: cases
          .filter((c) => c.operatingRoomId === space.id)
          .map((c) => this.toCaseView(c)),
        todayBlocks: blocks
          .filter((b) => b.operatingRoomId === space.id)
          .map((b) => {
            const view = this.toView(b, []);
            return {
              id: view.id,
              owner: view.owner,
              startsAt: view.startsAt,
              endsAt: view.endsAt,
              status: view.status,
            };
          }),
      })),
    };
  }

  // ------------------------------------------------------------------ liberar / cancelar

  /**
   * `POST /or-blocks/:id/release`: el tiempo no usado del bloque pasa a la agenda abierta.
   *
   * @param blockId - Bloque de la ruta.
   * @param reasonText - Motivo (obligatorio cuando libera una persona).
   * @param actor - Jefe de quirófano o, en su propio bloque, el cirujano dueño.
   * @param correlationId - Id de correlación.
   */
  async release(
    blockId: string,
    reasonText: string,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<BlockView> {
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const block = await this.repo.findBlockForUpdate(tx, blockId, tenantId);
      if (!block) throw this.blockNotFound();
      await this.assertCanChange(tx, actor, block, 'OR_BLOCK_RELEASE');
      const view = await this.releaseLocked(tx, block, {
        reasonText,
        actor,
        automatic: false,
        now: new Date(),
        correlationId,
      });
      return view;
    });
  }

  /**
   * `POST /or-blocks/:id/cancel`: el bloque deja de existir como reserva de tiempo.
   *
   * @param blockId - Bloque de la ruta.
   * @param reasonText - Motivo.
   * @param actor - Jefe de quirófano.
   * @param correlationId - Id de correlación.
   */
  async cancel(
    blockId: string,
    reasonText: string,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<BlockView> {
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const block = await this.repo.findBlockForUpdate(tx, blockId, tenantId);
      if (!block) throw this.blockNotFound();
      await this.assertCanChange(tx, actor, block, 'OR_BLOCK_MANAGE');
      await this.assertActiveWithoutCases(tx, block);
      await this.setStatus(tx, block, PERIOP.ORB_CANCELLED, actor.id);
      block.releaseReason = reasonText;
      await tx.flush();
      await this.history.append(tx, 'operating_room_blocks', block.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: structureSnapshot(block),
        changedByUserId: actor.id,
        tenantId,
      });
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: OR_BLOCK_EVENTS.cancelled,
        aggregateType: 'operating_room_block',
        aggregateId: block.id,
        payloadJson: {
          blockIds: [block.id],
          seriesId: block.seriesId ?? null,
          operatingRoomId: block.operatingRoomId,
          reasonText,
          tenantId,
          actorUserId: actor.id,
          requestId: correlationId ?? null,
        },
        correlationId,
        actorUserId: actor.id,
      });
      return this.toView(block, []);
    });
  }

  /**
   * `PATCH /or-block-series/:id`: acorta la serie. Las instancias posteriores a `validTo`
   * se cancelan; si alguna tiene casos, no se cambia nada.
   *
   * @param seriesId - Serie de la ruta.
   * @param validTo - Nuevo último día, `AAAA-MM-DD`.
   * @param actor - Jefe de quirófano.
   * @param correlationId - Id de correlación.
   */
  async endSeries(
    seriesId: string,
    validTo: string,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<{
    seriesId: string;
    validTo: string;
    cancelledBlockIds: string[];
  }> {
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const series = await this.repo.findSeriesForUpdate(
        tx,
        seriesId,
        tenantId,
      );
      if (!series) {
        throw new ResourceNotFoundException(
          'Serie de bloques no encontrada',
          undefined,
          Reason.OR_BLOCK_SERIES_NOT_FOUND,
        );
      }
      const found = await this.access.loadRoom(tx, series.operatingRoomId);
      if (!found) throw operatingRoomNotFound();
      await this.access.assertCan(tx, actor, 'OR_BLOCK_MANAGE', {
        site: found.site,
        space: found.space,
      });

      const zone = found.site.timeZone ?? FALLBACK_TIME_ZONE;
      const newEnd = DateTime.fromISO(validTo, { zone }).startOf('day');
      if (!newEnd.isValid || newEnd.toJSDate() < series.validFrom) {
        throw new PreconditionFailedException(
          'La serie no puede terminar antes de empezar',
          { validTo },
          Reason.OR_BLOCK_WINDOW_INVALID,
        );
      }
      const cutoff = newEnd.plus({ days: 1 }).toJSDate();
      const instances = (
        await this.repo.findSeriesInstances(
          tx,
          tenantId,
          series.id,
          PERIOP.ORB_ACTIVE,
          new Date(),
        )
      ).filter((b) => b.startsAt >= cutoff);

      for (const block of instances)
        await this.assertActiveWithoutCases(tx, block);
      for (const block of instances) {
        await this.setStatus(tx, block, PERIOP.ORB_CANCELLED, actor.id);
        block.releaseReason = `Serie acortada hasta ${validTo}`;
      }
      series.validTo = newEnd.toJSDate();
      touch(series, actor.id);
      await tx.flush();
      await this.history.append(tx, 'operating_room_block_series', series.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: structureSnapshot(series),
        changedByUserId: actor.id,
        tenantId,
      });
      for (const block of instances) {
        await this.history.append(tx, 'operating_room_blocks', block.id, {
          operationConceptId: AUD.OPERATION_UPDATE,
          dataSnapshot: structureSnapshot(block),
          changedByUserId: actor.id,
          tenantId,
        });
      }
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: OR_BLOCK_EVENTS.cancelled,
        aggregateType: 'operating_room_block_series',
        aggregateId: series.id,
        payloadJson: {
          blockIds: instances.map((b) => b.id),
          seriesId: series.id,
          operatingRoomId: series.operatingRoomId,
          validTo,
          tenantId,
          actorUserId: actor.id,
          requestId: correlationId ?? null,
        },
        correlationId,
        actorUserId: actor.id,
      });
      return {
        seriesId: series.id,
        validTo,
        cancelledBlockIds: instances.map((b) => b.id),
      };
    });
  }

  /**
   * `POST /internal/periop/or-blocks-release-tick`: libera los bloques activos cuyo plazo de
   * liberación llegó y que no tienen casos vivos ligados. Idempotente: un segundo barrido no
   * encuentra nada. Recorre todas las organizaciones, así que corre en contexto SYSTEM.
   *
   * @param now - Instante del barrido (inyectable en pruebas).
   * @param limit - Tope de bloques por barrido.
   */
  async releaseTick(
    now: Date = new Date(),
    limit = 200,
  ): Promise<ReleaseTickResult> {
    return this.em.transactional(async (tx) => {
      const due = await this.repo.findReleasable(
        tx,
        now,
        PERIOP.ORB_ACTIVE,
        limit,
      );
      const releasedIds: string[] = [];
      for (const block of due) {
        const live = await this.repo.findLiveCasesInBlock(
          tx,
          block.id,
          LIVE_CASE_STATES,
        );
        if (live.length > 0) continue;
        await this.releaseLocked(tx, block, {
          reasonText: `Liberación automática: venció el plazo de ${Math.round(
            (block.startsAt.getTime() - block.releaseAt.getTime()) / 3_600_000,
          )} h`,
          automatic: true,
          now,
        });
        releasedIds.push(block.id);
      }
      return { released: releasedIds.length, blockIds: releasedIds };
    });
  }

  // ------------------------------------------------------------------ dueño al programar

  /**
   * ¿De quién es el tiempo en el que cae un caso? (validación 6 de `scheduleCase`/`updateCase`).
   *
   * Un bloque activo de **otro dueño** que se solape con la ventana reservada es un 409
   * `OR_BLOCK_OWNED_BY_OTHER`, salvo que el caso sea urgente o de emergencia: ahí se permite
   * y el caso conserva su `urgencyReasonText`. Si la ventana cae en un bloque propio, se
   * devuelve para ligarlo al caso.
   *
   * @param tx - Transacción activa.
   * @param input - Sala, ventana reservada, dueño del caso y si es electivo.
   */
  async resolveOwnership(
    tx: EntityManager,
    input: {
      operatingRoomId: string;
      window: Interval;
      scheduled: Interval;
      primarySurgeonProfileId?: string | null;
      surgicalSpecialtyConceptId?: string | null;
      elective: boolean;
    },
  ): Promise<BlockOwnershipResult> {
    const tenantId = requireTenantId();
    const blocks = await this.repo.findOverlapping(
      tx,
      tenantId,
      input.operatingRoomId,
      input.window.start,
      input.window.end,
      PERIOP.ORB_ACTIVE,
    );
    const own: OperatingRoomBlocks[] = [];
    const foreign: OperatingRoomBlocks[] = [];
    for (const block of blocks) {
      const unitSpecialty =
        !block.surgicalSpecialtyConceptId && block.clinicalUnitId
          ? (
              await tx.findOne(ClinicalUnits, {
                id: block.clinicalUnitId,
                tenantId,
              })
            )?.specialtyConceptId
          : undefined;
      const isOwn = isOwnBlock(
        {
          kind:
            block.ownerKindConceptId === PERIOP.ORB_OWNER_SURGEON
              ? 'SURGEON'
              : 'SERVICE',
          clinicalUnitId: block.clinicalUnitId,
          surgicalSpecialtyConceptId: block.surgicalSpecialtyConceptId,
          surgeonProfileId: block.surgeonProfileId,
          unitSpecialtyConceptId: unitSpecialty,
        },
        {
          primarySurgeonProfileId: input.primarySurgeonProfileId,
          surgicalSpecialtyConceptId: input.surgicalSpecialtyConceptId,
        },
      );
      (isOwn ? own : foreign).push(block);
    }

    if (foreign.length > 0 && input.elective) {
      const clash = foreign[0];
      throw new ConflictException(
        'La ventana cae en un bloque de otro dueño',
        {
          blockId: clash.id,
          owner: this.ownerView(clash),
          startsAt: clash.startsAt.toISOString(),
          endsAt: clash.endsAt.toISOString(),
        },
        Reason.OR_BLOCK_OWNED_BY_OTHER,
      );
    }
    const chosen =
      own.find(
        (b) =>
          b.startsAt <= input.scheduled.start &&
          input.scheduled.start < b.endsAt,
      ) ?? own[0];
    return {
      blockId: chosen?.id,
      overriddenBlockIds: foreign.map((b) => b.id),
    };
  }

  // ------------------------------------------------------------------ internos

  /** Libera un bloque ya cargado y bloqueado. */
  private async releaseLocked(
    tx: EntityManager,
    block: OperatingRoomBlocks,
    input: {
      reasonText: string;
      actor?: AuthenticatedUser;
      automatic: boolean;
      now: Date;
      correlationId?: string;
    },
  ): Promise<BlockView> {
    await this.assertActiveWithoutCases(tx, block);
    if (block.endsAt <= input.now) {
      throw new PreconditionFailedException(
        'El bloque ya terminó: no hay tiempo que liberar',
        { blockId: block.id },
        Reason.OR_BLOCK_IN_PAST,
      );
    }
    const from = block.startsAt > input.now ? block.startsAt : input.now;
    block.statusConceptId = PERIOP.ORB_RELEASED;
    block.releasedAt = input.now;
    block.releasedByUserId = input.automatic ? undefined : input.actor?.id;
    block.releaseReason = input.reasonText;
    block.releasedMinutes = Math.ceil(
      (block.endsAt.getTime() - from.getTime()) / 60_000,
    );
    touch(block, input.actor?.id, input.now);
    await tx.flush();

    await this.history.append(tx, 'operating_room_blocks', block.id, {
      operationConceptId: AUD.OPERATION_UPDATE,
      dataSnapshot: structureSnapshot(block),
      changedByUserId: input.actor?.id,
      tenantId: block.tenantId,
    });
    this.casesRepo.createUtilizationEvent(tx, {
      operatingRoomId: block.operatingRoomId,
      eventTypeConceptId: CONCEPTS.OR_EVENT_SLOT_RELEASED,
      recordedByUserId: input.actor?.id,
      tenantId: block.tenantId,
      operatingRoomBlockId: block.id,
      occurredAt: input.now,
      detailsJson: {
        releasedMinutes: block.releasedMinutes,
        automatic: input.automatic,
      },
    });
    await this.outbox.publishDomainEvent(tx, {
      tenantId: block.tenantId,
      eventType: OR_BLOCK_EVENTS.released,
      aggregateType: 'operating_room_block',
      aggregateId: block.id,
      payloadJson: {
        blockId: block.id,
        seriesId: block.seriesId ?? null,
        operatingRoomId: block.operatingRoomId,
        releasedMinutes: block.releasedMinutes,
        automatic: input.automatic,
        reasonText: input.reasonText,
        tenantId: block.tenantId,
        actorUserId: input.actor?.id ?? null,
        requestId: input.correlationId ?? null,
      },
      correlationId: input.correlationId,
      actorUserId: input.actor?.id,
    });
    return this.toView(block, []);
  }

  /** 409 si el bloque no está activo; 422 si tiene casos vivos ligados. */
  private async assertActiveWithoutCases(
    tx: EntityManager,
    block: OperatingRoomBlocks,
  ): Promise<void> {
    if (block.statusConceptId !== PERIOP.ORB_ACTIVE) {
      throw new ConflictException(
        'El bloque no está activo',
        { blockId: block.id, statusConceptId: block.statusConceptId },
        Reason.OR_BLOCK_NOT_ACTIVE,
      );
    }
    const live = await this.repo.findLiveCasesInBlock(
      tx,
      block.id,
      LIVE_CASE_STATES,
    );
    if (live.length > 0) {
      throw new PreconditionFailedException(
        'El bloque tiene casos ligados: reubicarlos primero',
        { blockId: block.id, caseIds: live.map((c) => c.id) },
        Reason.OR_BLOCK_HAS_CASES,
      );
    }
  }

  /** Cambia el estado del bloque (sin historia: la escribe quien llama tras el flush). */
  private async setStatus(
    tx: EntityManager,
    block: OperatingRoomBlocks,
    statusConceptId: string,
    userId: string,
  ): Promise<void> {
    block.statusConceptId = statusConceptId;
    touch(block, userId);
    await tx.flush();
  }

  /**
   * Autoriza cambiar un bloque: el jefe de quirófano; para soltarlo, además, el cirujano dueño
   * de un bloque suyo (`matriz-de-permisos` §5, nota 8; `procesos/06` flujo A.3).
   */
  private async assertCanChange(
    tx: EntityManager,
    actor: AuthenticatedUser,
    block: OperatingRoomBlocks,
    action: 'OR_BLOCK_MANAGE' | 'OR_BLOCK_RELEASE',
  ): Promise<void> {
    const found = await this.access.loadRoom(tx, block.operatingRoomId);
    if (!found) throw operatingRoomNotFound();
    const targets = { site: found.site, space: found.space };
    if (await this.access.can(tx, actor, action, targets)) return;
    const ownsIt =
      action === 'OR_BLOCK_RELEASE' &&
      block.ownerKindConceptId === PERIOP.ORB_OWNER_SURGEON &&
      !!actor.practitionerProfileId &&
      actor.practitionerProfileId === block.surgeonProfileId &&
      actor.roles.includes('SURGEON');
    if (!ownsIt) await this.access.assertCan(tx, actor, action, targets);
  }

  /** Resuelve el dueño del cuerpo a conceptos y verifica que existan en el tenant. */
  private async resolveOwner(
    tx: EntityManager,
    tenantId: string,
    dto: CreateOrBlocksDto,
  ): Promise<{
    kind: BlockOwnerKind;
    kindConceptId: string;
    clinicalUnitId?: string;
    surgicalSpecialtyConceptId?: string;
    surgeonProfileId?: string;
  }> {
    const required = (field: string, cause = 'REQUIRED') =>
      new PreconditionFailedException(
        'El bloque necesita un dueño válido',
        { ownerKind: dto.ownerKind, field, cause },
        Reason.OR_BLOCK_OWNER_REQUIRED,
      );

    if (dto.ownerKind === 'SURGEON') {
      if (!dto.surgeonProfileId) throw required('surgeonProfileId');
      // El cirujano dueño es un profesional de esta organización (inexistente y ajeno
      // responden igual: no se confirma que el perfil existe en otra).
      await this.practitioners.assertInTenant(tx, tenantId, [
        { field: 'surgeonProfileId', profileId: dto.surgeonProfileId },
      ]);
      return {
        kind: 'SURGEON',
        kindConceptId: PERIOP.ORB_OWNER_SURGEON,
        surgeonProfileId: dto.surgeonProfileId,
      };
    }

    let specialtyId = dto.surgicalSpecialtyConceptId;
    if (!specialtyId && dto.specialtyCode) {
      const rows = await tx.execute<{ id: string }[]>(
        'select id from terminology.catalog_concepts where code = ? limit 2',
        [dto.specialtyCode],
      );
      if (rows.length !== 1) throw required('specialtyCode', 'NOT_FOUND');
      specialtyId = rows[0].id;
    }
    if (!dto.clinicalUnitId && !specialtyId) {
      throw required('clinicalUnitId');
    }
    if (dto.clinicalUnitId) {
      const unit = await tx.findOne(ClinicalUnits, {
        id: dto.clinicalUnitId,
        tenantId,
      });
      if (!unit) throw required('clinicalUnitId', 'NOT_FOUND');
    }
    return {
      kind: 'SERVICE',
      kindConceptId: PERIOP.ORB_OWNER_SERVICE,
      clinicalUnitId: dto.clinicalUnitId,
      surgicalSpecialtyConceptId: specialtyId,
    };
  }

  /** Instancias `[start, end)` del cuerpo, en UTC, ya con el tope aplicado. */
  private expandInstances(dto: CreateOrBlocksDto, zone: string): Interval[] {
    const start = new Date(dto.startsAt);
    const end = new Date(dto.endsAt);
    const invalid = (cause: string) =>
      new PreconditionFailedException(
        'La ventana del bloque no es válida',
        { startsAt: dto.startsAt, endsAt: dto.endsAt, cause },
        Reason.OR_BLOCK_WINDOW_INVALID,
      );
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      throw invalid('END_BEFORE_START');
    }
    if (!dto.recurrence) return [{ start, end }];

    const first = DateTime.fromJSDate(start, { zone });
    const last = DateTime.fromJSDate(end, { zone });
    if (!first.hasSame(last, 'day')) throw invalid('SPANS_MIDNIGHT');
    const until = DateTime.fromISO(dto.recurrence.until, { zone }).startOf(
      'day',
    );
    if (!until.isValid || until < first.startOf('day'))
      throw invalid('UNTIL_BEFORE_START');

    const weekdays = new Set(dto.recurrence.weekdays);
    const instances: Interval[] = [];
    for (
      let day = first.startOf('day');
      day <= until;
      day = day.plus({ days: 1 })
    ) {
      // Luxon: lunes = 1 … domingo = 7. El contrato usa 0 = domingo … 6 = sábado.
      if (!weekdays.has(day.weekday % 7)) continue;
      const s = day.set({
        hour: first.hour,
        minute: first.minute,
        second: first.second,
      });
      const e = day.set({
        hour: last.hour,
        minute: last.minute,
        second: last.second,
      });
      instances.push({ start: s.toJSDate(), end: e.toJSDate() });
      if (instances.length > MAX_BLOCK_INSTANCES) {
        throw new PreconditionFailedException(
          'La serie genera demasiadas instancias',
          { max: MAX_BLOCK_INSTANCES },
          Reason.OR_BLOCK_TOO_MANY_INSTANCES,
        );
      }
    }
    if (instances.length === 0) throw invalid('NO_MATCHING_WEEKDAY');
    return instances;
  }

  /** Horas de liberación por omisión: `infra.or_block_release_hours` de la práctica. */
  private async defaultReleaseHours(
    tx: EntityManager,
    site: PracticeSites,
  ): Promise<number> {
    const setting = await tx.findOne(PracticeSettings, {
      practiceId: site.practiceId,
      settingKey: SETTING_OR_BLOCK_RELEASE_HOURS,
    });
    const value = Number(setting?.valueJson);
    return Number.isInteger(value) && value >= 0
      ? value
      : DEFAULT_OR_BLOCK_RELEASE_HOURS;
  }

  /** Quirófanos de la sede que el actor ve con la lectura de agenda (alcance incluido). */
  private async siteRoomIds(
    siteId: string,
    tenantId: string,
    onlyRoomId: string | undefined,
    viewer: { actor: AuthenticatedUser; site: PracticeSites },
  ): Promise<string[]> {
    const spaces = await this.em.find(CareSpaces, {
      tenantId,
      practiceSiteId: siteId,
      spaceTypeConceptId: this.operatingRoomFunction(),
      ...(onlyRoomId ? { id: onlyRoomId } : {}),
    });
    const visible = await this.access.visibleRooms(
      this.em,
      viewer.actor,
      'OR_SCHEDULE_VIEW',
      viewer.site,
      spaces,
    );
    return visible.map((s) => s.id);
  }

  private operatingRoomFunction(): string {
    return PRAC.SPACE_FN_OPERATING_ROOM;
  }

  private async casesOfBlocks(
    tenantId: string,
    blockIds: readonly string[],
  ): Promise<Map<string, BlockCaseView[]>> {
    const byBlock = new Map<string, BlockCaseView[]>();
    if (blockIds.length === 0) return byBlock;
    const cases = await this.casesRepo.findCasesOfBlocks(
      this.em,
      tenantId,
      blockIds,
    );
    for (const c of cases) {
      if (!c.operatingRoomBlockId) continue;
      const list = byBlock.get(c.operatingRoomBlockId) ?? [];
      list.push(this.toCaseView(c));
      byBlock.set(c.operatingRoomBlockId, list);
    }
    return byBlock;
  }

  private toCaseView(c: ProcedureCases): BlockCaseView {
    return {
      id: c.id,
      caseNumber: c.caseNumber,
      statusConceptId: c.statusConceptId,
      scheduledStartAt: c.scheduledStartAt ?? null,
      scheduledEndAt: c.scheduledEndAt ?? null,
      reservedStartAt: c.reservedStartAt ?? null,
      reservedEndAt: c.reservedEndAt ?? null,
    };
  }

  private ownerKindConcept(kind: BlockOwnerKind): string {
    return kind === 'SURGEON'
      ? PERIOP.ORB_OWNER_SURGEON
      : PERIOP.ORB_OWNER_SERVICE;
  }

  private ownerView(block: OperatingRoomBlocks): BlockOwnerView {
    return {
      kind:
        block.ownerKindConceptId === PERIOP.ORB_OWNER_SURGEON
          ? 'SURGEON'
          : 'SERVICE',
      clinicalUnitId: block.clinicalUnitId ?? null,
      surgicalSpecialtyConceptId: block.surgicalSpecialtyConceptId ?? null,
      surgeonProfileId: block.surgeonProfileId ?? null,
    };
  }

  private toView(
    block: OperatingRoomBlocks,
    cases: BlockCaseView[],
  ): BlockView {
    const status: BlockView['status'] =
      block.statusConceptId === PERIOP.ORB_RELEASED
        ? 'RELEASED'
        : block.statusConceptId === PERIOP.ORB_CANCELLED
          ? 'CANCELLED'
          : 'ACTIVE';
    const window: Interval = { start: block.startsAt, end: block.endsAt };
    const usedMinutes = cases
      .filter((c) => c.statusConceptId !== CONCEPTS.CASE_CANCELLED)
      .reduce(
        (sum, c) =>
          c.scheduledStartAt && c.scheduledEndAt
            ? sum +
              minutesOf(
                { start: c.scheduledStartAt, end: c.scheduledEndAt },
                window,
              )
            : sum,
        0,
      );
    return {
      id: block.id,
      seriesId: block.seriesId ?? null,
      operatingRoomId: block.operatingRoomId,
      owner: this.ownerView(block),
      startsAt: block.startsAt,
      endsAt: block.endsAt,
      releaseAt: block.releaseAt,
      status,
      releasedAt: block.releasedAt ?? null,
      releasedMinutes: block.releasedMinutes ?? null,
      releaseReason: block.releaseReason ?? null,
      usedMinutes,
      cases,
    };
  }

  private blockNotFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Bloque de quirófano no encontrado',
      undefined,
      Reason.OR_BLOCK_NOT_FOUND,
    );
  }
}
