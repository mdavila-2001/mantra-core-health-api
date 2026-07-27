import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  SeriesIngestService,
  SeriesQueryService,
  VitalNormalizationService,
} from '../services';
import { METRIC_DATASETS, type MetricDataset } from '../constants';
import {
  BatchIngestPointsDto,
  BatchIngestResponseDto,
  IngestDeviceReadingsDto,
  NormalizeReadingDto,
  NormalizeReadingResponseDto,
  BatchIngestAdsDto,
  BatchIngestMetricsDto,
  BatchIngestLocationDto,
  GovernedBackfillDto,
  GovernedBackfillResponseDto,
  QuerySeriesRangeDto,
  QuerySeriesRangeResponseDto,
} from '../dto';
import { BadRequestException } from '@nestjs/common';

/** Ingesta y consulta de series temporales (UC-58-01, 02, 03, 09, 10, 11, 12, 13). */
@ApiTags('time_series')
@ApiBearerAuth()
@Controller('ts')
export class SeriesController {
  constructor(
    private readonly ingestService: SeriesIngestService,
    private readonly normalizationService: VitalNormalizationService,
    private readonly queryService: SeriesQueryService,
  ) {}

  /** UC-58-09. Declarada antes que las de ingesta para leerse junto a su serie. */
  @Get('series/:seriesId/query')
  @Roles('ANALYST', 'DATA_PLATFORM_ADMIN', 'SYSTEM', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Consultar un rango con downsampling',
    description:
      'Si el bucket es lo bastante ancho y la serie tiene agregado continuo, la respuesta se sirve desde el rollup.',
  })
  queryRange(
    @Param('seriesId') seriesId: string,
    @Query() query: QuerySeriesRangeDto,
  ): Promise<QuerySeriesRangeResponseDto> {
    return this.queryService.queryRange(seriesId, query);
  }

  /** UC-58-01. */
  @Post('series/:seriesId/points/batch-ingest')
  @Roles('INGEST_GATEWAY', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ingerir un lote de puntos en una serie',
    description: 'Append-only: el lote entra entero o no entra.',
  })
  batchIngestPoints(
    @Param('seriesId') seriesId: string,
    @Body() dto: BatchIngestPointsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BatchIngestResponseDto> {
    return this.ingestService.batchIngestPoints(seriesId, dto, actor);
  }

  /** UC-58-12. */
  @Post('series/:seriesId/backfill/governed')
  @Roles('DATA_PLATFORM_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Backfill gobernado de una serie',
    description:
      'Las correcciones entran como eventos nuevos con `quality_state = backfill`; los originales no se tocan.',
  })
  governedBackfill(
    @Param('seriesId') seriesId: string,
    @Body() dto: GovernedBackfillDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GovernedBackfillResponseDto> {
    return this.ingestService.governedBackfill(seriesId, dto, actor);
  }

  /** UC-58-02. */
  @Post('devices/:deviceId/readings/ingest')
  @Roles('INGEST_GATEWAY', 'DEVICE', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ingerir lecturas de un dispositivo médico',
    description:
      'La secuencia del dispositivo descarta el reenvío sin contarlo dos veces.',
  })
  ingestDeviceReadings(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body() dto: IngestDeviceReadingsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BatchIngestResponseDto> {
    return this.ingestService.ingestDeviceReadings(deviceId, dto, actor);
  }

  /** UC-58-03. */
  @Post('normalize/run')
  @Roles('SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Normalizar una lectura cruda y promoverla al registro clínico',
    description:
      'La vital y la observación clínica se confirman juntas; reprocesar el mismo evento no promueve dos veces.',
  })
  normalizeReading(
    @Body() dto: NormalizeReadingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<NormalizeReadingResponseDto> {
    return this.normalizationService.normalizeReading(dto, actor);
  }

  /** UC-58-10. */
  @Post('ads/events/batch-ingest')
  @Roles('INGEST_GATEWAY', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ingerir eventos de entrega de publicidad',
    description: 'El `eventId` del origen es la clave de deduplicación.',
  })
  batchIngestAdsEvents(
    @Body() dto: BatchIngestAdsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BatchIngestResponseDto> {
    return this.ingestService.batchIngestAdsEvents(dto, actor);
  }

  /** UC-58-11. */
  @Post('metrics/:dataset/batch-ingest')
  @Roles('INGEST_GATEWAY', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ingerir métricas de runtime de IA, pipeline o SLI',
    description:
      'El dataset viaja en la ruta y se valida contra la lista cerrada del módulo.',
  })
  batchIngestMetrics(
    @Param('dataset') dataset: string,
    @Body() dto: BatchIngestMetricsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BatchIngestResponseDto> {
    if (!(METRIC_DATASETS as readonly string[]).includes(dataset)) {
      throw new BadRequestException(
        `El dataset de métricas debe ser uno de: ${METRIC_DATASETS.join(', ')}.`,
      );
    }
    return this.ingestService.batchIngestMetrics(
      dataset as MetricDataset,
      dto,
      actor,
    );
  }

  /** UC-58-13. */
  @Post('location/pings/batch-ingest')
  @Roles('INGEST_GATEWAY', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ingerir pings de ubicación',
    description:
      'Exige el consentimiento vigente que ampara el registro del sujeto.',
  })
  batchIngestLocationPings(
    @Body() dto: BatchIngestLocationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BatchIngestResponseDto> {
    return this.ingestService.batchIngestLocationPings(dto, actor);
  }
}
