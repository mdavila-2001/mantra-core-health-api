import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { FilesService } from '../services';
import {
  FileVersionResponseDto,
  PendingScanResponseDto,
  ScanResultDto,
} from '../dto';

/** Tope por defecto del lote de versiones pendientes de escaneo. */
const PENDING_SCAN_LIMIT = 25;
/** Techo duro del lote, para que un `limit` grande no vacíe la tabla de una vez. */
const PENDING_SCAN_MAX = 200;

/**
 * Endpoints internos de archivos (callbacks de sistemas de confianza).
 *
 * Aceptan `SYSTEM` **y** `SECURITY_ADMIN`, como los internos del fan-out de
 * feed: el worker antimalware autentica con `SYSTEM` (`SystemApiClient`), y con
 * sólo `SECURITY_ADMIN` recibía 403 — el callback de escaneo era literalmente
 * inalcanzable para el único proceso que puede emitirlo. Se conserva
 * `SECURITY_ADMIN` para el disparo manual.
 *
 * El `RolesGuard` global (registrado como `APP_GUARD`) aplica el `@Roles(...)`
 * además de la autenticación del `JwtAuthGuard`.
 */
@ApiTags('internal/files')
@ApiBearerAuth()
@Controller('internal/files')
export class InternalFilesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param filesService - Valor de files service requerido por la operación.
   */
  constructor(private readonly filesService: FilesService) {}

  /**
   * Versiones que esperan escaneo, para que el antivirus sepa qué mirar.
   *
   * Sin esto el circuito no cierra por ningún lado: el callback existía desde
   * el principio y no había forma de descubrir qué faltaba escanear.
   *
   * @param limit - Tope del lote.
   * @returns El lote pendiente, de la versión más antigua a la más nueva.
   */
  @Get('versions/pending-scan')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar versiones pendientes de escaneo antimalware',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  pendingScan(
    @Query('limit', new DefaultValuePipe(PENDING_SCAN_LIMIT), ParseIntPipe)
    limit: number,
  ): Promise<PendingScanResponseDto> {
    return this.filesService.listPendingScan(
      Math.min(Math.max(limit, 1), PENDING_SCAN_MAX),
    );
  }

  /** UC-02-09: callback del antivirus con el resultado del escaneo. */
  @Post('versions/:vid/scan-result')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar resultado de escaneo antimalware (UC-02-09)',
  })
  scanResult(
    @Param('vid', ParseUUIDPipe) vid: string,
    @Body() dto: ScanResultDto,
  ): Promise<FileVersionResponseDto> {
    return this.filesService.recordScanResult(vid, dto);
  }
}
