import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { OPS_READ_ROLES } from '../../ops_console/presentation/controllers/ops-console.controller';
import {
  DiscoverRuntimePiecesDto,
  DiscoveryReportDto,
  RuntimePieceDetailResponseDto,
  RuntimePiecesListResponseDto,
  RuntimePiecesQueryDto,
} from './runtime-pieces.dto';
import { RuntimePiecesService } from './runtime-pieces.service';

/** Escritura: quien opera la plataforma. Un rol de sólo lectura no registra nada. */
export const RUNTIME_PIECES_WRITE_ROLES = ['PLATFORM_ADMIN', 'SRE'] as const;

/**
 * Piezas en ejecución: todo lo que el código puede tener corriendo (procesos,
 * ticks, consumidores de cola, endpoints internos, salud, conectores),
 * contrastado con el registro de herramientas y con los latidos.
 */
@ApiTags('ops-runtime-pieces')
@ApiBearerAuth()
@Controller('admin/ops/runtime-pieces')
export class RuntimePiecesController {
  constructor(private readonly pieces: RuntimePiecesService) {}

  @Get()
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({
    summary: 'Piezas descubiertas en el código, con su estado contrastado',
    description:
      'Estados: VIVA (latido reciente), SIN_LATIDO, NO_REGISTRADA, HUERFANA, DESHABILITADA y NO_MEDIBLE ' +
      '(clase de pieza sin mecanismo de latido). Incluye instancias, hallazgos y lo que no se mide.',
  })
  @ApiOkResponse({ type: RuntimePiecesListResponseDto })
  list(@Query() query: RuntimePiecesQueryDto) {
    return this.pieces.list(query);
  }

  @Get(':id')
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({
    summary: 'Una pieza con su evidencia, su registro y sus hallazgos',
  })
  @ApiOkResponse({ type: RuntimePieceDetailResponseDto })
  @ApiNotFoundResponse({ description: 'reason RUNTIME_PIECE_NOT_FOUND' })
  detail(@Param('id') id: string) {
    return this.pieces.get(id);
  }

  @Audited({
    action: 'RUNTIME_PIECES_DISCOVERED',
    entity: 'tool_registry',
  })
  @Post('discover')
  @Roles(...RUNTIME_PIECES_WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Descubrir y registrar las piezas del código (idempotente)',
    description:
      'Escanea el código y registra en tool_registry lo que falte, con su procedencia. ' +
      'Repetirlo sin cambios en el código no inserta ni modifica nada. Nunca borra. ' +
      '`dryRun` calcula el efecto sin escribir.',
  })
  @ApiOkResponse({ type: DiscoveryReportDto })
  @ApiConflictResponse({
    description: 'reason RUNTIME_PIECES_SOURCE_UNAVAILABLE',
  })
  discover(
    @Body() dto: DiscoverRuntimePiecesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.pieces.discover(dto, actor);
  }
}
