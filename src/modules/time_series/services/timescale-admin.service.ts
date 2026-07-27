import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import { SeriesIngestRepository, TimescaleRepository } from '../repositories';
import {
  COMPRESSION_SEGMENTS,
  METRIC_CODES,
  PIPELINE_CODE,
  ROLLUPS,
  type RollupName,
  type TimeseriesTable,
} from '../constants';
import {
  ConfigureHypertableDto,
  UpdateHypertableDto,
  HypertableResponseDto,
  RunCompressionDto,
  CompressionResponseDto,
  ApplyRetentionDto,
  RetentionResponseDto,
  RefreshRollupDto,
  RefreshRollupResponseDto,
} from '../dto';

const DEFAULT_MAX_CHUNKS = 10;
const DEFAULT_SPACE_PARTITIONS = 4;

/**
 * Administración física de las series (UC-58-04 … 08): hypertables, compresión,
 * retención y agregados continuos.
 *
 * Estas cinco operaciones no son CRUD. Manipulan objetos del propio motor con las
 * funciones de catálogo de TimescaleDB, y por eso el repositorio que usan compone
 * SQL: los nombres de tabla y de rollup vienen de la lista blanca del módulo, no
 * de la petición.
 */
@Injectable()
export class TimescaleAdminService {
  constructor(
    private readonly em: EntityManager,
    private readonly timescaleRepo: TimescaleRepository,
    private readonly ingestRepo: SeriesIngestRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TimescaleAdminService.name);
  }

  /**
   * UC-58-04: convertir la tabla en hypertable y declarar su particionado.
   *
   * Es idempotente por construcción: `create_hypertable` lleva `if_not_exists`, y
   * la conversión ya la hace el arranque del ORM. Este endpoint existe para
   * ajustar el particionado de una tabla concreta sin reiniciar, que es lo que el
   * caso de uso pide.
   *
   * La dimensión de espacio importa: particionar sólo por tiempo mete a todos los
   * tenants en el mismo chunk, y una consulta de un tenant acaba leyendo los datos
   * de todos.
   */
  async configureHypertable(
    dto: ConfigureHypertableDto,
    actor: AuthenticatedUser,
  ): Promise<HypertableResponseDto> {
    return this.em.transactional(async (tx) => {
      await this.timescaleRepo.createHypertable(tx, dto.table);

      if (dto.chunkTimeInterval) {
        await this.timescaleRepo.setChunkTimeInterval(
          tx,
          dto.table,
          dto.chunkTimeInterval,
        );
      }

      let spaceDimensionAdded = false;
      if (dto.spaceColumn) {
        await this.timescaleRepo.addSpaceDimension(
          tx,
          dto.table,
          dto.spaceColumn,
          dto.spacePartitions ?? DEFAULT_SPACE_PARTITIONS,
        );
        spaceDimensionAdded = true;
      }

      const info = await this.timescaleRepo.describeHypertable(tx, dto.table);

      this.logger.info(
        {
          operation: 'ts.admin.hypertable',
          table: dto.table,
          spaceDimensionAdded,
        },
        'Hypertable configurada',
      );

      return {
        table: dto.table,
        chunkCount: info?.num_chunks,
        compressionEnabled: info?.compression_enabled,
        spaceDimensionAdded,
      };
    });
  }

  /** UC-58-04: cambiar la anchura temporal del chunk de una hypertable existente. */
  async updateHypertable(
    table: string,
    dto: UpdateHypertableDto,
    actor: AuthenticatedUser,
  ): Promise<HypertableResponseDto> {
    return this.em.transactional(async (tx) => {
      const info = await this.timescaleRepo.describeHypertable(tx, table);
      if (!info) {
        throw new PreconditionFailedException(
          'La tabla todavía no es una hypertable; conviértela antes de ajustar sus chunks.',
          { table },
        );
      }

      await this.timescaleRepo.setChunkTimeInterval(
        tx,
        table,
        dto.chunkTimeInterval,
      );

      this.logger.info(
        {
          operation: 'ts.admin.hypertable-update',
          table,
          chunkTimeInterval: dto.chunkTimeInterval,
        },
        'Anchura de chunk actualizada',
      );

      return {
        table,
        chunkCount: info.num_chunks,
        compressionEnabled: info.compression_enabled,
        spaceDimensionAdded: false,
      };
    });
  }

  /**
   * UC-58-05: comprimir los chunks antiguos.
   *
   * Se comprime **un chunk cada vez** y con tope por pasada. Comprimir es una
   * operación pesada que reescribe el chunk entero; lanzarla sobre todos los
   * candidatos a la vez bloquearía la tabla el tiempo que dure, y de eso se trata
   * precisamente de escapar.
   *
   * Un chunk comprimido queda de sólo lectura. Por eso sólo se comprime lo más
   * antiguo que el umbral: una escritura tardía sobre un chunk ya comprimido
   * fallaría.
   */
  async runCompression(
    dto: RunCompressionDto,
    actor: AuthenticatedUser,
  ): Promise<CompressionResponseDto> {
    return this.em.transactional(async (tx) => {
      const segmentBy = COMPRESSION_SEGMENTS[dto.table as TimeseriesTable];
      if (!segmentBy) {
        throw new PreconditionFailedException(
          'La serie no declara por qué columnas se segmenta al comprimir.',
          { table: dto.table },
        );
      }

      await this.timescaleRepo.enableCompression(tx, dto.table, segmentBy);

      const candidates = await this.timescaleRepo.listChunksOlderThan(
        tx,
        dto.table,
        dto.olderThan,
      );
      const limit = dto.maxChunks ?? DEFAULT_MAX_CHUNKS;
      const toCompress = candidates.slice(0, limit);

      for (const chunk of toCompress) {
        await this.timescaleRepo.compressChunk(tx, chunk);
      }

      this.ingestRepo.createPipelineMetric(tx, {
        time: new Date(),
        tenantId: dto.tenantId,
        seriesId: `${PIPELINE_CODE}:compression`,
        ingestionId: dto.batchId,
        sourceVersion: '1',
        qualityState: 'received',
        pipelineCode: PIPELINE_CODE,
        batchId: dto.batchId,
        stageCode: 'compression',
        metricCode: METRIC_CODES.CHUNKS_COMPRESSED,
        metricValue: toCompress.length,
        dimensions: { table: dto.table, olderThan: dto.olderThan },
      });

      if (toCompress.length > 0) {
        await this.outbox.publishDomainEvent(tx, {
          tenantId: dto.tenantId,
          eventType: 'ChunksCompressed',
          aggregateType: `time_series.${dto.table}`,
          aggregateId: dto.batchId,
          payloadJson: {
            table: dto.table,
            chunksCompressed: toCompress.length,
          },
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        {
          operation: 'ts.admin.compression',
          table: dto.table,
          compressed: toCompress.length,
          remaining: candidates.length - toCompress.length,
        },
        'Chunks comprimidos',
      );

      return {
        table: dto.table,
        chunksCompressed: toCompress.length,
        remainingChunks: candidates.slice(limit),
      };
    });
  }

  /**
   * UC-58-06: aplicar la retención descartando chunks fuera de ventana.
   *
   * Es metadata, no borrado fila a fila: descartar la retención de una serie de
   * mil millones de filas cuesta lo mismo que la de una de mil.
   *
   * **Nunca sobre `audit_access_metric_series` como sustituto de la auditoría.**
   * Estas métricas son conteos para paneles; la cadena de auditoría legal vive en
   * `audit.audit_events` y no la reemplazan. Descartar aquí no toca aquello.
   */
  async applyRetention(
    dto: ApplyRetentionDto,
    actor: AuthenticatedUser,
  ): Promise<RetentionResponseDto> {
    return this.em.transactional(async (tx) => {
      const dropped = await this.timescaleRepo.dropChunksOlderThan(
        tx,
        dto.table,
        dto.olderThan,
      );

      this.ingestRepo.createPipelineMetric(tx, {
        time: new Date(),
        tenantId: dto.tenantId,
        seriesId: `${PIPELINE_CODE}:retention`,
        ingestionId: dto.batchId,
        sourceVersion: '1',
        qualityState: 'received',
        pipelineCode: PIPELINE_CODE,
        batchId: dto.batchId,
        stageCode: 'retention',
        metricCode: METRIC_CODES.CHUNKS_DROPPED,
        metricValue: dropped.length,
        dimensions: { table: dto.table, olderThan: dto.olderThan },
      });

      if (dropped.length > 0) {
        await this.outbox.publishDomainEvent(tx, {
          tenantId: dto.tenantId,
          eventType: 'ChunksDropped',
          aggregateType: `time_series.${dto.table}`,
          aggregateId: dto.batchId,
          payloadJson: {
            table: dto.table,
            chunksDropped: dropped.length,
            olderThan: dto.olderThan,
            reason: dto.reason ?? null,
          },
          actorUserId: actor.id,
        });
      }

      this.logger.warn(
        {
          operation: 'ts.admin.retention',
          table: dto.table,
          dropped: dropped.length,
          olderThan: dto.olderThan,
        },
        'Chunks descartados por retención',
      );

      return {
        table: dto.table,
        chunksDropped: dropped.length,
        droppedChunks: dropped,
      };
    });
  }

  /**
   * UC-58-07 y UC-58-08: materializar la ventana de un agregado continuo.
   *
   * **El refresco corre fuera de transacción a propósito.**
   * `refresh_continuous_aggregate` es un procedimiento que TimescaleDB no permite
   * llamar dentro de un bloque transaccional: hace su propio control de
   * transacciones por bucket para no mantener bloqueada la tabla de origen
   * mientras materializa. Envolverlo abortaría la llamada.
   *
   * Por eso la operación va en dos tiempos: primero el refresco en autocommit, y
   * después una transacción corta que cuenta los buckets, emite la métrica y
   * publica el evento. Si el proceso muere entre ambos, el agregado queda
   * materializado —que es idempotente— y sólo se pierde la métrica.
   */
  async refreshRollup(
    name: RollupName,
    dto: RefreshRollupDto,
    actor: AuthenticatedUser,
  ): Promise<RefreshRollupResponseDto> {
    const from = new Date(dto.from);
    const to = new Date(dto.to);
    if (from >= to) {
      throw new PreconditionFailedException(
        'La ventana a materializar tiene que empezar antes de terminar.',
        { from: dto.from, to: dto.to },
      );
    }

    await this.timescaleRepo.ensureContinuousAggregate(this.em, name);
    await this.timescaleRepo.refreshContinuousAggregate(
      this.em,
      name,
      from,
      to,
    );

    return this.em.transactional(async (tx) => {
      const buckets = await this.timescaleRepo.countRollupBuckets(
        tx,
        name,
        from,
        to,
      );

      this.ingestRepo.createPipelineMetric(tx, {
        time: new Date(),
        tenantId: dto.tenantId,
        seriesId: `${PIPELINE_CODE}:rollup`,
        ingestionId: dto.batchId,
        sourceVersion: '1',
        qualityState: 'received',
        pipelineCode: PIPELINE_CODE,
        batchId: dto.batchId,
        stageCode: 'rollup',
        metricCode:
          name === 'continuous_audit_daily'
            ? METRIC_CODES.AUDIT_BUCKETS
            : METRIC_CODES.ROWS_MATERIALIZED,
        metricValue: buckets,
        dimensions: { rollup: name, source: ROLLUPS[name].source },
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType:
          name === 'continuous_audit_daily'
            ? 'AuditDailyRollupRefreshed'
            : 'SliRollupMaterialized',
        aggregateType: `time_series.${name}`,
        aggregateId: dto.batchId,
        payloadJson: {
          rollup: name,
          from: dto.from,
          to: dto.to,
          bucketsMaterialized: buckets,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'ts.admin.rollup',
          rollup: name,
          buckets,
          from: dto.from,
          to: dto.to,
        },
        'Agregado continuo materializado',
      );

      return {
        rollup: name,
        bucketsMaterialized: buckets,
        from: dto.from,
        to: dto.to,
      };
    });
  }
}
