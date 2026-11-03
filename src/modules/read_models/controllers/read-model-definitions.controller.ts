import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { ReadModelDefinitionsService } from '../services';
import {
  CreateReadModelDefinitionDto,
  CreateReadModelVersionDto,
  ReadModelDefinitionResponseDto,
  RefreshRunResponseDto,
  ReadModelHealthResponseDto,
  OperationResultDto,
} from '../dto';

/**
 * Endpoints administrativos sobre `/read-models`: publicación y versionado de
 * contratos, corridas de refresh/backfill/invalidación/reconciliación, salud de
 * staleness y deprecación/retiro. Capa fina que delega en el servicio de dominio.
 */
@ApiTags('read-models')
@ApiBearerAuth()
@Controller('read-models')
export class ReadModelDefinitionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: ReadModelDefinitionsService) {}

  /** UC-30-01. */
  @Audited({
    action: 'READ_MODEL_DEFINITION_CREATED',
    entity: 'read_model_definition',
    entityId: 'result.id',
  })
  @Post('definitions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar y publicar un contrato de read model versionado',
  })
  createDefinition(
    @Body() dto: CreateReadModelDefinitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReadModelDefinitionResponseDto> {
    return this.service.createDefinition(dto, actor);
  }

  /** UC-30-08. */
  @Audited({
    action: 'READ_MODEL_DEFINITION_VERSIONED',
    entity: 'read_model_definition',
    entityId: 'result.id',
  })
  @Post('definitions/:schema/:object/versions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Versionar el esquema de un read model' })
  createVersion(
    @Param('schema') schema: string,
    @Param('object') object: string,
    @Body() dto: CreateReadModelVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReadModelDefinitionResponseDto> {
    return this.service.createVersion(schema, object, dto, actor);
  }

  /**
   * UC-30-12. `SYSTEM` se añade junto al rol humano: el worker de
   * reconciliación (Fase 4 del plan de corrección de workers) usa este mismo
   * endpoint para descubrir qué definiciones están `stale` antes de llamar
   * `reconcile`, igual que el resto de endpoints que ya sirven a un worker
   * (`GRAPH_PROJECTION_WORKER`, `EMBEDDING_WORKER`, etc. ya incluyen `SYSTEM`).
   */
  @Get('health')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Detectar y reportar staleness/degradación de las MV',
  })
  health(): Promise<ReadModelHealthResponseDto> {
    return this.service.health();
  }

  /** UC-30-03. */
  @Audited({
    action: 'READ_MODEL_REFRESHED',
    entity: 'read_model_refresh_run',
    entityId: 'result.id',
  })
  @Post(':definitionId/refresh')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar la materialized view (REFRESH CONCURRENTLY, manual)',
  })
  refresh(
    @Param('definitionId', ParseUUIDPipe) definitionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RefreshRunResponseDto> {
    return this.service.refresh(definitionId, actor);
  }

  /** UC-30-04. */
  @Audited({
    action: 'READ_MODEL_BACKFILLED',
    entity: 'read_model_definition',
    entityId: 'param:definitionId',
  })
  @Post(':definitionId/backfill')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Backfill inicial de una nueva materialized view' })
  backfill(
    @Param('definitionId', ParseUUIDPipe) definitionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RefreshRunResponseDto> {
    return this.service.backfill(definitionId, actor);
  }

  /** UC-30-06. */
  @Audited({
    action: 'READ_MODEL_INVALIDATED',
    entity: 'read_model_definition',
    entityId: 'param:definitionId',
  })
  @Post(':definitionId/invalidate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invalidar y recomputar el read model tras cambio upstream',
  })
  invalidate(
    @Param('definitionId', ParseUUIDPipe) definitionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RefreshRunResponseDto> {
    return this.service.invalidate(definitionId, actor);
  }

  /**
   * UC-30-07. `SYSTEM` se añade junto al rol humano por la misma razón que en
   * `health()`: el worker periódico llama este endpoint para cada definición
   * `stale` que descubre.
   */
  @Audited({
    action: 'READ_MODEL_RECONCILED',
    entity: 'read_model_definition',
    entityId: 'param:definitionId',
  })
  @Post(':definitionId/reconcile')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reconciliar read model divergente contra la fuente canónica',
  })
  reconcile(
    @Param('definitionId', ParseUUIDPipe) definitionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RefreshRunResponseDto> {
    return this.service.reconcile(definitionId, actor);
  }

  /** UC-30-13a. */
  @Audited({
    action: 'READ_MODEL_DEFINITION_DEPRECATED',
    entity: 'read_model_definition',
    entityId: 'param:id',
  })
  @Post('definitions/:id/deprecate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deprecar una versión de read model' })
  deprecate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.service.deprecate(id, actor);
  }

  /** UC-30-13b. */
  @Audited({
    action: 'READ_MODEL_DEFINITION_RETIRED',
    entity: 'read_model_definition',
    entityId: 'param:id',
  })
  @Delete('definitions/:id')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirar una versión de read model (guarda de FK)' })
  retire(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.service.retire(id, actor);
  }
}
