import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  type AuthenticatedUser,
} from '../../../common';
import { ChartMeReadService, EncounterPdfService } from '../services';
import {
  MyChartDocumentListResponseDto,
  MyChartNoteListResponseDto,
} from '../dto';

/**
 * BR-15 (CL-30, CL-31, CL-36): autoservicio del paciente sobre `charts/me`.
 *
 * **Sin `@Roles`**, patrón `forms-me.controller.ts`/`surveys/me`: el filtro
 * real no es un rol sino tener perfil de paciente, y el servidor lo toma del
 * claim de la sesión (`actor.patientProfileId`). Ninguna ruta acepta un id de
 * paciente por parámetro: si lo aceptara, cualquiera podría pedir la historia
 * de otro.
 */
@ApiTags('chart-me')
@ApiBearerAuth()
@Controller('charts/me')
export class ChartMeController {
  constructor(
    private readonly readService: ChartMeReadService,
    private readonly encounterPdfService: EncounterPdfService,
  ) {}

  /** Las evoluciones liberadas del titular — nunca un borrador ni una retenida. */
  @Get('notes')
  @ApiOperation({ summary: 'Ver mis evoluciones liberadas' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope del listado (por defecto 50)',
  })
  listMyNotes(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<MyChartNoteListResponseDto> {
    return this.readService.listMyNotes(actor, limit ?? 50);
  }

  /** Los documentos del titular con visibilidad para el paciente. */
  @Get('documents')
  @ApiOperation({ summary: 'Ver mis documentos visibles' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope del listado (por defecto 50)',
  })
  listMyDocuments(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<MyChartDocumentListResponseDto> {
    return this.readService.listMyDocuments(actor, limit ?? 50);
  }

  /**
   * El contenido de un archivo de un documento propio. 404 —el mismo para
   * todo caso— si el documento no existe, no es del titular, no es visible
   * o el archivo no cuelga de él.
   */
  @Get('documents/:documentId/files/:fileId/content')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Descargar el archivo de un documento propio' })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({ description: 'Bytes del archivo' })
  @ApiNotFoundResponse({
    description:
      'El documento no existe, no es del titular, no es visible, o el archivo no cuelga de él',
  })
  async getMyDocumentFileContent(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Res() res: Response,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    res.setHeader('Cache-Control', 'private, no-store');
    const contenido = await this.readService.getMyDocumentFileContent(
      documentId,
      fileId,
      actor,
    );
    res.setHeader('Content-Type', contenido.mimeType);
    if (contenido.originalName) {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(contenido.originalName)}`,
      );
    }
    res.send(contenido.buffer);
  }

  /**
   * PDF oficial de una atención propia (BR-15/CL-31): sólo la nota liberada y
   * los documentos visibles, aunque el encuentro tenga notas en borrador o
   * documentos sólo para el profesional.
   */
  @Get('encounters/:id/pdf')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Descargar el PDF oficial de una atención propia',
    description:
      'Sólo lo liberado y visible. 404 si el encuentro no es del titular; 422 si no está cerrado.',
  })
  @ApiOkResponse({
    description: 'PDF oficial de la atención',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiForbiddenResponse({ description: 'No aplica: usa 404 en su lugar' })
  @ApiNotFoundResponse({
    description: 'El encuentro no existe o no es del titular',
  })
  @ApiResponse({ status: 422, description: 'El encuentro no está cerrado' })
  async getMyEncounterPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    res.setHeader('Cache-Control', 'private, no-store');
    const { buffer, fileName } =
      await this.encounterPdfService.renderForPatient(id, actor);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.send(buffer);
  }
}
