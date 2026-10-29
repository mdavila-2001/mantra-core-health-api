import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Roles } from '../../../../common';
import { QaLabReadService } from '../../application/services/qa-lab-read.service';
import {
  FLOW_COVERAGE,
  QaFlowsService,
  type FlowCoverage,
} from '../../application/services/qa-flows.service';

export const QA_LAB_READ_ROLES = [
  'QA_ADMIN',
  'QA_ENGINEER',
  'RELEASE_MANAGER',
  'PLATFORM_ADMIN',
] as const;

export class RunsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() suiteId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class DefectsQueryDto {
  @ApiPropertyOptional({
    description: 'Código: DEFECT_OPEN, DEFECT_TRIAGED, …',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;
}

export class FlowsQueryDto {
  @ApiPropertyOptional({ description: 'Módulo del Registro: «2 · Médico»' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  module?: string;

  @ApiPropertyOptional({ description: 'Texto en el id, el título o el módulo' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional({
    enum: FLOW_COVERAGE,
    description:
      'SEEDED/NOT_SEEDED: la suite FLOW-<id> existe en qa_lab o no. RAN/NEVER_RAN: tuvo alguna corrida o no.',
  })
  @IsOptional()
  @IsIn(FLOW_COVERAGE)
  coverage?: FlowCoverage;
}

/** Lectura del laboratorio de pruebas para el portal (módulo 36). */
@ApiTags('qa-lab-read')
@ApiBearerAuth()
@Controller('admin/qa')
export class QaLabReadController {
  constructor(
    private readonly read: QaLabReadService,
    private readonly flows: QaFlowsService,
  ) {}

  @Get('environments')
  @Roles(...QA_LAB_READ_ROLES)
  @ApiOperation({ summary: 'Entornos de prueba' })
  environments() {
    return this.read.listEnvironments();
  }

  @Get('suites')
  @Roles(...QA_LAB_READ_ROLES)
  @ApiOperation({ summary: 'Suites con conteo de casos y última corrida' })
  suites() {
    return this.read.listSuites();
  }

  @Get('suites/:suiteId')
  @Roles(...QA_LAB_READ_ROLES)
  @ApiOperation({ summary: 'Suite con casos y aserciones' })
  suite(@Param('suiteId', ParseUUIDPipe) suiteId: string) {
    return this.read.getSuite(suiteId);
  }

  @Get('runs')
  @Roles(...QA_LAB_READ_ROLES)
  @ApiOperation({ summary: 'Corridas recientes' })
  runs(@Query() query: RunsQueryDto) {
    return this.read.listRuns(query);
  }

  @Get('runs/:runId')
  @Roles(...QA_LAB_READ_ROLES)
  @ApiOperation({
    summary:
      'Corrida con resultados por caso y veredicto por aserción (valor observado)',
  })
  run(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.read.getRun(runId);
  }

  @Get('defects')
  @Roles(...QA_LAB_READ_ROLES)
  @ApiOperation({ summary: 'Defectos deduplicados por firma' })
  defects(@Query() query: DefectsQueryDto) {
    return this.read.listDefects(query);
  }

  @Get('flows')
  @Roles(...QA_LAB_READ_ROLES)
  @ApiOperation({
    summary:
      'Catálogo de flujos: recorridos del usuario con su cobertura de contrato y de pruebas',
  })
  listFlows(@Query() query: FlowsQueryDto) {
    return this.flows.list(query);
  }

  @Get('flows/:flowId')
  @Roles(...QA_LAB_READ_ROLES)
  @ApiOperation({
    summary:
      'Árbol de decisión de un flujo: pasos, endpoints (declarado o ausente), ramas válidas, límite e inválidas y su último veredicto',
  })
  flow(@Param('flowId') flowId: string) {
    return this.flows.detail(flowId);
  }
}
