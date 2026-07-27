import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { LakehouseCatalogService, TransformationService } from '../services';
import {
  DefineZoneDto,
  ZoneResponseDto,
  RegisterCatalogDto,
  CatalogResponseDto,
  PublishProductVersionDto,
  ProductVersionResponseDto,
  RegisterDatasetDto,
  DatasetResponseDto,
  RunTransformationDto,
  TransformationRunResponseDto,
  CuratedIngestionDto,
  CuratedIngestionResponseDto,
  RunQualityCheckDto,
  QualityRunResponseDto,
} from '../dto';

/** Catálogo y ejecución del lakehouse (UC-63-01 … 08). */
@ApiTags('lakehouse')
@ApiBearerAuth()
@Controller('lakehouse')
export class LakehouseController {
  constructor(
    private readonly catalogService: LakehouseCatalogService,
    private readonly transformationService: TransformationService,
  ) {}

  /** UC-63-01. */
  @Post('zones')
  @Roles('DATA_PLATFORM_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir una zona del data lake',
    description:
      'La zona no es una etiqueta descriptiva: `curated` sólo admite dato de-identificado.',
  })
  defineZone(
    @Body() dto: DefineZoneDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ZoneResponseDto> {
    return this.catalogService.defineZone(dto, actor);
  }

  /** UC-63-02. */
  @Post('catalogs')
  @Roles('DATA_PLATFORM_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar el catálogo / metastore' })
  registerCatalog(
    @Body() dto: RegisterCatalogDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CatalogResponseDto> {
    return this.catalogService.registerCatalog(dto, actor);
  }

  /** UC-63-03. */
  @Post('data-products/:id/versions')
  @Roles('DATA_PRODUCT_OWNER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar el producto de datos y su versión',
    description:
      'Upsert del producto y alta de la versión; la vigente anterior queda superseded y del SLO salen las reglas de calidad.',
  })
  publishProductVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishProductVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProductVersionResponseDto> {
    return this.catalogService.publishProductVersion(id, dto, actor);
  }

  /** UC-63-04. */
  @Post('datasets')
  @Roles('DATA_PLATFORM_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el dataset y su esquema inicial',
    description: 'Exige versión de producto activa, y zona y catálogo activos.',
  })
  registerDataset(
    @Body() dto: RegisterDatasetDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DatasetResponseDto> {
    return this.catalogService.registerDataset(dto, actor);
  }

  /** UC-63-05 + UC-63-06. */
  @Post('transformations/:defId/runs')
  @Roles('SYSTEM', 'TRANSFORMATION_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar la corrida con sus particiones, archivos y linaje',
    description:
      'Una sola corrida viva por definición. Las particiones y archivos ya escritos se saltan por su huella: corregir crea una partición nueva, no reescribe.',
  })
  runTransformation(
    @Param('defId', ParseUUIDPipe) defId: string,
    @Body() dto: RunTransformationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransformationRunResponseDto> {
    return this.transformationService.runTransformation(defId, dto, actor);
  }

  /** UC-63-07. */
  @Post('ingestion/curated-runs')
  @Roles('SYSTEM', 'DEIDENTIFICATION_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ingerir dato de salud de-identificado en la zona curada',
    description:
      'El destino tiene que estar en zona `curated`; la corrida de de-identificación se registra en la misma transacción.',
  })
  ingestCurated(
    @Body() dto: CuratedIngestionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CuratedIngestionResponseDto> {
    return this.transformationService.ingestCurated(dto, actor);
  }

  /** UC-63-08. */
  @Post('datasets/:id/quality-runs')
  @Roles('DATA_STEWARD', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Evaluar la calidad del dataset y abrir hallazgos',
    description:
      'Una regla `blocking` incumplida pone el dataset en cuarentena.',
  })
  runQualityCheck(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RunQualityCheckDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<QualityRunResponseDto> {
    return this.transformationService.runQualityCheck(id, dto, actor);
  }
}
