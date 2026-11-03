import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { GovernanceCatalogService } from '../services';
import {
  ApplyRetentionPolicyDto,
  ApplyWritePolicyDto,
  CatalogEntityDto,
  CreateAnonymizationRuleDto,
  CreateRetentionPolicyDto,
  CreateWritePolicyDto,
  EntityRegistryResponseDto,
  IdResultDto,
  StatusResultDto,
  UpdateFieldRegistryDto,
} from '../dto';

/**
 * Endpoints administrativos de catálogo y políticas de gobierno de datos
 * (UC-11-01..04). Capa fina: valida parámetros y delega en el servicio.
 */
@ApiTags('system-ops-governance')
@ApiBearerAuth()
@Controller('admin/governance')
export class GovernanceCatalogController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: GovernanceCatalogService) {}

  /** UC-11-01. */
  @Audited({
    action: 'GOVERNED_ENTITY_CATALOGUED',
    entity: 'entity_registry',
    entityId: 'result.id',
  })
  @Post('entity-registry')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar dominio, clasificación y catalogar entidad + campos',
  })
  catalogEntity(
    @Body() dto: CatalogEntityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EntityRegistryResponseDto> {
    return this.service.catalogEntity(dto, actor);
  }

  /** UC-11-02. */
  @Audited({
    action: 'WRITE_POLICY_CREATED',
    entity: 'write_policy',
    entityId: 'result.id',
  })
  @Post('write-policies')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir una política de escritura' })
  createWritePolicy(
    @Body() dto: CreateWritePolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.service.createWritePolicy(dto, actor);
  }

  /** UC-11-02. */
  @Audited({
    action: 'GOVERNED_ENTITY_WRITE_POLICY_APPLIED',
    entity: 'entity_registry',
    entityId: 'param:id',
  })
  @Patch('entity-registry/:id/write-policy')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vincular una política de escritura a una entidad' })
  applyWritePolicy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyWritePolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.service.applyWritePolicy(id, dto, actor);
  }

  /** UC-11-03. */
  @Audited({
    action: 'GOVERNANCE_RETENTION_POLICY_CREATED',
    entity: 'retention_policy',
    entityId: 'result.id',
  })
  @Post('retention-policies')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir una política de retención con base legal' })
  createRetentionPolicy(
    @Body() dto: CreateRetentionPolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.service.createRetentionPolicy(dto, actor);
  }

  /** UC-11-03. */
  @Audited({
    action: 'GOVERNED_ENTITY_RETENTION_APPLIED',
    entity: 'entity_registry',
    entityId: 'param:id',
  })
  @Patch('entity-registry/:id/retention')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aplicar una política de retención a una entidad' })
  applyRetention(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyRetentionPolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.service.applyRetention(id, dto, actor);
  }

  /** UC-11-04. */
  @Audited({
    action: 'ANONYMIZATION_RULE_CREATED',
    entity: 'anonymization_rule',
    entityId: 'result.id',
  })
  @Post('anonymization-rules')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir una regla de anonimización' })
  createAnonymizationRule(
    @Body() dto: CreateAnonymizationRuleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.service.createAnonymizationRule(dto, actor);
  }

  /** UC-11-04. */
  @Audited({
    action: 'GOVERNED_FIELD_UPDATED',
    entity: 'field_registry',
    entityId: 'param:id',
  })
  @Patch('field-registry/:id')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Asignar regla de anonimización / masking a un campo',
  })
  updateField(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFieldRegistryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.service.updateField(id, dto, actor);
  }
}
