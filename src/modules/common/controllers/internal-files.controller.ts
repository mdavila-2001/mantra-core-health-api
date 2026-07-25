import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common';
import { FilesService } from '../services';
import { FileVersionResponseDto, ScanResultDto } from '../dto';

/**
 * Endpoints internos de archivos (callbacks de sistemas de confianza).
 *
 * Reservados a `SECURITY_ADMIN`: el `RolesGuard` global (registrado como
 * `APP_GUARD`) aplica el `@Roles(...)` además de la autenticación del `JwtAuthGuard`.
 */
@ApiTags('internal/files')
@ApiBearerAuth()
@Controller('internal/files')
export class InternalFilesController {
  constructor(private readonly filesService: FilesService) {}

  /** UC-02-09: callback del antivirus con el resultado del escaneo. */
  @Post('versions/:vid/scan-result')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar resultado de escaneo antimalware (UC-02-09)' })
  scanResult(
    @Param('vid', ParseUUIDPipe) vid: string,
    @Body() dto: ScanResultDto,
  ): Promise<FileVersionResponseDto> {
    return this.filesService.recordScanResult(vid, dto);
  }
}
