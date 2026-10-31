import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { OPS_READ_ROLES } from '../../ops_console/presentation/controllers/ops-console.controller';
import {
  ToolDetailResponseDto,
  ToolListResponseDto,
} from '../dto/ops-tools.dto';
import { OpsToolsService } from '../services/ops-tools.service';

/** Registro de herramientas e instancias de la plataforma: solo lectura. */
@ApiTags('ops-tools')
@ApiBearerAuth()
@Controller('admin/ops/tools')
export class OpsToolsController {
  constructor(private readonly tools: OpsToolsService) {}

  @Get()
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({
    summary: 'Herramientas del catálogo con su salud',
    description:
      'Lista completa (no paginada). `health.state` es NOT_PROBED cuando nadie lo midió; ' +
      'CONFIGURATION solo verifica que existan las variables requeridas y devuelve sus nombres, nunca valores; ' +
      'LIVE solo con una comprobación real y reciente en health_check_runs.',
  })
  @ApiOkResponse({ type: ToolListResponseDto })
  list(): Promise<ToolListResponseDto> {
    return this.tools.list();
  }

  @Get(':code')
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({
    summary: 'Una herramienta con su historial corto de comprobaciones',
    description:
      'Últimas 20 corridas de health_check_runs, de la más nueva a la más vieja.',
  })
  @ApiOkResponse({ type: ToolDetailResponseDto })
  @ApiNotFoundResponse({
    description: 'La herramienta no existe (reason TOOL_NOT_FOUND).',
  })
  detail(@Param('code') code: string): Promise<ToolDetailResponseDto> {
    return this.tools.get(code);
  }
}
