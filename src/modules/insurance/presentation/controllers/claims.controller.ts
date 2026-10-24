import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  NotAudited,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { ClaimQuoteService, ClaimsService } from '../../application/services';
import {
  ClaimQuoteDto,
  ClaimQuoteResultDto,
  CreateClaimDto,
  CreatedClaimDto,
  CreateAdjudicationDto,
  PublishEobDto,
  CreateReversalDto,
  CreateDisputeDto,
  CreatedResourceDto,
  ResourceStatusDto,
} from '../dto';

/**
 * Ciclo del reclamo: envío, adjudicación, EOB, reversión y disputa
 * (UC-26-06, 07, 08, 10, 11). Capa fina que delega en `ClaimsService`.
 */
@ApiTags('insurance-claims')
@ApiBearerAuth()
@Roles('BILLING', 'FINANCE')
@Controller('insurance-claims')
export class ClaimsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(
    private readonly service: ClaimsService,
    private readonly quoteService: ClaimQuoteService,
  ) {}

  /**
   * REQ-16-026. Cotización previa del cobro, sin efectos.
   *
   * Misma puerta que el envío directo (el servicio exige BILLING, FINANCE o
   * SUPERADMIN) y las mismas reglas que el cobro real, pero no guarda nada ni
   * bloquea ninguna fila. Responde 200, no 201: no se creó ningún recurso.
   */
  @Post('quote')
  @Roles()
  @NotAudited(
    'Cotización sin persistencia ni efectos (REQ-16-026): no muta estado. El cálculo queda sellado al enviar el reclamo, que es la ruta auditada.',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cotizar un cobro a la aseguradora (sin guardar)' })
  @ApiOkResponse({ type: ClaimQuoteResultDto })
  @ApiForbiddenResponse({
    description: 'El rol no puede cobrar a la aseguradora.',
  })
  quote(
    @Body() dto: ClaimQuoteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ClaimQuoteResultDto> {
    return this.quoteService.quote(dto, actor);
  }

  /** UC-26-06. El servicio exige membresía OWNER/ADMIN por origen; conserva roles históricos para reclamos genéricos. */
  @Post()
  @Roles()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar reclamo con líneas (837)' })
  @ApiCreatedResponse({ type: CreatedClaimDto })
  submit(
    @Body() dto: CreateClaimDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedClaimDto> {
    return this.service.submitClaim(dto, actor);
  }

  /** UC-26-07. */
  @Post(':id/adjudications')
  @Roles()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjudicar reclamo por línea (835)' })
  adjudicate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAdjudicationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.adjudicate(id, dto, actor);
  }

  /** UC-26-08. */
  @Post(':id/eob')
  @Roles()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar Explicación de Beneficios (EOB)' })
  publishEob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishEobDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.publishEob(id, dto, actor);
  }

  /** UC-26-10. */
  @Post(':id/reversals')
  @Roles()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar reversión de reclamo' })
  reverse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReversalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.reverse(id, dto, actor);
  }

  /**
   * UC-26-11.
   *
   * Conserva el alcance del prestador definido por TAREA-16 para disputas.
   * Las otras escrituras delegan la autorización en el servicio, según el
   * origen vinculado y las membresías activas de prestador o aseguradora.
   */
  @Post(':id/disputes')
  @Roles('BILLING_OPERATOR', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir disputa sobre adjudicación' })
  // Explícito porque declarar el 403 de abajo apaga el 201 implícito de Swagger
  // y el contrato quedaba sin ninguna respuesta de éxito.
  @ApiCreatedResponse({ type: ResourceStatusDto })
  @ApiForbiddenResponse({
    description:
      'La solicitud no existe o la envió otra organización: mismo cuerpo en ' +
      'los dos casos (AC-16-14).',
  })
  openDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDisputeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    return this.service.openDispute(id, dto, actor);
  }
}
