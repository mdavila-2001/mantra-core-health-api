import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common';
import { OpsConsoleService } from '../../application/ops-console.service';
import { OpsTrafficService } from '../../application/ops-traffic.service';
import {
  IncidentsQueryDto,
  LimitQueryDto,
  TrafficEndpointsQueryDto,
  TrafficQueryDto,
} from '../dto/ops-console-query.dto';

/** Operación y gobierno: quien opera la plataforma y quien la audita. */
export const OPS_READ_ROLES = [
  'PLATFORM_ADMIN',
  'SRE',
  'SECURITY_ADMIN',
  'RELEASE_MANAGER',
  'GOVERNANCE_ADMIN',
] as const;

/** Consola de operación del portal: sólo lectura (módulos 11, 36, 46, 67, 68). */
@ApiTags('ops-console')
@ApiBearerAuth()
@Controller('admin/ops')
export class OpsConsoleController {
  constructor(
    private readonly ops: OpsConsoleService,
    private readonly traffic: OpsTrafficService,
  ) {}

  @Get('readiness')
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({
    summary:
      'Preparación para producción: controles PASS/FAIL/UNKNOWN/N_A con evidencia',
    description:
      'Un control bloqueante en FAIL o UNKNOWN impide READY. Nunca se promedia.',
  })
  readiness() {
    return this.ops.readiness();
  }

  @Get('incidents')
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({ summary: 'Incidentes' })
  incidents(@Query() query: IncidentsQueryDto) {
    return this.ops.listIncidents(query);
  }

  @Get('incidents/:id')
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({ summary: 'Incidente con su timeline' })
  incident(@Param('id', ParseUUIDPipe) id: string) {
    return this.ops.getIncident(id);
  }

  @Get('deployments')
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({ summary: 'Despliegues recientes' })
  deployments(@Query() query: LimitQueryDto) {
    return this.ops.listDeployments(query.limit);
  }

  @Get('change-requests')
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({ summary: 'Solicitudes de cambio' })
  changeRequests(@Query() query: LimitQueryDto) {
    return this.ops.listChangeRequests(query.limit);
  }

  @Get('slos')
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({
    summary: 'SLO activos con su última medición (numerador y denominador)',
  })
  slos() {
    return this.ops.listSlos();
  }

  @Get('backups')
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({
    summary: 'Políticas de backup con su última prueba de restauración',
  })
  backups() {
    return this.ops.listBackups();
  }

  @Get('traffic')
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({
    summary:
      'Tráfico HTTP de la API: solicitudes, éxito, fallos, latencia y usuarios activos',
    description:
      'Agregado por minuto desde la medición en proceso. Sin usuarios ni direcciones reales; `notMeasured` dice lo que no se mide.',
  })
  trafficOverview(@Query() query: TrafficQueryDto) {
    return this.traffic.traffic(query);
  }

  @Get('traffic/endpoints')
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({
    summary: 'Endpoints tocados en la ventana, por plantilla de ruta',
  })
  trafficEndpoints(@Query() query: TrafficEndpointsQueryDto) {
    return this.traffic.endpoints(query);
  }
}
