import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common';
import type { AuthenticatedUser } from '../../../common';
import { FilesService } from '../services';
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
} from '../dto';

/** Endpoints del subsistema de archivos del módulo Common. */
@ApiTags('common/files')
@ApiBearerAuth()
@Controller('common/files')
export class CommonFilesController {
  constructor(private readonly filesService: FilesService) {}

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
