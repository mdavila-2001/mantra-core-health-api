import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  AddDocumentVersionDto,
  CreateRegulatoryDocumentDto,
  CreatedResourceDto,
  InvalidateDocumentDto,
  TransitionResultDto,
} from '../dto';
import type {
  RegulatoryDocumentAccessLog,
  RegulatoryDocumentVersions,
  RegulatoryDocuments,
} from '../entities';
import { RegulatoryDocumentsService } from '../services';

/**
 * Repositorio documental legal y regulatorio (UC-17-31 a UC-17-33).
 *
 * No hay `DELETE` y no lo habrá: la spec prohíbe eliminar definitivamente un
 * documento usado como respaldo (5628). Sustituir e invalidar son las dos
 * salidas, y ambas conservan el archivo anterior.
 */
@ApiTags('pharma-lab-regulatory')
@ApiBearerAuth()
@Roles(
  'REGULATORY_AFFAIRS',
  'PHARMA_LAB_ADMIN',
  'LEGAL_COUNSEL',
  'PLATFORM_ADMIN',
)
@Controller('pharma-labs/:pharmaLabId/regulatory-documents')
export class RegulatoryDocumentsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Casos de uso del repositorio documental.
   */
  constructor(private readonly service: RegulatoryDocumentsService) {}

  /** UC-17-31. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un documento con su primera versión' })
  create(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Body() dto: CreateRegulatoryDocumentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createDocument(pharmaLabId, dto, actor);
  }

  /** Listado del repositorio. */
  @Get()
  @ApiOperation({ summary: 'Listar los documentos del laboratorio' })
  list(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
  ): Promise<RegulatoryDocuments[]> {
    return this.service.listDocuments(pharmaLabId);
  }

  /** Consulta de un documento; queda registrada (spec 5629). */
  @Get(':documentId')
  @ApiOperation({ summary: 'Consultar un documento y sus versiones' })
  getOne(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{
    /** El documento. */
    document: RegulatoryDocuments;
    /** Versiones, de la más reciente a la más antigua. */
    versions: RegulatoryDocumentVersions[];
  }> {
    return this.service.getDocument(pharmaLabId, documentId, actor);
  }

  /** UC-17-32. */
  @Post(':documentId/versions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sustituir el documento por una versión nueva' })
  addVersion(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: AddDocumentVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.addVersion(pharmaLabId, documentId, dto, actor);
  }

  /** Descarga de una versión; queda registrada. */
  @Post(':documentId/versions/:versionId/download')
  @ApiOperation({ summary: 'Registrar la descarga de una versión' })
  download(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RegulatoryDocumentVersions> {
    return this.service.registerDownload(
      pharmaLabId,
      documentId,
      versionId,
      actor,
    );
  }

  /** UC-17-33. */
  @Post(':documentId/invalidate')
  @ApiOperation({ summary: 'Invalidar el documento sin borrarlo' })
  invalidate(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: InvalidateDocumentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.invalidateDocument(pharmaLabId, documentId, dto, actor);
  }

  /** Registro de consultas y descargas del documento. */
  @Get(':documentId/access-log')
  @ApiOperation({ summary: 'Registro de consultas y descargas' })
  accessLog(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<RegulatoryDocumentAccessLog[]> {
    return this.service.listAccessLog(pharmaLabId, documentId);
  }

  /** Revisión de vencimientos y alertas (spec 5626). */
  @Post('expirations/review')
  @ApiOperation({
    summary: 'Revisar vencimientos y notificar al personal',
  })
  reviewExpirations(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{
    /** Documentos que pasaron a «próximo a vencer». */
    expiring: number;
    /** Documentos que pasaron a «vencido». */
    expired: number;
  }> {
    return this.service.reviewExpirations(pharmaLabId, actor);
  }
}
