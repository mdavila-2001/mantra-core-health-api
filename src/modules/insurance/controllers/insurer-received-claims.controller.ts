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
  CurrentUser,
  type AuthenticatedUser,
  AccessLogged,
} from '../../../common';
import { InsurerReceivedClaimsService } from '../services';
import {
  ReceivedClaimDecisionDto,
  ReceivedClaimDto,
  ReceivedClaimListDto,
} from '../dto';

/**
 * Solicitudes recibidas por la aseguradora y su dictamen (Hito 4 §A).
 *
 * La cara de **quien paga** del mismo `insurance_claims` que ve el prestador en
 * `GET /insurance-claims`. Contrato del front:
 * `docs/contracts/insurer-received-claims.md`.
 *
 * **Sin `@Roles`**, igual que `InsuranceAnalyticsController`: la barrera depende
 * de a QUÉ aseguradora pertenece la sesión —su membresía OWNER/ADMIN, o un rol
 * de aseguradora vigente en ese tenant— y no de un rol fijo declarable en el
 * decorador. Se evalúa en `InsurerReceivedClaimsService`. La aseguradora sale
 * del tenant activo: ninguna ruta recibe un id de aseguradora del cliente.
 *
 * Las rutas de factura del contrato (`invoice` y `invoice/annulment`) no están:
 * el modelo no declara dónde vive esa factura. Ver el README del módulo.
 */
@ApiTags('insurer-received-claims')
@ApiBearerAuth()
@Controller('insurance/received-claims')
export class InsurerReceivedClaimsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Lectura y dictamen de las solicitudes recibidas.
   */
  constructor(private readonly service: InsurerReceivedClaimsService) {}

  /**
   * Las solicitudes que los prestadores le presentaron a la aseguradora activa.
   *
   * @param actor - La sesión que pregunta.
   * @returns Hasta 500, de la más reciente a la más vieja, con aviso de recorte.
   */
  @Get()
  @AccessLogged({ resourceType: 'INSURANCE_CLAIMS', purpose: 'PAYMENT' })
  @ApiOperation({
    summary: 'Solicitudes de seguro recibidas por la aseguradora activa',
    description:
      'Sin parámetros: la aseguradora sale del tenant activo. Importes como cadena decimal. Tope de 500 filas con `truncated: true` si hay más.',
  })
  @ApiOkResponse({ type: ReceivedClaimListDto })
  @ApiForbiddenResponse({
    description:
      'La organización activa no es una aseguradora, o la sesión no tiene permiso sobre ella.',
  })
  listReceivedClaims(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReceivedClaimListDto> {
    return this.service.list(actor);
  }

  /**
   * Dictamina una solicitud: aprueba todo, aprueba una parte o rechaza.
   *
   * Es definitivo. Un dictamen favorable publica el evento
   * `InsuranceClaimDecided` en la misma transacción.
   *
   * @param id - La solicitud.
   * @param dto - Resultado, monto (sólo parcial), motivo y cláusula opcional.
   * @param actor - La sesión que dictamina.
   * @returns La solicitud completa, con su dictamen.
   */
  @Post(':id/decision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dictaminar una solicitud recibida (definitivo)',
    description:
      '`PARTIAL` exige `approvedAmount` mayor que cero y menor que lo solicitado; `PARTIAL` y `REJECTED` exigen `reason` de al menos 5 caracteres.',
  })
  @ApiOkResponse({ type: ReceivedClaimDto })
  @ApiForbiddenResponse({
    description: 'No es una aseguradora sobre la que la sesión tenga permiso.',
  })
  @ApiNotFoundResponse({
    description: 'La solicitud no existe o es de otra aseguradora.',
  })
  @ApiConflictResponse({
    description:
      'Ya tiene dictamen: `details.reason` es `ALREADY_DECIDED`. No hay ruta para revertirlo.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'El monto o el motivo no son los que pide el resultado, o el pedido de origen cambió.',
  })
  decideReceivedClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReceivedClaimDecisionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReceivedClaimDto> {
    return this.service.decide(id, dto, actor);
  }
}
