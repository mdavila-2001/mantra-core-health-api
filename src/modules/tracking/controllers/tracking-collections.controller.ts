import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { TrackingCollectionsService } from '../services';
import {
  ListMilestoneDefinitionsQueryDto,
  ListShipmentsQueryDto,
  ListTrackableSubjectsQueryDto,
  MilestoneDefinitionPageDto,
  ShipmentPageDto,
  TrackableSubjectPageDto,
} from '../dto';

/**
 * `GET` de colección de `tracking` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('tracking-collections')
@ApiBearerAuth()
@Controller()
export class TrackingCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: TrackingCollectionsService) {}

  /** V37-01: listar envíos del tenant. */
  @Get('tracking/shipments')
  @Roles('LOGISTICS_OPERATOR', 'TRACKING_ADMIN')
  @ApiOperation({ summary: 'Listar envíos del tenant' })
  @ApiOkResponse({ type: ShipmentPageDto })
  listShipments(
    @Query() query: ListShipmentsQueryDto,
  ): Promise<ShipmentPageDto> {
    return this.collections.listShipments(query);
  }

  /** V37-06: listar definiciones de hito del tenant. */
  @Get('tracking/milestone-definitions')
  @Roles('TRACKING_ADMIN')
  @ApiOperation({ summary: 'Listar definiciones de hito del tenant' })
  @ApiOkResponse({ type: MilestoneDefinitionPageDto })
  listMilestoneDefinitions(
    @Query() query: ListMilestoneDefinitionsQueryDto,
  ): Promise<MilestoneDefinitionPageDto> {
    return this.collections.listMilestoneDefinitions(query);
  }

  /** V37-07: listar sujetos rastreables del tenant. */
  @Get('tracking/trackable-subjects')
  @Roles('TRACKING_ADMIN', 'LOGISTICS_OPERATOR')
  @ApiOperation({ summary: 'Listar sujetos rastreables del tenant' })
  @ApiOkResponse({ type: TrackableSubjectPageDto })
  listTrackableSubjects(
    @Query() query: ListTrackableSubjectsQueryDto,
  ): Promise<TrackableSubjectPageDto> {
    return this.collections.listTrackableSubjects(query);
  }
}
