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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { DependentLinkRequestsService } from '../services/dependent-link-requests.service';
import {
  DependentLinkRequestDecisionDto,
  DependentLinkRequestSentDto,
  IncomingDependentLinkRequestDto,
  RequestDependentLinkDto,
} from '../dto';

/**
 * Solicitudes para representar a quien ya tiene cuenta.
 *
 * Mismo prefijo y misma regla que el resto de `patients/me/*`: sin `@Roles`,
 * porque el sujeto lo resuelve el servidor desde la sesión y no hay parámetro
 * que apunte a otro paciente. El `:id` de aceptar y rechazar es el de una
 * solicitud, y el servicio responde `404` a toda la que no sea de la cuenta.
 *
 * Controlador aparte y no dentro de `ProfilesPatientsController` para no
 * sumarle una dependencia más al servicio de pacientes, que ya reúne veinte.
 */
@ApiTags('profiles-patients')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesDependentRequestsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param requests - Servicio de solicitudes de dependiente.
   */
  constructor(private readonly requests: DependentLinkRequestsService) {}

  /**
   * Pide representar a quien ya tiene cuenta con ese CI.
   *
   * Con límite propio: la respuesta distingue «hay cuenta» de «no la hay», y
   * sin freno la ruta serviría para recorrer documentos.
   *
   * @param dto - El documento de la persona.
   * @param actor - Usuario autenticado, que pide representar.
   * @returns La solicitud, pendiente.
   */
  @Post('patients/me/dependent-requests')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Pedir representar a una persona que ya tiene cuenta',
  })
  @ApiCreatedResponse({
    type: DependentLinkRequestSentDto,
    description:
      'La solicitud quedó pendiente y a esa cuenta le llegó un aviso. `404` es «no hay cuenta con ese CI»; `422`, «ese CI es el tuyo».',
  })
  @ApiNotFoundResponse({ description: 'No hay cuenta de paciente con ese CI' })
  @ApiConflictResponse({
    description: 'Ya la representa, o ya hay una solicitud pendiente',
  })
  requestDependentLink(
    @Body() dto: RequestDependentLinkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DependentLinkRequestSentDto> {
    return this.requests.request(dto, actor);
  }

  /**
   * Las solicitudes que esperan respuesta de esta cuenta.
   *
   * @param actor - Usuario autenticado, al que se lo pidieron.
   * @returns Las pendientes; vacío si no hay ninguna.
   */
  @Get('patients/me/dependent-requests/incoming')
  @ApiOperation({ summary: 'Listar las solicitudes de dependiente recibidas' })
  @ApiOkResponse({ type: [IncomingDependentLinkRequestDto] })
  listIncomingDependentLinkRequests(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IncomingDependentLinkRequestDto[]> {
    return this.requests.listIncoming(actor);
  }

  /**
   * Acepta: quien pidió pasa a representar a esta cuenta.
   *
   * @param id - La solicitud.
   * @param actor - Usuario autenticado, al que se lo pidieron.
   * @returns La solicitud, aceptada.
   */
  @Post('patients/me/dependent-requests/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceptar una solicitud de dependiente' })
  @ApiOkResponse({ type: DependentLinkRequestDecisionDto })
  @ApiNotFoundResponse({ description: 'No existe o no es de esta cuenta' })
  @ApiConflictResponse({ description: 'Ya fue respondida' })
  acceptDependentLinkRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DependentLinkRequestDecisionDto> {
    return this.requests.accept(id, actor);
  }

  /**
   * Rechaza: no se crea ningún vínculo.
   *
   * @param id - La solicitud.
   * @param actor - Usuario autenticado, al que se lo pidieron.
   * @returns La solicitud, rechazada.
   */
  @Post('patients/me/dependent-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar una solicitud de dependiente' })
  @ApiOkResponse({ type: DependentLinkRequestDecisionDto })
  @ApiNotFoundResponse({ description: 'No existe o no es de esta cuenta' })
  @ApiConflictResponse({ description: 'Ya fue respondida' })
  rejectDependentLinkRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DependentLinkRequestDecisionDto> {
    return this.requests.reject(id, actor);
  }
}
