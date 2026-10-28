import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { PractitionerInsurerRequestsService } from '../../application/services/practitioner-insurer-requests.service';
import {
  CreatePractitionerInsurerRequestsDto,
  PractitionerInsurerRequestDto,
  PractitionerInsurerRequestPageDto,
  ReceivedPractitionerInsurerRequestDto,
  ReceivedPractitionerInsurerRequestPageDto,
  RejectPractitionerInsurerRequestDto,
} from '../dto/practitioner-insurer-request.dto';

/**
 * El lado del médico: «trabajo con estas aseguradoras» (v4.2.64).
 *
 * Cuelga de `/practitioners/me` como sus sedes y sus redes: el sujeto sale de la
 * sesión y ninguna ruta recibe un id de profesional.
 */
@ApiTags('insurance-practitioner-requests')
@ApiBearerAuth()
@Controller('practitioners/me/insurer-requests')
export class PractitionerInsurerRequestsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Casos de uso de la solicitud médico → aseguradora.
   */
  constructor(private readonly service: PractitionerInsurerRequestsService) {}

  /** Las solicitudes propias, con su estado y el motivo si las rechazaron. */
  @Get()
  @Roles('PRACTITIONER')
  @ApiOperation({ summary: 'Mis solicitudes a aseguradoras' })
  @ApiOkResponse({ type: PractitionerInsurerRequestPageDto })
  listOwn(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerInsurerRequestPageDto> {
    return this.service.listOwn(actor);
  }

  /** Pedir trabajar con una o más aseguradoras del catálogo público. */
  @Audited({
    action: 'PRACTITIONER_INSURER_REQUESTED',
    entity: 'practitioner_insurer_request',
  })
  @Post()
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Pedir trabajar con aseguradoras',
    description:
      'Cada una queda PENDING hasta que la aseguradora la apruebe o la rechace. Lo ya pendiente o aprobado no se duplica; tras un rechazo o un retiro se crea otra solicitud y la anterior queda en la historia.',
  })
  @ApiOkResponse({ type: PractitionerInsurerRequestPageDto })
  @ApiConflictResponse({
    description: 'Todas las indicadas ya estaban pendientes o aprobadas.',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Alguna aseguradora no existe o no está activa.',
  })
  requestOwn(
    @Body() dto: CreatePractitionerInsurerRequestsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerInsurerRequestPageDto> {
    return this.service.requestOwn(dto.carrierIds, actor);
  }

  /** Retirar una solicitud propia que sigue pendiente. */
  @Audited({
    action: 'PRACTITIONER_INSURER_REQUEST_WITHDRAWN',
    entity: 'practitioner_insurer_request',
    entityId: 'param:id',
  })
  @Post(':id/withdraw')
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retirar una solicitud pendiente a una aseguradora',
  })
  @ApiOkResponse({ type: PractitionerInsurerRequestDto })
  @ApiNotFoundResponse({ description: 'No existe o es de otro profesional.' })
  @ApiUnprocessableEntityResponse({ description: 'Ya no está pendiente.' })
  withdrawOwn(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerInsurerRequestDto> {
    return this.service.withdrawOwn(id, actor);
  }
}

/**
 * El lado de la aseguradora: quiénes piden trabajar con ella.
 *
 * **Sin `@Roles`**, como su bandeja de reclamos: la barrera depende de a QUÉ
 * aseguradora pertenece la sesión, no de un rol fijo. La evalúa
 * `InsurerContextService` y la compañía sale del tenant activo.
 */
@ApiTags('insurance-practitioner-requests')
@ApiBearerAuth()
@Controller('insurance/practitioner-requests')
export class InsurerPractitionerRequestsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Casos de uso de la solicitud médico → aseguradora.
   */
  constructor(private readonly service: PractitionerInsurerRequestsService) {}

  /** La bandeja: pendientes primero, después lo ya decidido. */
  @Get()
  @ApiOperation({
    summary:
      'Solicitudes de profesionales que piden trabajar con la aseguradora activa',
  })
  @ApiOkResponse({ type: ReceivedPractitionerInsurerRequestPageDto })
  @ApiForbiddenResponse({
    description:
      'La organización activa no es una aseguradora, o la sesión no tiene permiso sobre ella.',
  })
  listReceived(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReceivedPractitionerInsurerRequestPageDto> {
    return this.service.listReceived(actor);
  }

  /** Confirmar que el profesional trabaja con la aseguradora. */
  @Audited({
    action: 'PRACTITIONER_INSURER_REQUEST_APPROVED',
    entity: 'practitioner_insurer_request',
    entityId: 'param:id',
  })
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar la solicitud de un profesional' })
  @ApiOkResponse({ type: ReceivedPractitionerInsurerRequestDto })
  @ApiNotFoundResponse({ description: 'No existe o es de otra aseguradora.' })
  @ApiUnprocessableEntityResponse({
    description: 'Ya fue decidida o retirada.',
  })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReceivedPractitionerInsurerRequestDto> {
    return this.service.approve(id, actor);
  }

  /** Rechazarla, con un motivo opcional que lee el profesional. */
  @Audited({
    action: 'PRACTITIONER_INSURER_REQUEST_REJECTED',
    entity: 'practitioner_insurer_request',
    entityId: 'param:id',
  })
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar la solicitud de un profesional' })
  @ApiOkResponse({ type: ReceivedPractitionerInsurerRequestDto })
  @ApiNotFoundResponse({ description: 'No existe o es de otra aseguradora.' })
  @ApiUnprocessableEntityResponse({
    description: 'Ya fue decidida o retirada.',
  })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectPractitionerInsurerRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReceivedPractitionerInsurerRequestDto> {
    return this.service.reject(id, dto.reason, actor);
  }
}
