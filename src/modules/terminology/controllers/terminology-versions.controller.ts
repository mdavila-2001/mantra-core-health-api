import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
  ApiResponse,
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
  ImportConceptsFileRequestDto,
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
   * Importa conceptos desde un archivo ya subido (UC-03-03, por archivo).
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
   * @param file - El archivo con las filas a importar.
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
      properties: {
        file: { type: 'string', format: 'binary' },
        dryRun: { type: 'boolean', default: false },
        profile: { type: 'string', default: 'conceptos' },
      },
    },
  })
  @ApiOperation({
    summary:
      'UC-03-03: importa filas desde un archivo, o las valida sin escribir',
  })
  // Dos códigos de éxito, y el generador sólo deduce el de `@HttpCode`. Sin
  // declarar el 200, quien lea el contrato publicado escribe un cliente que
  // trata como error la validación sin escribir y el rechazo por errores.
  @ApiResponse({
    status: 201,
    description: 'El archivo entró entero: los conceptos quedaron escritos',
    type: ImportConceptsFileResponseDto,
  })
  @ApiResponse({
    status: 200,
    description:
      'No se escribió nada: o se pidió validar sin escribir (`dryRun`), o el ' +
      'archivo se rechazó entero por errores de fila (`aborted`)',
    type: ImportConceptsFileResponseDto,
  })
  async importConceptsFile(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @UploadedFile() file: ArchivoSubido | undefined,
    @Body() opciones: ImportConceptsFileRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ImportConceptsFileResponseDto> {
    if (!file) {
      throw new PreconditionFailedException('Falta el archivo', { versionId });
    }

    const resultado = await this.fileImportService.importFromFile(
      versionId,
      file.buffer,
      user,
      opciones,
    );

    // Validar no crea nada, así que responder 201 diría que sí. El 201 queda
    // para la importación que escribió, y el rechazo por errores también es
    // 200: la petición se atendió y su respuesta es el informe de qué corregir.
    if (resultado.dryRun || resultado.aborted) {
      response.status(HttpStatus.OK);
    }
    return resultado;
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
