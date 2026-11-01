import { PlatformScopeOptional } from '../../../../common/tenant/platform-scope';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common';
import { OpsToolsService } from '../../application/ops-tools.service';
import { OPS_READ_ROLES } from './ops-console.controller';

/**
 * Catálogo de herramientas e integraciones con su estado: sólo lectura.
 *
 * DECISIÓN PENDIENTE (2026-11-01): `GET /admin/ops/tools` también lo declara
 * `platform_ops/controllers/ops-tools.controller.ts`. `PlatformOpsModule` se
 * registra antes en `AppModule`, así que en ejecución responde ESE (forma
 * `{ evaluatedAt, items, notMeasured }`, desde `platform_ops.tool_registry`) y
 * esta ruta es inalcanzable. Las dos formas difieren y el front
 * (`core/data-access/admin-portal/ops-tools.types.ts`) declara consumir ÉSTA
 * (`isHealthy`, `checkType`, `missingEnvVars`). No se borra ninguna hasta que el
 * dueño de ops decida cuál es el contrato bueno: borrar ésta fija el de
 * platform_ops; borrar la otra cambia la respuesta que hoy se sirve.
 */
@ApiTags('ops-console')
@ApiBearerAuth()
@PlatformScopeOptional()
@Controller('admin/ops')
export class OpsToolsController {
  constructor(private readonly service: OpsToolsService) {}

  @Get('tools')
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({
    summary:
      'Herramientas e integraciones de la API: catálogo, adaptador en uso, configuración y salud',
    description:
      'Lista completa sin paginar. `isHealthy` sólo lo pone una sonda LIVE (las de `/readiness`, con caché de 10 s); ' +
      'CONFIGURATION y NOT_APPLICABLE devuelven `null` y nunca se informan como caídas. ' +
      '`missingEnvVars` y `requiredEnvVars` llevan nombres de variables, nunca valores.',
  })
  tools() {
    return this.service.listTools();
  }
}
