import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ConsentsService } from '../services';
import {
  AmendProvisionsDto,
  ConsentResponseDto,
  CreateConsentDto,
  StatusResultDto,
  WithdrawConsentDto,
} from '../dto';

/**
 * Endpoints sobre `/consent/consents`. Capa fina: valida parámetros y delega en
 * `ConsentsService`.
 */
@ApiTags('consent-consents')
@ApiBearerAuth()
@Controller('consent/consents')
export class ConsentsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param consentsService - Valor de consents service requerido por la operación.
   */
  constructor(private readonly consentsService: ConsentsService) {}

  /** UC-07-01. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Capturar consentimiento de directiva de privacidad',
  })
  capture(
    @Body() dto: CreateConsentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConsentResponseDto> {
    return this.consentsService.capture(dto, actor);
  }

  /** UC-07-02. */
  @Post(':id/withdraw')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Revocar/retirar consentimiento y disparar re-evaluación de accesos',
  })
  withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WithdrawConsentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.consentsService.withdraw(id, dto, actor);
  }

  /** UC-07-09. */
  @Patch(':id/provisions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar provisiones granulares (data class / actor / acción)',
  })
  amendProvisions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AmendProvisionsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.consentsService.amendProvisions(id, dto, actor);
  }
}
