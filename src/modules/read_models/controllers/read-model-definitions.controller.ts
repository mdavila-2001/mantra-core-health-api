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
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
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
  constructor(private readonly service: ReadModelDefinitionsService) {}

  /** UC-30-01. */
  @Post('definitions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar y publicar un contrato de read model versionado' })
  createDefinition(
    @Body() dto: CreateReadModelDefinitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReadModelDefinitionResponseDto> {
    return this.service.createDefinition(dto, actor);
  }

  /** UC-30-08. */
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

  /** UC-30-12. */
  @Get('health')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Detectar y reportar staleness/degradación de las MV' })
  health(): Promise<ReadModelHealthResponseDto> {
    return this.service.health();
  }

  /** UC-30-03. */
  @Post(':definitionId/refresh')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar la materialized view (REFRESH CONCURRENTLY, manual)' })
  refresh(
    @Param('definitionId', ParseUUIDPipe) definitionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RefreshRunResponseDto> {
    return this.service.refresh(definitionId, actor);
  }

  /** UC-30-04. */
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
  @Post(':definitionId/invalidate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidar y recomputar el read model tras cambio upstream' })
  invalidate(
    @Param('definitionId', ParseUUIDPipe) definitionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RefreshRunResponseDto> {
    return this.service.invalidate(definitionId, actor);
  }

  /** UC-30-07. */
  @Post(':definitionId/reconcile')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reconciliar read model divergente contra la fuente canónica' })
  reconcile(
    @Param('definitionId', ParseUUIDPipe) definitionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RefreshRunResponseDto> {
    return this.service.reconcile(definitionId, actor);
  }

  /** UC-30-13a. */
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
