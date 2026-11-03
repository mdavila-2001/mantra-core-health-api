import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles, PatientAnyTenant } from '../../../../common';
import { SchedulingAgendaService } from '../../application';
import {
  BookableOrganizationsResponseDto,
  ListResourcesQueryDto,
  ListResourcesResponseDto,
  ListSlotsQueryDto,
  ListSlotsResponseDto,
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
  constructor(private readonly agendaService: SchedulingAgendaService) {}

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
