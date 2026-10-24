import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccessLogged, Roles } from '../../../common';
import { GeoCollectionsService } from '../services';
import {
  GeofencePageDto,
  ListGeofencesQueryDto,
  ListTrackedSubjectsQueryDto,
  TrackedSubjectPageDto,
} from '../dto';

/**
 * `GET` de colección de `geo` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('geo-collections')
@ApiBearerAuth()
@Controller()
export class GeoCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: GeoCollectionsService) {}

  /** V13-01: listar los sujetos rastreados del tenant. */
  @Get('geo/tracked-subjects')
  @Roles('SECURITY_ADMIN')
  @AccessLogged({ resourceType: 'GEO_TRACKED_SUBJECTS' })
  @ApiOperation({ summary: 'Listar los sujetos rastreados del tenant' })
  @ApiOkResponse({ type: TrackedSubjectPageDto })
  listTrackedSubjects(
    @Query() query: ListTrackedSubjectsQueryDto,
  ): Promise<TrackedSubjectPageDto> {
    return this.collections.listTrackedSubjects(query);
  }

  /** V13-07: listar las geocercas del tenant. */
  @Get('geo/geofences')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar las geocercas del tenant' })
  @ApiOkResponse({ type: GeofencePageDto })
  listGeofences(
    @Query() query: ListGeofencesQueryDto,
  ): Promise<GeofencePageDto> {
    return this.collections.listGeofences(query);
  }
}
