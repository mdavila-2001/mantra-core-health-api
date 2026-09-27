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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ClaimsService } from '../services';
import { InsurerAdministration } from '../guards';
import {
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
  constructor(private readonly service: ClaimsService) {}

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

  /**
   * UC-26-07. `@Roles()` vacío anula el `BILLING`/`FINANCE` de la clase, que
   * dejaría afuera al OWNER/ADMIN de la aseguradora (rol global `USER`); la
   * barrera de borde es `@InsurerAdministration`, con los mismos roles
   * heredados que acepta `assertLegacyClaimRoles` para los reclamos sin pedido.
   */
  @Post(':id/adjudications')
  @Roles()
  @InsurerAdministration('BILLING', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjudicar reclamo por línea (835)' })
  adjudicate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAdjudicationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.adjudicate(id, dto, actor);
  }

  /** UC-26-08. Misma barrera que la adjudicación: la EOB la publica la aseguradora. */
  @Post(':id/eob')
  @Roles()
  @InsurerAdministration('BILLING', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar Explicación de Beneficios (EOB)' })
  publishEob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishEobDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.publishEob(id, dto, actor);
  }

  /** UC-26-10. Misma barrera que la adjudicación: revierte la aseguradora. */
  @Post(':id/reversals')
  @Roles()
  @InsurerAdministration('BILLING', 'FINANCE')
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
