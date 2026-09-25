import { Controller, Get, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { Roles } from '../../../common';
import { ImportTemplateQueryDto } from '../dto';
import { ImportTemplateService } from '../services';

/**
 * Descarga de la plantilla que hay que llenar para importar.
 *
 * Vive en su propio controlador porque no cuelga de una versión: la plantilla
 * depende de qué se va a cargar, no de dónde se va a cargar, y pedirla antes de
 * haber creado la versión es justamente el orden natural.
 */
@ApiTags('terminology')
@ApiBearerAuth()
@Controller('terminology')
export class TerminologyImportTemplateController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param plantillas - Generador de plantillas de importación.
   */
  constructor(private readonly plantillas: ImportTemplateService) {}

  /**
   * Descarga la plantilla del perfil pedido.
   *
   * @param query - Qué se va a cargar y en qué formato.
   * @param response - Para declarar el tipo y el nombre con que se guarda.
   * @returns El archivo.
   */
  @Get('import-template')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'UC-03-03: descarga la plantilla de importación de un perfil',
  })
  descargarPlantilla(
    @Query() query: ImportTemplateQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): StreamableFile {
    const plantilla = this.plantillas.generar(
      query.profile ?? 'conceptos',
      query.format ?? 'csv',
    );

    response.setHeader('Content-Type', plantilla.tipo);
    // Con nombre: sin esto el navegador la guarda como «import-template», que
    // no dice de qué perfil es ni con qué abrirla.
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${plantilla.nombre}"`,
    );
    return new StreamableFile(plantilla.contenido);
  }
}
