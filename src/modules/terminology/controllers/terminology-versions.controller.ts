import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
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
import {
  CurrentUser,
  PreconditionFailedException,
  Roles,
  loadStorageEnv,
  type AuthenticatedUser,
} from '../../../common';
import {
  CodeSystemVersionsService,
  ConceptFileImportService,
} from '../services';
import {
  ImportConceptsDto,
  ImportConceptsFileResponseDto,
  ImportConceptsResponseDto,
  PublishVersionResponseDto,
} from '../dto';

/** Lo que deja el interceptor de multipart, acotado a lo que aquí se usa. */
interface ArchivoSubido {
  /** Contenido en memoria. */
  buffer: Buffer;
  /** Nombre con el que llegó, sólo para el registro. */
  originalname: string;
}

/**
 * Endpoints de ciclo de vida de una versión de sistema de códigos: importación de
 * conceptos (UC-03-03) y publicación (UC-03-04). Reservados a `SECURITY_ADMIN`.
 */
@ApiTags('terminology')
@ApiBearerAuth()
@Controller('terminology/versions')
export class TerminologyVersionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param versionsService - Valor de versions service requerido por la operación.
   * @param fileImportService - Importación de conceptos desde un archivo subido.
   */
  constructor(
    private readonly versionsService: CodeSystemVersionsService,
    private readonly fileImportService: ConceptFileImportService,
  ) {}

  /**
   * Ejecuta la operación import concepts.
   *
   * @param versionId - Identificador de version.
   * @param dto - Datos validados de la operación.
   * @param user - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de import concepts conforme al contrato `Promise<ImportConceptsResponseDto>`.
   */
  @Post(':versionId/import')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-03-03: importa conceptos en una versión en borrador',
  })
  importConcepts(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: ImportConceptsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ImportConceptsResponseDto> {
    return this.versionsService.importConcepts(versionId, dto, user);
  }

  /**
   * Importa conceptos desde un archivo NDJSON ya subido (UC-03-03, por archivo).
   *
   * Es la cara sin techo del import de arriba: aquél recibe los conceptos en el
   * cuerpo, y el cuerpo está limitado a 1 MB —unos diez mil conceptos—. Un
   * sistema de codificación real tiene cien mil.
   *
   * El archivo llega **acá** y no por `common/files`: aquella superficie valida
   * el tipo por bytes mágicos y sólo admite PDF e imágenes, porque existe para
   * evidencia clínica. Un archivo de texto no tiene firma binaria. Acá el tipo
   * se comprueba por parseo, que para NDJSON es una prueba más fuerte.
   *
   * El contenido no se almacena: se convierte en filas y se descarta. Lo que
   * queda es el lote en `terminology.catalog_import_batches`, con la huella del
   * contenido y los contadores.
   *
   * @param versionId - Versión en borrador que recibe los conceptos.
   * @param file - El archivo NDJSON.
   * @param user - Usuario autenticado que ejecuta la operación.
   * @returns Los contadores de la importación y su lote.
   */
  @Post(':versionId/import-file')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      // El mismo tope que la subida de archivos: no hay motivo para que este
      // camino admita más que aquél.
      limits: { fileSize: loadStorageEnv().maxSizeBytes, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary: 'UC-03-03: importa conceptos desde un archivo NDJSON',
  })
  importConceptsFile(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @UploadedFile() file: ArchivoSubido | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ImportConceptsFileResponseDto> {
    if (!file) {
      throw new PreconditionFailedException('Falta el archivo', { versionId });
    }
    return this.fileImportService.importFromFile(versionId, file.buffer, user);
  }

  /**
   * Ejecuta la operación publish version.
   *
   * @param versionId - Identificador de version.
   * @param user - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de publish version conforme al contrato `Promise<PublishVersionResponseDto>`.
   */
  @Post(':versionId/publish')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-03-04: publica una versión (borrador → activa)',
  })
  publishVersion(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PublishVersionResponseDto> {
    return this.versionsService.publishVersion(versionId, user);
  }
}
