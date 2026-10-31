import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { AccessLogged } from '../../../common/audit-trail';
import { PlatformTenantOptional } from '../../../common/tenant/platform-tenant-optional.decorator';
import {
  AuditFilterCatalogDto,
  AuditLogPageDto,
  AuditLogQueryDto,
  DataAccessPageDto,
  DataAccessQueryDto,
} from '../dto/audit-query.dto';
import { AuditQueryService } from '../services/audit-query.service';

/** Quién puede leer la bitácora: auditoría, protección de datos y seguridad. */
export const AUDIT_READ_ROLES = ['AUDITOR', 'DPO', 'SECURITY_ADMIN'] as const;

/** Propósito con que se sella la lectura de la bitácora: supervisión, no atención del paciente. */
const AUDIT_READ_PURPOSE = 'SECURITY_OVERSIGHT';

/**
 * Consulta de la bitácora de auditoría. Capa fina: valida filtros y delega en
 * {@link AuditQueryService}.
 *
 * CONTRATO (H4 · docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/contratos/H4-gobernanza.md)
 * Roles de lectura: AUDITOR, DPO, SECURITY_ADMIN. Sin token 401; otro rol 403. Orden fijo
 * `recorded_at desc, id desc` (desempate estable); paginación por cursor opaco (`nextCursor`).
 *
 *  - GET /audit/log
 *      query: from?, to? (ISO 8601; `to` > `from`, si no 400; sin rango: últimos 30 días),
 *             userId? (actor, uuid), tenantId?, entity?, entityId? (recurso, uuid), action?,
 *             method? (POST|PUT|PATCH|DELETE), route?, result? (SUCCESS|FAILURE),
 *             limit? (1..200, 50), cursor?
 *      200: { items: [{ id, userId, tenantId, action, entity, entityId, result, ip, method, route,
 *             healthRisk, recordedAt }], nextCursor, limit }
 *      400: filtro mal formado o cursor inválido (`INVALID_CURSOR`). Sella la lectura en data_access_log.
 *  - GET /audit/log/filter-catalog
 *      200: { filters: [{ name, type, description, options }], defaultWindowDays, defaultPageSize,
 *             maxPageSize, order, notMeasured: [{ field, reason }] }  (`requestId` y `correlationId`
 *             van en `notMeasured`: el sello no los guarda hoy).
 *  - GET /audit/data-access  (lecturas sensibles; mismos from/to/userId/tenantId/limit/cursor más
 *      patientProfileId?, resourceType?, operation? READ|CREATE|UPDATE|DELETE|EXPORT)
 *
 * Leer la bitácora es en sí un acceso sensible: cada lectura queda en `audit.data_access_log`
 * (`@AccessLogged`, antes de ejecutar). Es una vista de plataforma —atraviesa tenants—, así que no
 * exige un tenant resuelto; el filtro por tenant es del cliente.
 */
@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
@PlatformTenantOptional(...AUDIT_READ_ROLES, 'SUPERADMIN')
export class AuditQueryController {
  constructor(private readonly query: AuditQueryService) {}

  @Get('log')
  @Roles(...AUDIT_READ_ROLES)
  @AccessLogged({ resourceType: 'AUDIT_LOG', purpose: AUDIT_READ_PURPOSE })
  @ApiOperation({
    summary:
      'Bitácora de acciones que mutaron, con filtros y riesgo para la seguridad de la salud',
    description:
      'Filtra por actor, rango de fechas, resultado, tenant, acción, verbo y ruta. El verbo y la ruta se derivan de la acción; para las acciones de negocio, del mapa de rutas armado al arrancar (`null` si la acción sella varias rutas). El riesgo se deriva al leer y no se guarda. Sin rango, mira los últimos 30 días.',
  })
  @ApiResponse({ status: 200, type: AuditLogPageDto })
  log(@Query() q: AuditLogQueryDto) {
    return this.query.log(q);
  }

  @Get('log/filter-catalog')
  @Roles(...AUDIT_READ_ROLES)
  @ApiOperation({
    summary:
      'Filtros que acepta la bitácora, sus límites y lo que no se puede consultar',
    description:
      'No lee la bitácora ni deja sello de lectura: devuelve la configuración de la consulta (filtros, opciones, ventana por omisión, tope de página y orden). `notMeasured` declara lo que se pidió y no tiene fuente (`requestId`, `correlationId`).',
  })
  @ApiResponse({ status: 200, type: AuditFilterCatalogDto })
  filterCatalog() {
    return this.query.filterCatalog();
  }

  @Get('data-access')
  @Roles(...AUDIT_READ_ROLES)
  @AccessLogged({
    resourceType: 'DATA_ACCESS_LOG',
    purpose: AUDIT_READ_PURPOSE,
  })
  @ApiOperation({
    summary:
      'Lecturas de datos sensibles (`audit.data_access_log`), con filtros',
    description:
      'Filtra por actor, rango de fechas, tenant, paciente, tipo de recurso y operación. Sin rango, mira los últimos 30 días.',
  })
  @ApiResponse({ status: 200, type: DataAccessPageDto })
  dataAccess(@Query() q: DataAccessQueryDto) {
    return this.query.dataAccess(q);
  }
}
