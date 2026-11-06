import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  AccessLogged,
  Audited,
  CurrentUser,
  PreconditionFailedException,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import type { AuthenticatedRequest } from '../../../common/auth/authenticated-user.interface';
import {
  BULK_IMPORT_LIMITS,
  BULK_IMPORT_MANAGEMENT_ROLES,
} from '../bulk-import.constants';
import {
  CreateBulkImportDto,
  ListBulkImportsQueryDto,
  ReportQueryDto,
  TemplateQueryDto,
} from '../dto/bulk-import.dto';
import { BulkImportService } from '../services/bulk-import.service';
import type { TemplateFile } from '../services/template.service';

/** Archivo subido por multer (sólo lo que el motor lee). */
interface UploadedBulkFile {
  readonly buffer: Buffer;
  readonly originalname?: string;
  readonly mimetype?: string;
}

/** La organización activa del request, o 412 si no hay ninguna. */
function tenantOf(request: AuthenticatedRequest): string {
  const tenantId = request.resolvedTenantId;
  if (!tenantId) {
    throw new PreconditionFailedException(
      'La carga masiva es de una organización: indique X-Tenant-Id.',
      { reason: 'TENANT_REQUIRED' },
    );
  }
  return tenantId;
}

function asStream(response: Response, file: TemplateFile): StreamableFile {
  response.setHeader('Content-Type', file.contentType);
  response.setHeader(
    'Content-Disposition',
    `attachment; filename="${file.fileName}"`,
  );
  return new StreamableFile(file.content);
}

/**
 * Motor de cargas masivas: plantillas, validación con vista previa,
 * confirmación idempotente, estado e informe.
 *
 * Acceso: rol de gestión (`@Roles`) **y** el permiso fino del tipo de carga
 * (`bulk_import.users` / `bulk_import.clinical`, resueltos por el PDP existente en
 * el servicio). Un lote de otra organización responde 404.
 */
@ApiTags('bulk-import')
@ApiBearerAuth()
@Controller('admin/bulk-imports')
@Roles(...BULK_IMPORT_MANAGEMENT_ROLES)
export class BulkImportController {
  constructor(private readonly service: BulkImportService) {}

  @Get('templates')
  @ApiOperation({
    summary: 'Catálogo de plantillas, topes y estado declarado del motor',
  })
  catalog(): ReturnType<BulkImportService['catalog']> {
    return this.service.catalog();
  }

  @Get('templates/:kind')
  @ApiOperation({
    summary: 'Descarga la plantilla de un tipo de carga en CSV o JSON',
  })
  template(
    @Param('kind') kind: string,
    @Query() query: TemplateQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): StreamableFile {
    return asStream(
      response,
      this.service.template(kind, query.format ?? 'csv'),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lotes de la organización' })
  list(
    @Query() query: ListBulkImportsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.list(actor, tenantOf(request), query.limit ?? 25);
  }

  @Audited({
    action: 'BULK_IMPORT_BATCH_CREATED',
    entity: 'bulk_import_batch',
    entityId: 'result.id',
  })
  // Validar un lote de hasta 5.000 filas es trabajo caro: tope propio por minuto.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: BULK_IMPORT_LIMITS.maxBytes, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({ type: CreateBulkImportDto })
  @ApiOperation({
    summary:
      'Crea un lote: valida el archivo y devuelve la vista previa (VALIDADO o RECHAZADO)',
  })
  create(
    @Body() dto: CreateBulkImportDto,
    @UploadedFile() file: UploadedBulkFile | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ) {
    const { kind, rows, ...declaration } = dto;
    return this.service.create(actor, tenantOf(request), {
      kind,
      declaration,
      source: {
        file: file
          ? {
              buffer: file.buffer,
              fileName: file.originalname,
              mimeType: file.mimetype,
            }
          : undefined,
        rows,
      },
    });
  }

  @Audited({
    action: 'BULK_IMPORT_BATCH_CONFIRMED',
    entity: 'bulk_import_batch',
    entityId: 'param:id',
  })
  @Post(':id/confirm')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({
    summary:
      'Confirma un lote VALIDADO y lo encola (idempotente por Idempotency-Key)',
  })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.confirm(actor, tenantOf(request), id, idempotencyKey);
  }

  @Get(':id')
  // Leer un lote es leer lo que se cargó: queda en `audit.data_access_log`, además
  // del sello `BULK_IMPORT_BATCH_READ` que escribe el servicio.
  @AccessLogged({
    resourceType: 'BULK_IMPORT_BATCH',
    resourceId: 'param:id',
    purpose: 'DATA_ADMINISTRATION',
  })
  @ApiOperation({ summary: 'Estado, vista previa y avance de un lote' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.get(actor, tenantOf(request), id);
  }

  @Get(':id/report')
  @AccessLogged({
    resourceType: 'BULK_IMPORT_REPORT',
    resourceId: 'param:id',
    purpose: 'DATA_ADMINISTRATION',
  })
  @ApiOperation({
    summary: 'Informe de un lote: creados, omitidos y rechazados con su motivo',
  })
  async report(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ReportQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const report = await this.service.report(actor, tenantOf(request), id);
    if (query.format === 'csv') {
      return asStream(response, this.service.reportCsv(report));
    }
    return report;
  }
}
