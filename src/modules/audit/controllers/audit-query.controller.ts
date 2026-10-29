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
