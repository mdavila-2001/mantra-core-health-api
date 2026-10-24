import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { LakehouseCollectionsService } from '../services';
import {
  DatasetReleaseRequestPageDto,
  LakehouseDatasetPageDto,
  LakehouseQualityRunPageDto,
  ListDatasetReleasesQueryDto,
  ListDatasetsQueryDto,
  ListQualityRunsQueryDto,
  ListRunsQueryDto,
  TransformationRunPageDto,
} from '../dto';

/**
 * `GET` de colección de `lakehouse` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('lakehouse-collections')
@ApiBearerAuth()
@Controller()
export class LakehouseCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: LakehouseCollectionsService) {}

  /** V63-01: listar liberaciones de datasets del tenant. */
  @Get('research/dataset-releases')
  @Roles('PRINCIPAL_INVESTIGATOR', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar liberaciones de datasets del tenant' })
  @ApiOkResponse({ type: DatasetReleaseRequestPageDto })
  listDatasetReleases(
    @Query() query: ListDatasetReleasesQueryDto,
  ): Promise<DatasetReleaseRequestPageDto> {
    return this.collections.listDatasetReleases(query);
  }

  /** V63-05: listar datasets del lakehouse del tenant. */
  @Get('lakehouse/datasets')
  @Roles('DATA_PLATFORM_ENGINEER', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar datasets del lakehouse del tenant' })
  @ApiOkResponse({ type: LakehouseDatasetPageDto })
  listDatasets(
    @Query() query: ListDatasetsQueryDto,
  ): Promise<LakehouseDatasetPageDto> {
    return this.collections.listDatasets(query);
  }

  /** V63-06: listar corridas de calidad de un dataset del tenant. */
  @Get('lakehouse/datasets/:id/quality-runs')
  @Roles('DATA_STEWARD', 'SYSTEM', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar corridas de calidad de un dataset del tenant',
  })
  @ApiOkResponse({ type: LakehouseQualityRunPageDto })
  listQualityRuns(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListQualityRunsQueryDto,
  ): Promise<LakehouseQualityRunPageDto> {
    return this.collections.listQualityRuns(id, query);
  }

  /** V63-08: listar ejecuciones de una transformación del tenant. */
  @Get('lakehouse/transformations/:defId/runs')
  @Roles('SYSTEM', 'TRANSFORMATION_WORKER', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar ejecuciones de una transformación del tenant',
  })
  @ApiOkResponse({ type: TransformationRunPageDto })
  listRuns(
    @Param('defId', ParseUUIDPipe) defId: string,
    @Query() query: ListRunsQueryDto,
  ): Promise<TransformationRunPageDto> {
    return this.collections.listRuns(defId, query);
  }
}
