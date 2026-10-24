import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { DiagnosticsCollectionsService } from '../services';
import { ImagingEndpointPageDto, ListImagingEndpointsQueryDto } from '../dto';

/**
 * `GET` de colección de `diagnostics` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('diagnostics-collections')
@ApiBearerAuth()
@Controller()
export class DiagnosticsCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: DiagnosticsCollectionsService) {}

  /** V20-09: listar endpoints de imagenología del tenant. */
  @Get('diagnostics/imaging-endpoints')
  @Roles('CLINICIAN', 'PRACTITIONER')
  @ApiOperation({ summary: 'Listar endpoints de imagenología del tenant' })
  @ApiOkResponse({ type: ImagingEndpointPageDto })
  listImagingEndpoints(
    @Query() query: ListImagingEndpointsQueryDto,
  ): Promise<ImagingEndpointPageDto> {
    return this.collections.listImagingEndpoints(query);
  }
}
