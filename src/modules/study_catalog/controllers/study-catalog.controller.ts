import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseConceptIdPipe } from '../../clinical/dto/concept-id.validator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ParseOptionalLimitPipe } from '../../../common';
import { StudyCatalogReaderGuard } from '../guards/study-catalog-reader.guard';
import { StudyCatalogService } from '../services/study-catalog.service';
import {
  StudyCatalogDetailDto,
  StudyCatalogPageDto,
} from '../dto/study-catalog.dto';
import {
  STUDY_FAMILIES,
  decodeCatalogCursor,
  parseFamily,
  parseSearchTokens,
} from '../study-catalog.logic';

/** Tamaño de página por omisión y tope. */
export const DEFAULT_STUDY_CATALOG_LIMIT = 25;
export const MAX_STUDY_CATALOG_LIMIT = 100;

/**
 * Catálogo de estudios que el médico puede pedir (laboratorio con sus
 * componentes, imagenología con modalidad y región). Lectura sin PHI.
 */
@ApiTags('study-catalog')
@ApiBearerAuth()
@UseGuards(StudyCatalogReaderGuard)
@Controller('clinical/study-catalog')
export class StudyCatalogController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Lectura del catálogo.
   */
  constructor(private readonly service: StudyCatalogService) {}

  /** Lista el catálogo con búsqueda sin tildes ni mayúsculas (incluye sinónimos y componentes). */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Catálogo de estudios pedibles, con búsqueda y paginación',
    description:
      'Orden alfabético sin tildes. `q` exige que todas sus palabras aparezcan en el nombre, un sinónimo, el código o un componente. Paginación por cursor.',
  })
  @ApiQuery({ name: 'family', required: false, enum: STUDY_FAMILIES })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Texto libre (hasta 100 caracteres)',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: `1 a ${MAX_STUDY_CATALOG_LIMIT}; por omisión ${DEFAULT_STUDY_CATALOG_LIMIT}`,
  })
  list(
    @Query('family') family?: string,
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe(MAX_STUDY_CATALOG_LIMIT))
    limit?: number,
  ): Promise<StudyCatalogPageDto> {
    return this.service.list({
      family: parseFamily(family),
      tokens: parseSearchTokens(q),
      after: cursor ? decodeCatalogCursor(cursor) : undefined,
      limit: limit ?? DEFAULT_STUDY_CATALOG_LIMIT,
    });
  }

  /** Detalle de un estudio: componentes, muestra sugerida, modalidad, regiones y contraste. */
  @Get(':conceptId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Detalle de un estudio del catálogo',
    description:
      'Componentes anidados (laboratorio), muestra sugerida y elegibles, modalidad, regiones permitidas, lateralidad, contraste y avisos de licencia (LOINC, DICOM, SNOMED, RadLex, UBERON). 404 si el concepto no es un estudio del catálogo.',
  })
  detail(
    @Param('conceptId', ParseConceptIdPipe) conceptId: string,
  ): Promise<StudyCatalogDetailDto> {
    return this.service.detail(conceptId);
  }
}
