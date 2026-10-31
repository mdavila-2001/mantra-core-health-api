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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import {
  AccessLogged,
  Audited,
  ConflictException,
  CurrentUser,
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
  Roles,
  requireTenantId,
  type AuthenticatedUser,
} from '../../common';
import {
  CreateClinicalImportDto,
  ImportTemplateQueryDto,
  ReportQueryDto,
} from './clinical-import.dto';
import {
  ClinicalImportService,
  ImportError,
  LIMITS,
  reportToCsv,
} from './clinical-import.service';

/** El archivo subido, sin acoplarse a los tipos de multer. */
interface UploadedBuffer {
  readonly originalname: string;
  readonly buffer: Buffer;
}

/** `ImportError` del núcleo → excepción del contrato de errores. El mensaje es estático: nunca lleva datos. */
function toHttp(error: unknown): unknown {
  if (!(error instanceof ImportError)) return error;
  const details =
    error.details === undefined ? undefined : { ...error.details };
  switch (error.kind) {
    case 'NOT_FOUND':
      return new ResourceNotFoundException(
        error.message,
        details,
        error.reason,
      );
    case 'CONFLICT':
      return new ConflictException(error.message, details, error.reason);
    case 'PAYLOAD_TOO_LARGE':
      return new DomainException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        ErrorCode.PAYLOAD_TOO_LARGE,
        error.message,
        details,
        error.reason,
      );
    case 'BAD_REQUEST':
      return new DomainException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        error.message,
        details,
        error.reason,
      );
  }
}

async function guarded<T>(work: () => Promise<T> | T): Promise<T> {
  try {
    return await work();
  } catch (error) {
    throw toHttp(error);
  }
}

/**
 * Carga masiva especial de historias clínicas (H7), `/admin/clinical-imports`.
 *
 * Acceso: `SECURITY_ADMIN` (y `SUPERADMIN`, que es comodín en `RolesGuard`); el
 * resto de los roles recibe 403. Un lote de OTRA organización responde 404, la
 * misma respuesta que uno inexistente. El permiso fino `clinical.bulk_import`
 * llega con H5 (ambigüedad registrada en el plan).
 *
 * Auditoría: las rutas que mutan llevan `@Audited`; las que LEEN lo cargado
 * llevan `@AccessLogged` (la fila de acceso se escribe ANTES de leer). Cada
 * registro agregado deja además su propio evento (actor, lote, fila, destino).
 */
@ApiTags('clinical-import')
@ApiBearerAuth()
@Controller('admin/clinical-imports')
@Roles('SECURITY_ADMIN')
export class ClinicalImportController {
  constructor(private readonly service: ClinicalImportService) {}

  @Get('catalog')
  @ApiOperation({
    summary: 'H7: tipos de registro, topes y estado declarado del motor',
  })
  catalog() {
    return this.service.catalog();
  }

  /** T1: la plantilla del tipo, en CSV o JSON, generada del mismo esquema que valida. */
  @Get('import-template')
  @ApiOperation({
    summary: 'H7/T1: plantilla de un tipo de registro en CSV o JSON',
  })
  async template(
    @Query() query: ImportTemplateQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await guarded(() =>
      this.service.template(query.kind, query.format ?? 'csv'),
    );
    response.setHeader('Content-Type', file.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName}"`,
    );
    return new StreamableFile(Buffer.from(file.content, 'utf8'));
  }

  @Get()
  @ApiOperation({
    summary:
      'H7: lotes de la organización activa, del más reciente al más antiguo',
  })
  async list(@Query('limit') limit?: string) {
    const n = limit === undefined ? 25 : Number(limit);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      throw new DomainException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'limit debe estar entre 1 y 100',
      );
    }
    return this.service.list(requireTenantId(), n);
  }

  /** Valida y previsualiza. No escribe nada en ninguna historia clínica. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Audited({
    action: 'CLINICAL_IMPORT_BATCH_CREATED',
    entity: 'clinical_import_batch',
    entityId: 'result.id',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: LIMITS.maxBytes + 1, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'file',
        'kind',
        'sourceOrganization',
        'legalBasis',
        'loadedAt',
      ],
      properties: {
        file: { type: 'string', format: 'binary' },
        kind: { type: 'string' },
        sourceOrganization: { type: 'string' },
        legalBasis: { type: 'string' },
        loadedAt: { type: 'string', format: 'date' },
      },
    },
  })
  @ApiOperation({
    summary:
      'H7: crea un lote (vista previa con errores por fila); no escribe nada clínico',
  })
  create(
    @UploadedFile() file: UploadedBuffer | undefined,
    @Body() body: CreateClinicalImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return guarded(() => {
      if (file === undefined)
        throw new ImportError('BAD_REQUEST', 'SOURCE_MISSING');
      return this.service.create({ userId: user.id }, requireTenantId(), {
        kind: body.kind,
        fileName: file.originalname,
        bytes: file.buffer,
        declaration: {
          sourceOrganization: body.sourceOrganization,
          legalBasis: body.legalBasis,
          loadedAt: body.loadedAt,
        },
      });
    });
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.ACCEPTED)
  @Audited({
    action: 'CLINICAL_IMPORT_BATCH_CONFIRMED',
    entity: 'clinical_import_batch',
    entityId: 'param:id',
  })
  @ApiOperation({
    summary:
      'H7: confirma un lote VALIDADO y lo encola (idempotente por Idempotency-Key)',
  })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('idempotency-key') key: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return guarded(() =>
      this.service.confirm({ userId: user.id }, requireTenantId(), id, key),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'H7: estado, vista previa y avance de un lote' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return guarded(() => this.service.get(requireTenantId(), id));
  }

  /** El informe: sólo fila, resultado y motivo. Leerlo queda auditado. */
  @Get(':id/report')
  @AccessLogged({
    resourceType: 'CLINICAL_IMPORT_REPORT',
    resourceId: 'param:id',
  })
  @ApiOperation({
    summary: 'H7: informe del lote en JSON o CSV, sin datos clínicos',
  })
  async report(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ReportQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<unknown> {
    const report = await guarded(() =>
      this.service.report(requireTenantId(), id),
    );
    if ((query.format ?? 'json') === 'json') return report;
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="informe-${id}.csv"`,
    );
    return new StreamableFile(Buffer.from(reportToCsv(report), 'utf8'));
  }

  /** Qué agregó el lote y dónde: sólo identificadores. Leerlo queda auditado. */
  @Get(':id/loaded')
  @AccessLogged({
    resourceType: 'CLINICAL_IMPORT_LOADED_RECORDS',
    resourceId: 'param:id',
  })
  @ApiOperation({
    summary:
      'H7: registros que el lote agregó (identificadores, sin contenido)',
  })
  loaded(@Param('id', ParseUUIDPipe) id: string) {
    return guarded(() => this.service.loaded(requireTenantId(), id));
  }
}
