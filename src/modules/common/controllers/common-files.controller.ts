import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, loadStorageEnv } from '../../../common';
import type { AuthenticatedUser } from '../../../common';
import { FileUploadService, FilesService } from '../services';
import type { UploadedFileBytes } from '../services';
import {
  CreateFileDerivativeDto,
  CreateFileDto,
  CreateFileLinkDto,
  CreateFileVersionDto,
  DeleteFileResponseDto,
  DownloadUrlResponseDto,
  FileDerivativeResponseDto,
  FileLinkResponseDto,
  FileResponseDto,
  FileVersionResponseDto,
  LinkedFilePageDto,
  ListFileLinksQueryDto,
  UploadFileDto,
} from '../dto';

/** Endpoints del subsistema de archivos del módulo Common. */
@ApiTags('common/files')
@ApiBearerAuth()
@Controller('common/files')
export class CommonFilesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param filesService - Valor de files service requerido por la operación.
   * @param uploadService - Valor de upload service requerido por la operación.
   */
  constructor(
    private readonly filesService: FilesService,
    private readonly uploadService: FileUploadService,
  ) {}

  /**
   * Sube el contenido de un archivo y registra su metadata.
   *
   * Es la contraparte de `POST /common/files`: aquel registra un archivo que el
   * llamador ya subió a un proveedor externo y del que sólo aporta la
   * `storageUri`; éste recibe los bytes y deja que el adaptador de
   * almacenamiento decida dónde viven.
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: loadStorageEnv().maxSizeBytes, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'category', 'sensitivity'],
      properties: {
        file: { type: 'string', format: 'binary' },
        category: { type: 'string', enum: ['DOCUMENT', 'IMAGE'] },
        sensitivity: { type: 'string', enum: ['NORMAL', 'PHI'] },
      },
    },
  })
  @ApiOperation({ summary: 'Subir el contenido de un archivo (multipart)' })
  upload(
    @UploadedFile() file: UploadedFileBytes | undefined,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FileResponseDto> {
    return this.uploadService.upload(file, dto, user);
  }

  /**
   * UC-02-08 (lectura): los archivos adjuntos a un recurso.
   *
   * **Va declarado antes que `:id/content` a propósito.** Express resuelve por
   * orden de declaración: puesto después, `/common/files/links` entraría por
   * `:id/content` con `id = "links"` y moriría en el `ParseUUIDPipe` con un 400
   * que no explica nada.
   */
  @Get('links')
  @ApiOperation({
    summary: 'Listar los archivos adjuntos a un recurso (UC-02-08)',
  })
  listLinks(
    @Query() query: ListFileLinksQueryDto,
  ): Promise<LinkedFilePageDto> {
    return this.filesService.listLinkedFiles(query);
  }

  /** Devuelve el contenido de la versión vigente de un archivo. */
  @Get(':id/content')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Descargar el contenido vigente de un archivo' })
  async downloadContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    const content = await this.uploadService.download(id, actor);
    res.setHeader('Content-Type', content.mimeType);
    if (content.originalName) {
      // Se codifica el nombre para que no pueda inyectar cabeceras ni comillas.
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(content.originalName)}`,
      );
    }
    res.send(content.buffer);
  }

  /** UC-02-05: crea un archivo y su primera versión. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un archivo con su versión inicial (UC-02-05)',
  })
  createFile(
    @Body() dto: CreateFileDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FileResponseDto> {
    return this.filesService.createFile(dto, user);
  }

  /** UC-02-06: añade una nueva versión. */
  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Añadir una versión a un archivo (UC-02-06)' })
  createVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFileVersionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FileVersionResponseDto> {
    return this.filesService.createVersion(id, dto, user);
  }

  /** UC-02-07: genera un derivado de una versión limpia. */
  @Post(':id/versions/:vid/derivatives')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generar un derivado de una versión (UC-02-07)' })
  createDerivative(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('vid', ParseUUIDPipe) vid: string,
    @Body() dto: CreateFileDerivativeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FileDerivativeResponseDto> {
    return this.filesService.createDerivative(id, vid, dto, user);
  }

  /** UC-02-08: vincula un archivo a un propietario. */
  @Post(':id/links')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Vincular un archivo a un propietario (UC-02-08)' })
  createLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFileLinkDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FileLinkResponseDto> {
    return this.filesService.createLink(id, dto, user);
  }

  /** UC-02-10: borrado lógico del archivo. */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Borrar lógicamente un archivo (UC-02-10)' })
  softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeleteFileResponseDto> {
    return this.filesService.softDelete(id, user);
  }

  /** UC-02-11: emite una URL de descarga firmada. */
  @Post(':id/download-url')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir una URL de descarga firmada (UC-02-11)' })
  downloadUrl(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DownloadUrlResponseDto> {
    return this.filesService.generateDownloadUrl(id);
  }
}
