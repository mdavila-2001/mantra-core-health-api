import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  OperatingRoomBlockSeries,
  OperatingRoomBlocks,
  ProcedureCases,
} from '../entities';

/** Datos de una serie de bloques. */
export interface CreateSeriesData {
  tenantId: string;
  practiceSiteId: string;
  operatingRoomId: string;
  ownerKindConceptId: string;
  clinicalUnitId?: string;
  surgicalSpecialtyConceptId?: string;
  surgeonProfileId?: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  validFrom: Date;
  validTo?: Date;
  releaseHours: number;
  statusConceptId: string;
  actorUserId?: string;
}

/** Datos de una instancia de bloque. */
export interface CreateBlockData {
  tenantId: string;
  seriesId?: string;
  operatingRoomId: string;
  ownerKindConceptId: string;
  clinicalUnitId?: string;
  surgicalSpecialtyConceptId?: string;
  surgeonProfileId?: string;
  startsAt: Date;
  endsAt: Date;
  releaseAt: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/** Filtros del listado de bloques. */
export interface ListBlocksFilter {
  roomIds: readonly string[];
  from: Date;
  to: Date;
  ownerKindConceptId?: string;
  statusConceptIds?: readonly string[];
}

/**
 * Acceso a los bloques de quirófano y sus series. Toda consulta lleva el tenant: un bloque de
 * otra organización no se ve ni se bloquea.
 */
@Injectable()
export class PeriopBlocksRepository {
  /** Crea una serie (aún sin persistir hasta el flush). */
  createSeries(
    em: EntityManager,
    data: CreateSeriesData,
  ): OperatingRoomBlockSeries {
    return em.create(
      OperatingRoomBlockSeries,
      {
        tenantId: data.tenantId,
        practiceSiteId: data.practiceSiteId,
        operatingRoomId: data.operatingRoomId,
        ownerKindConceptId: data.ownerKindConceptId,
        clinicalUnitId: data.clinicalUnitId,
        surgicalSpecialtyConceptId: data.surgicalSpecialtyConceptId,
        surgeonProfileId: data.surgeonProfileId,
        weekdays: data.weekdays.map(String),
        startTime: data.startTime,
        endTime: data.endTime,
        validFrom: data.validFrom,
        validTo: data.validTo,
        releaseHours: data.releaseHours,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Crea una instancia de bloque. */
  createBlock(em: EntityManager, data: CreateBlockData): OperatingRoomBlocks {
    return em.create(
      OperatingRoomBlocks,
      {
        tenantId: data.tenantId,
        seriesId: data.seriesId,
        operatingRoomId: data.operatingRoomId,
        ownerKindConceptId: data.ownerKindConceptId,
        clinicalUnitId: data.clinicalUnitId,
        surgicalSpecialtyConceptId: data.surgicalSpecialtyConceptId,
        surgeonProfileId: data.surgeonProfileId,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        releaseAt: data.releaseAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Bloque del tenant por id, bloqueado para escribir. */
  findBlockForUpdate(
    em: EntityManager,
    id: string,
    tenantId: string,
  ): Promise<OperatingRoomBlocks | null> {
    return em.findOne(
      OperatingRoomBlocks,
      { id, tenantId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Serie del tenant por id, bloqueada para escribir. */
  findSeriesForUpdate(
    em: EntityManager,
    id: string,
    tenantId: string,
  ): Promise<OperatingRoomBlockSeries | null> {
    return em.findOne(
      OperatingRoomBlockSeries,
      { id, tenantId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Bloques de la sala que se solapan con la ventana, en el estado indicado. */
  findOverlapping(
    em: EntityManager,
    tenantId: string,
    operatingRoomId: string,
    from: Date,
    to: Date,
    statusConceptId: string,
  ): Promise<OperatingRoomBlocks[]> {
    return em.find(
      OperatingRoomBlocks,
      {
        tenantId,
        operatingRoomId,
        statusConceptId,
        startsAt: { $lt: to },
        endsAt: { $gt: from },
      },
      { orderBy: { startsAt: 'ASC' } },
    );
  }

  /** Bloques de las salas dentro de `[from, to)`. */
  list(
    em: EntityManager,
    tenantId: string,
    filter: ListBlocksFilter,
  ): Promise<OperatingRoomBlocks[]> {
    if (filter.roomIds.length === 0) return Promise.resolve([]);
    return em.find(
      OperatingRoomBlocks,
      {
        tenantId,
        operatingRoomId: { $in: [...filter.roomIds] },
        startsAt: { $lt: filter.to },
        endsAt: { $gt: filter.from },
        ...(filter.ownerKindConceptId
          ? { ownerKindConceptId: filter.ownerKindConceptId }
          : {}),
        ...(filter.statusConceptIds
          ? { statusConceptId: { $in: [...filter.statusConceptIds] } }
          : {}),
      },
      { orderBy: { startsAt: 'ASC' } },
    );
  }

  /** Bloques activos de una serie a partir de un instante. */
  findSeriesInstances(
    em: EntityManager,
    tenantId: string,
    seriesId: string,
    statusConceptId: string,
    from: Date,
  ): Promise<OperatingRoomBlocks[]> {
    return em.find(
      OperatingRoomBlocks,
      { tenantId, seriesId, statusConceptId, endsAt: { $gt: from } },
      { orderBy: { startsAt: 'ASC' } },
    );
  }

  /** Casos vivos ligados a un bloque. */
  findLiveCasesInBlock(
    em: EntityManager,
    blockId: string,
    liveStatusConceptIds: readonly string[],
  ): Promise<ProcedureCases[]> {
    return em.find(ProcedureCases, {
      operatingRoomBlockId: blockId,
      statusConceptId: { $in: [...liveStatusConceptIds] },
    });
  }

  /**
   * Bloques activos cuyo plazo de liberación llegó. Sólo para el barrido del sistema: no
   * lleva tenant y exige contexto SYSTEM, porque recorre todas las organizaciones.
   */
  findReleasable(
    em: EntityManager,
    now: Date,
    activeStatusConceptId: string,
    limit: number,
  ): Promise<OperatingRoomBlocks[]> {
    return em.find(
      OperatingRoomBlocks,
      {
        statusConceptId: activeStatusConceptId,
        releaseAt: { $lte: now },
        endsAt: { $gt: now },
      },
      {
        orderBy: { releaseAt: 'ASC' },
        limit,
        lockMode: LockMode.PESSIMISTIC_WRITE,
      },
    );
  }
}
