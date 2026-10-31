import { PlatformScopeOptional } from '../../../../common/tenant/platform-scope';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common';
import { OpsToolsService } from '../../application/ops-tools.service';
import { OPS_READ_ROLES } from './ops-console.controller';

/** Catálogo de herramientas e integraciones con su estado: sólo lectura. */
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
