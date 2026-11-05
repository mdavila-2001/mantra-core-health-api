import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UnsupportedMediaTypeException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  NotAudited,
  CurrentUser,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { LabStaffGuard } from '../guards';
import { LabPortalUploadsService } from '../services/lab-portal-uploads.service';
import { LabResultFileDto } from '../dto/lab-portal-results.dto';
import {
  LabResultUploadSessionDto,
  LabResultUploadStartDto,
} from '../dto/lab-portal-uploads.dto';

/** A part travels only as `application/octet-stream`; anything else is 415. */
export function assertOctetStream(req: Request): void {
  const type = (req.headers['content-type'] ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (type !== 'application/octet-stream') {
    throw new UnsupportedMediaTypeException(
      'La parte debe enviarse como application/octet-stream.',
    );
  }
}

/**
 * Reads the raw `application/octet-stream` body, refusing more than `limit`
 * bytes. The global JSON parser leaves this content type untouched; if some
 * parser already drained the stream without leaving a Buffer, it fails fast
 * instead of waiting for an `end` event that never comes.
 */
export function readRawBody(req: Request, limit: number): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  if (req.readableEnded || req.destroyed) {
    return Promise.reject(
      new UnsupportedMediaTypeException(
        'El cuerpo de la parte ya se consumió.',
      ),
    );
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.byteLength;
      if (size > limit) {
        reject(new BadRequestException('La parte supera el tamaño declarado.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
    req.on('close', () =>
      reject(
        new BadRequestException(
          'La conexión se cerró antes de completar la parte.',
        ),
      ),
    );
  });
}

/** Chunked upload of laboratory results: no request carries more than a part. */
@ApiTags('diagnostics-lab-portal')
@ApiBearerAuth()
@UseGuards(LabStaffGuard)
@Controller('diagnostics/lab/result-uploads')
export class DiagnosticsLabUploadsController {
  constructor(private readonly uploads: LabPortalUploadsService) {}

  @NotAudited(
    'Opens an in-memory upload session; nothing is persisted until complete, which is audited.',
  )
  @Post()
  @ApiOperation({
    summary: 'Empezar la subida por partes de un resultado',
    description:
      'Exige una orden procesada del tenant activo (409 si no lo está). El ' +
      'tamaño total no puede superar `FILE_STORAGE_MAX_SIZE_BYTES` (422).',
  })
  start(
    @Body() dto: LabResultUploadStartDto,
  ): Promise<LabResultUploadSessionDto> {
    return this.uploads.start(requireTenantId(), dto);
  }

  @NotAudited(
    'Buffers raw bytes of an open in-memory upload session; the stored file is audited on complete.',
  )
  @Put(':uploadId/parts/:index')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('application/octet-stream')
  @ApiOperation({
    summary: 'Mandar una parte (bytes crudos)',
    description: 'Otro Content-Type distinto de octet-stream es 415.',
  })
  async putPart(
    @Param('uploadId', ParseUUIDPipe) uploadId: string,
    @Param('index', ParseIntPipe) index: number,
    @Req() req: Request,
  ): Promise<void> {
    assertOctetStream(req);
    const tenantId = requireTenantId();
    const expected = this.uploads.expectedPartSize(tenantId, uploadId, index);
    const part = await readRawBody(req, expected);
    this.uploads.putPart(tenantId, uploadId, index, part);
  }

  @Audited({
    action: 'LAB_RESULT_FILE_UPLOADED',
    entity: 'diagnostic_report_file',
    entityId: 'result.id',
  })
  @Post(':uploadId/complete')
  @ApiOperation({
    summary: 'Cerrar la subida: guarda el archivo y lo publica en el informe',
  })
  complete(
    @Param('uploadId', ParseUUIDPipe) uploadId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LabResultFileDto> {
    return this.uploads.complete(requireTenantId(), uploadId, actor);
  }

  @NotAudited(
    'Discards an in-memory upload session that never reached storage.',
  )
  @Delete(':uploadId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar una subida abierta' })
  abort(@Param('uploadId', ParseUUIDPipe) uploadId: string): void {
    this.uploads.abort(requireTenantId(), uploadId);
  }
}
