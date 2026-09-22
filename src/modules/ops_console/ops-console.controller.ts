import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Roles } from '../../common';
import { OpsConsoleService } from './ops-console.service';

/** Operación y gobierno: quien opera la plataforma y quien la audita. */
export const OPS_READ_ROLES = [
  'PLATFORM_ADMIN',
  'SRE',
  'SECURITY_ADMIN',
  'RELEASE_MANAGER',
  'GOVERNANCE_ADMIN',
] as const;

export class LimitQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class IncidentsQueryDto extends LimitQueryDto {
  @ApiPropertyOptional({
    description: 'Sólo incidentes vivos (abiertos, reconocidos, mitigados)',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  open?: boolean;
}

/** Consola de operación del portal: sólo lectura (módulos 11, 36, 46, 67, 68). */
@ApiTags('ops-console')
@ApiBearerAuth()
@Controller('admin/ops')
export class OpsConsoleController {
  constructor(private readonly ops: OpsConsoleService) {}

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
}
