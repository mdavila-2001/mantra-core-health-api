import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Roles } from '../../../common';
import { QaLabReadService } from '../services/qa-lab-read.service';

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

/** Lectura del laboratorio de pruebas para el portal (módulo 36). */
@ApiTags('qa-lab-read')
@ApiBearerAuth()
@Controller('admin/qa')
export class QaLabReadController {
  constructor(private readonly read: QaLabReadService) {}

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
}
