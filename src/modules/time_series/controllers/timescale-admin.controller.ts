import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { TimescaleAdminService } from '../services';
import { ROLLUP_NAMES, TIMESERIES_TABLES, type RollupName } from '../constants';
import {
  ConfigureHypertableDto,
  UpdateHypertableDto,
  HypertableResponseDto,
  RunCompressionDto,
  CompressionResponseDto,
  ApplyRetentionDto,
  RetentionResponseDto,
  RefreshRollupDto,
  RefreshRollupResponseDto,
} from '../dto';

/**
 * Administración física de las series (UC-58-04 … 08).
 *
 * Todo lo de aquí toca objetos del motor —particiones, compresión, agregados
 * continuos— y por eso está separado de la ingesta y bajo un rol propio.
 */
@ApiTags('time_series')
@ApiBearerAuth()
@Controller('ts/admin')
export class TimescaleAdminController {
  constructor(private readonly adminService: TimescaleAdminService) {}

  /** UC-58-04. */
  @Post('hypertables')
  @Roles('DATA_PLATFORM_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Convertir una serie en hypertable y declarar su particionado',
    description:
      'Idempotente; la dimensión de espacio evita que un tenant lea los chunks de todos.',
  })
  configureHypertable(
    @Body() dto: ConfigureHypertableDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<HypertableResponseDto> {
    return this.adminService.configureHypertable(dto, actor);
  }

  /** UC-58-04. */
  @Patch('hypertables/:table')
  @Roles('DATA_PLATFORM_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajustar la anchura temporal del chunk' })
  updateHypertable(
    @Param('table') table: string,
    @Body() dto: UpdateHypertableDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<HypertableResponseDto> {
    if (!(TIMESERIES_TABLES as readonly string[]).includes(table)) {
      throw new BadRequestException(
        'La tabla no pertenece al catálogo de series del módulo.',
      );
    }
    return this.adminService.updateHypertable(table, dto, actor);
  }

  /** UC-58-05. */
  @Post('compression/run')
  @Roles('SYSTEM', 'DATA_PLATFORM_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Comprimir los chunks más antiguos que el umbral',
    description:
      'Un chunk cada vez y con tope por pasada; el chunk comprimido queda de sólo lectura.',
  })
  runCompression(
    @Body() dto: RunCompressionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CompressionResponseDto> {
    return this.adminService.runCompression(dto, actor);
  }

  /** UC-58-06. */
  @Post('retention/policies')
  @Roles('SYSTEM', 'DATA_PLATFORM_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aplicar la retención descartando chunks fuera de ventana',
    description:
      'Descarte por metadata, no fila a fila. No sustituye ni toca la cadena de auditoría legal.',
  })
  applyRetention(
    @Body() dto: ApplyRetentionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RetentionResponseDto> {
    return this.adminService.applyRetention(dto, actor);
  }

  /**
   * UC-58-08. Declarada **antes** que la ruta paramétrica de rollups: un segmento
   * literal que coincide con un parámetro tiene que resolverse primero.
   */
  @Post('rollups/audit-daily/refresh')
  @Roles('SYSTEM', 'DATA_PLATFORM_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar el rollup de conteos diarios de auditoría',
    description:
      'Estos conteos alimentan paneles; no sustituyen `audit.audit_events`.',
  })
  refreshAuditDaily(
    @Body() dto: RefreshRollupDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RefreshRollupResponseDto> {
    return this.adminService.refreshRollup(
      'continuous_audit_daily',
      dto,
      actor,
    );
  }

  /** UC-58-07. */
  @Post('rollups/:name/refresh')
  @Roles('SYSTEM', 'DATA_PLATFORM_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Materializar la ventana de un agregado continuo',
    description:
      'El refresco corre fuera de transacción: TimescaleDB no lo permite dentro.',
  })
  refreshRollup(
    @Param('name') name: string,
    @Body() dto: RefreshRollupDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RefreshRollupResponseDto> {
    if (!(ROLLUP_NAMES as readonly string[]).includes(name)) {
      throw new BadRequestException(
        `El rollup debe ser uno de: ${ROLLUP_NAMES.join(', ')}.`,
      );
    }
    return this.adminService.refreshRollup(name as RollupName, dto, actor);
  }
}
