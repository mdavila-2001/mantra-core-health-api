import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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

  /** UC-26-11. */
  @Post(':id/disputes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir disputa sobre adjudicación' })
  openDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDisputeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    return this.service.openDispute(id, dto, actor);
  }
}
