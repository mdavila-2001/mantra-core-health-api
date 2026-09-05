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
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ClaimsService } from '../services';
import {
  CreateClaimDto,
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

  /** UC-26-06. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar reclamo con líneas (837)' })
  submit(
    @Body() dto: CreateClaimDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    return this.service.submitClaim(dto, actor);
  }

  /** UC-26-07. */
  @Post(':id/adjudications')
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
   * **Único método de este controlador que cambia de rol** (TAREA-16 · D1.b,
   * decisión de Justin del 2026-09-04): reclamar es un acto del prestador que
   * presentó la solicitud, así que lo ejecuta `BILLING_OPERATOR` —con
   * `SECURITY_ADMIN` como acceso administrativo y `SUPERADMIN` por comodín—.
   * El `@Roles` del método **sobreescribe** el de la clase (`getAllAndOverride`
   * en `RolesGuard`), así que enviar, adjudicar, publicar EOB y revertir siguen
   * exigiendo lo que exigían: son decisiones de quien paga, no de quien
   * reclama.
   */
  @Post(':id/disputes')
  @Roles('BILLING_OPERATOR', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir disputa sobre adjudicación' })
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
