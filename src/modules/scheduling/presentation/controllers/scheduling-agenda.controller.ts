import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  PatientAnyTenant,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { ListMyResourcesUseCase } from '../../application/catalog/use-cases/list-my-resources.use-case';
import { UpdateResourceUseCase } from '../../application/catalog/use-cases/update-resource.use-case';
import { SchedulingAgendaService } from '../../application';
import {
  BookableOrganizationsResponseDto,
  BookableResourcesQueryDto,
  BookableResourcesResponseDto,
  ListResourcesQueryDto,
  ListResourcesResponseDto,
  ListSlotsQueryDto,
  ListSlotsResponseDto,
  MyResourcesQueryDto,
  MyResourcesResponseDto,
  ResourceApprovalDto,
  UpdateResourceDto,
} from '../dto';

/**
 * Lectura de la agenda.
 *
 * El módulo se había construido entero de escritura: se podían generar cupos y
 * confirmar citas, pero no había forma de *ver* ninguna de las dos cosas. Sin
 * `GET /scheduling/slots` el portal no puede obtener el `slotId` que exige
 * `POST /scheduling/slots/{id}/holds`, así que reservar era imposible desde
 * fuera de la base de datos.
 */
@ApiTags('scheduling-agenda')
@ApiBearerAuth()
@Controller('scheduling')
export class SchedulingAgendaController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param agendaService - Valor de agenda service requerido por la operación.
   */
  constructor(
    private readonly agendaService: SchedulingAgendaService,
    private readonly listMyResources: ListMyResourcesUseCase,
    private readonly updateResourceUseCase: UpdateResourceUseCase,
  ) {}

  /** v4.2.88 · the caller's own agendas and whether requests wait for them. */
  @Get('my-resources')
  @Roles('PRACTITIONER', 'SCHEDULING_ADMIN')
  @ApiOperation({
    summary: 'Listar mis agendas y cómo reciben las solicitudes de consulta',
  })
  @ApiOkResponse({ type: MyResourcesResponseDto })
  listMine(
    @Query() query: MyResourcesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyResourcesResponseDto> {
    return this.listMyResources.execute(query.tenantId, actor);
  }

  /** v4.2.88 · a practitioner edits their own agenda; admins edit any. */
  @Audited({
    action: 'SCHEDULE_RESOURCE_UPDATED',
    entity: 'schedulable_resource',
    entityId: 'param:id',
  })
  @Patch('resources/:id')
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER')
  @ApiOkResponse({ type: ResourceApprovalDto })
  @ApiOperation({
    summary: 'Editar un recurso agendable',
    description:
      'Todo opcional; lo que no se manda se conserva. `requiresApproval: false` hace que las solicitudes de consulta nazcan confirmadas; la oferta de un servicio sigue mandando sobre su cupo.',
  })
  updateResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceApprovalDto> {
    return this.updateResourceUseCase.execute(id, dto, actor);
  }

  /**
   * Organizaciones con las que se puede pedir cita hoy, de todas las
   * organizaciones. Es la puerta de entrada del paciente a la agenda ajena.
   */
  @Get('bookable-organizations')
  @Roles('PATIENT')
  @ApiOperation({
    summary: 'Listar las organizaciones con cupos abiertos para pedir cita',
    description:
      'Sólo identificador, nombre y cuántos profesionales y laboratorios tienen cupos por delante. Después se pide cada agenda con `X-Tenant-Id` de la organización elegida.',
  })
  listBookableOrganizations(): Promise<BookableOrganizationsResponseDto> {
    return this.agendaService.listBookableOrganizations();
  }

  /**
   * Practitioners or laboratories with something to book, from every
   * organization, paged. Each one carries the `tenantId` its agenda is read with.
   */
  @Get('bookable-resources')
  @Roles('PATIENT')
  @ApiOperation({
    summary:
      'Listar, paginados, los profesionales o laboratorios con horarios de todas las organizaciones',
  })
  listBookableResources(
    @Query() query: BookableResourcesQueryDto,
  ): Promise<BookableResourcesResponseDto> {
    return this.agendaService.listBookableResources(query);
  }

  /** Recursos agendables del tenant. */
  @Get('resources')
  @PatientAnyTenant()
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER', 'PATIENT')
  @ApiOperation({ summary: 'Listar los recursos agendables de un tenant' })
  listResources(
    @Query() query: ListResourcesQueryDto,
  ): Promise<ListResourcesResponseDto> {
    return this.agendaService.listResources(query);
  }

  /**
   * Cupos de una ventana. Con `onlyAvailable=true` devuelve los que el portal
   * puede ofrecer: abiertos y con capacidad libre.
   */
  @Get('slots')
  @PatientAnyTenant()
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER', 'PATIENT')
  @ApiOperation({
    summary: 'Consultar los cupos de una ventana',
    description:
      'El `id` de cada cupo es el que se envía a `POST /scheduling/slots/{id}/holds`.',
  })
  listSlots(@Query() query: ListSlotsQueryDto): Promise<ListSlotsResponseDto> {
    return this.agendaService.listSlots(query);
  }
}
