import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ClinicalRecordAccessGuard } from '../../clinical/guards';
import { ChartDocumentsService } from '../services';
import { CreateDocumentDto, DocumentResponseDto } from '../dto';

/**
 * Endpoints de documentos gobernados del chart (`/charts/documents`).
 *
 * SEC-01: el alta lleva el guard del expediente —`patientProfileId` viaja en el
 * cuerpo—. La descarga de contenido no lo necesita: `ChartDocumentsService`
 * resuelve el paciente desde el documento y ya llama a la misma política.
 */
@ApiTags('chart-documents')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('charts/documents')
export class ChartDocumentsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param documentsService - Valor de documents service requerido por la operación.
   */
  constructor(private readonly documentsService: ChartDocumentsService) {}

  /** UC-15-09. */
  @Post()
  @UseGuards(ClinicalRecordAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjuntar un documento con archivos gobernados' })
  createDocument(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.createDocument(dto, actor);
  }

  /**
   * D-5: el contenido de un archivo de un documento del expediente, para
   * quien puede leer la historia del paciente dueño — no sólo para quien lo
   * subió.
   *
   * `no-store`: la caché del navegador no debe conservar un documento clínico
   * después de cerrar sesión.
   */
  @Get(':documentId/files/:fileId/content')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Descargar el archivo de un documento del expediente',
    description:
      'Autoriza a quien puede leer la historia del paciente dueño del documento, no sólo a quien subió el archivo.',
  })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({ description: 'Bytes del archivo' })
  @ApiForbiddenResponse({
    description: 'El actor no puede leer la historia de este paciente',
  })
  @ApiNotFoundResponse({
    description:
      'El documento no existe, o el archivo no cuelga de ese documento',
  })
  async getDocumentFileContent(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Res() res: Response,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    res.setHeader('Cache-Control', 'private, no-store');
    const contenido = await this.documentsService.getDocumentFileContent(
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
}
