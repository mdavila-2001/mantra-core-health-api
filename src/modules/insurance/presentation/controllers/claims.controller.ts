import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import {
  Audited,
  CurrentUser,
  NotAudited,
  Roles,
  getCurrentTenantId,
  runWithTenant,
  type AuthenticatedUser,
} from '../../../../common';
import { PlatformTenantOptional } from '../../../../common/tenant/platform-tenant-optional.decorator';
import { resolveRequestTenantId } from '../../../../common/tenant/tenant-resolution';
import { isPatientOnlyActor } from '../../domain/actor-kind';
import {
  ClaimPatientInvoiceService,
  ClaimQuoteService,
  ClaimsService,
  PatientChargeObjectionService,
} from '../../application/services';
import {
  ClaimDisputeDto,
  ClaimQuoteDto,
  ClaimQuoteResultDto,
  CreateClaimDto,
  CreatedClaimDto,
  CreateAdjudicationDto,
  PublishEobDto,
  CreateReversalDto,
  CreatedResourceDto,
  IssuePatientInvoiceDto,
  PatientInvoiceIssuedDto,
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
    private readonly patientInvoiceService: ClaimPatientInvoiceService,
    private readonly patientObjectionService: PatientChargeObjectionService,
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
  @Audited({
    action: 'INSURANCE_CLAIM_SUBMITTED',
    entity: 'insurance_claim',
    entityId: 'result.id',
  })
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

  /**
   * REQ-16-028 y 029. Factura al paciente de un servicio reclamado.
   *
   * El servidor arma la línea con la parte del paciente que calculó al enviar
   * el reclamo y la vincula a la línea del reclamo; el cliente no manda el
   * monto. Una línea se factura una sola vez. Quien no tiene acceso al reclamo
   * recibe el mismo 403 que ante un id inexistente.
   */
  @Post(':id/patient-invoice')
  @Roles()
  @Audited({
    action: 'INSURANCE_PATIENT_INVOICE_ISSUED',
    entity: 'invoice',
    entityId: 'result.invoiceId',
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Facturar al paciente su parte de un servicio reclamado',
  })
  @ApiCreatedResponse({ type: PatientInvoiceIssuedDto })
  @ApiForbiddenResponse({
    description:
      'El reclamo o la línea no existen o no son de la organización activa: mismo cuerpo en los dos casos.',
  })
  issuePatientInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IssuePatientInvoiceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientInvoiceIssuedDto> {
    return this.patientInvoiceService.issue(id, dto, actor);
  }

  /** UC-26-07. */
  @Audited({
    action: 'INSURANCE_CLAIM_ADJUDICATED',
    entity: 'claim_adjudication_version',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'EXPLANATION_OF_BENEFIT_PUBLISHED',
    entity: 'patient_explanations_of_benefit',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'INSURANCE_CLAIM_REVERSED',
    entity: 'claim_reversal',
    entityId: 'result.id',
  })
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
   * UC-26-11 y REQ-16-032.
   *
   * Una sola ruta para dos actores, despachada por **quién es el actor** y no
   * por el cuerpo:
   * - El **prestador** apela una adjudicación. Conserva el alcance de TAREA-16:
   *   sólo reclamos de las prácticas de su organización.
   * - El **paciente** objeta un cobro a su nombre. Sólo si es titular de la
   *   cobertura del reclamo; el cobro queda en pausa hasta resolverla.
   *
   * Las otras escrituras delegan la autorización en el servicio, según el
   * origen vinculado y las membresías activas de prestador o aseguradora.
   *
   * `@PlatformTenantOptional('PATIENT')`: un paciente no pertenece a ninguna
   * organización, así que esta ruta no le exige un tenant. Para el resto la
   * resolución del tenant y sus roles acotados son las de siempre.
   */
  @Audited({
    action: 'CLAIM_DISPUTE_OPENED',
    entity: 'claim_dispute',
    entityId: 'result.id',
  })
  @Post(':id/disputes')
  @Roles('BILLING_OPERATOR', 'SECURITY_ADMIN', 'PATIENT')
  @PlatformTenantOptional('PATIENT')
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
    @Body() dto: ClaimDisputeDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<ResourceStatusDto> {
    // Camino de siempre para el prestador: nada cambia si no tiene el rol de paciente.
    if (!actor.roles?.includes('PATIENT')) {
      return this.service.openDispute(id, dto, actor);
    }
    if (isPatientOnlyActor(actor.roles)) {
      return this.patientObjectionService.object(id, dto, actor);
    }
    // Personal que además es paciente: para él esta ruta omitió la resolución
    // del tenant, así que se resuelve igual que lo haría el guard. Sin esto
    // perdería el acceso al alcance de su organización.
    const tenantId =
      getCurrentTenantId() ?? resolveRequestTenantId(request, actor);
    return tenantId
      ? runWithTenant(tenantId, () => this.service.openDispute(id, dto, actor))
      : this.service.openDispute(id, dto, actor);
  }
}
