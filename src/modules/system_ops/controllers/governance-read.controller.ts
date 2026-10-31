import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { TenantAgnostic } from '../../../common/tenant/tenant-agnostic.decorator';
import {
  ChangeLogPageDto,
  ChangeLogQueryDto,
  EntityIdParamDto,
  EntityRegistryPageDto,
  EntityRegistryQueryDto,
  FieldRegistryPageDto,
  GovPageQueryDto,
  PolicyDetailDto,
  PolicyListQueryDto,
  PolicyPageDto,
  PolicyParamDto,
} from '../dto/governance-read.dto';
import { GovernanceReadService } from '../services/governance-read.service';

/**
 * Quién lee el gobierno de datos: los roles de gobernanza ya usados por el catálogo de datos.
 * Escribir sigue siendo de `SECURITY_ADMIN` (ver `GovernanceCatalogController`).
 */
export const GOVERNANCE_READ_ROLES = [
  'SECURITY_ADMIN',
  'GOVERNANCE_ADMIN',
  'DPO',
  'PLATFORM_ADMIN',
  'DATA_PLATFORM_ADMIN',
] as const;

/**
 * Lecturas de gobierno de datos bajo `admin/governance`: políticas, bitácora de cambios y registro
 * de entidades y campos. Sólo `GET`; datos de la plataforma, fuera de cualquier tenant. La API es la
 * autoridad de acceso: ocultar el menú en la pantalla no protege nada.
 *
 * CONTRATO H4 (docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/contratos/H4-gobernanza.md)
 * Roles: SECURITY_ADMIN, GOVERNANCE_ADMIN, DPO, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. Sin token 401;
 * otro rol 403. Paginación por cursor opaco `nextCursor` (limit 1..200, def. 50), orden total con
 * desempate estable; parámetros no declarados, valores fuera de lista o cursor corrupto → 400.
 * Respuesta mínima: códigos en vez de ids de concepto, sin snapshots, sin valores de parámetros,
 * sin notas libres.
 *
 *  - GET /admin/governance/policies
 *      query: type? (WRITE|RETENTION|ANONYMIZATION|RESIDENCY), state? (código), q?,
 *             sort? (code|updatedAt, def. code), order? (asc|desc, def. asc), limit?, cursor?
 *      200: { items: [{ policyType, id, code, name, state, version, updatedAt }], nextCursor, limit, sort, order }
 *      400: cursor de otro orden.
 *  - GET /admin/governance/policies/:policyType/:id
 *      200: { …resumen, createdAt, createdByUserId, updatedByUserId, settings, appliedTo: { total, items:
 *             [{ schemaName, tableName, columnName }], truncated } }   (appliedTo: máx. 50)
 *      400: tipo o uuid inválido · 404: no existe.
 *  - GET /admin/governance/change-log
 *      query: targetType?, targetId? (uuid), changedBy? (uuid), from?, to? (ISO 8601, `to` > `from`;
 *             sin rango: últimos 30 días), limit?, cursor?
 *      200: { items: [{ id, targetType, targetId, action, changedByUserId, reason, recordedAt }],
 *             nextCursor, limit, order: 'recorded_at desc, id desc' }
 *  - GET /admin/governance/entity-registry
 *      query: schema?, q?, domain?, classification?, containsPii?, containsPhi?, limit?, cursor?
 *      200: { items: [{ id, schemaName, tableName, domain, classification, ownerTeam, containsPii,
 *             containsPhi, isAppendOnly, isSoftDelete, hasHistory, retentionPolicyCode, writePolicyCode,
 *             fieldCount, personalFieldCount }], nextCursor, limit, order, notMeasured }
 *             (`notMeasured` declara el registro vacío)
 *  - GET /admin/governance/entity-registry/:id/fields
 *      200: { items: [{ id, columnName, classification, isPii, isPhi, maskingStrategy,
 *             anonymizationRuleCode }], nextCursor, limit, order } · 400 uuid inválido · 404 no existe.
 */
@ApiTags('system-ops-governance')
@ApiBearerAuth()
@TenantAgnostic()
@Roles(...GOVERNANCE_READ_ROLES)
@Controller('admin/governance')
export class GovernanceReadController {
  constructor(private readonly service: GovernanceReadService) {}

  @Get('policies')
  @ApiOperation({
    summary:
      'Políticas de gobierno (escritura, retención, anonimización, residencia) en una lista paginada',
  })
  @ApiResponse({ status: 200, type: PolicyPageDto })
  policies(@Query() q: PolicyListQueryDto) {
    return this.service.policies(q);
  }

  @Get('policies/:policyType/:id')
  @ApiOperation({
    summary:
      'Una política: ajustes, estado y a qué tablas o columnas se aplica',
  })
  @ApiResponse({ status: 200, type: PolicyDetailDto })
  @ApiResponse({ status: 404, description: 'La política no existe' })
  policy(@Param() p: PolicyParamDto) {
    return this.service.policy(p.policyType, p.id);
  }

  @Get('change-log')
  @ApiOperation({
    summary: 'Cambios de gobierno de datos: quién cambió qué y cuándo',
    description:
      'Filtra por tipo de objeto, objeto, actor y fecha. Sin rango, los últimos 30 días (la tabla no tiene índice por fecha).',
  })
  @ApiResponse({ status: 200, type: ChangeLogPageDto })
  changeLog(@Query() q: ChangeLogQueryDto) {
    return this.service.changeLog(q);
  }

  @Get('entity-registry')
  @ApiOperation({
    summary:
      'Entidades declaradas en el registro de gobierno (dominio, clasificación, PII/PHI)',
  })
  @ApiResponse({ status: 200, type: EntityRegistryPageDto })
  entityRegistry(@Query() q: EntityRegistryQueryDto) {
    return this.service.entityRegistry(q);
  }

  @Get('entity-registry/:id/fields')
  @ApiOperation({
    summary:
      'Campos declarados de una entidad, con su marca PII/PHI y su enmascaramiento',
  })
  @ApiResponse({ status: 200, type: FieldRegistryPageDto })
  @ApiResponse({
    status: 404,
    description: 'La entidad no está en el registro',
  })
  fields(@Param() p: EntityIdParamDto, @Query() q: GovPageQueryDto) {
    return this.service.fieldRegistry(p.id, q);
  }
}
