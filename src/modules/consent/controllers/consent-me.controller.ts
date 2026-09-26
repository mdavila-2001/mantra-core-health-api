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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ConsentMeService } from '../services';
import {
  MyConsentListDto,
  MyHipaaAuthorizationListDto,
  MyObjectionListDto,
  MyTreatmentConsentListDto,
  StatusResultDto,
  WithdrawConsentDto,
} from '../dto';

/**
 * «Mi privacidad»: las lecturas del titular sobre `consent` y el retiro de sus
 * consentimientos (BR-20).
 *
 * Cuelga de `me` y no de `patients/:id` a propósito: la persona sale de la
 * cuenta y no hay identificador de paciente que comparar. `@Roles('PATIENT')`
 * acota quién entra; el aislamiento entre personas lo resuelve el servicio.
 */
@ApiTags('consent-me')
@ApiBearerAuth()
@Roles('PATIENT')
@Controller('consent/me')
export class ConsentMeController {
  /**
   * @param service - Lecturas y retiro del titular.
   */
  constructor(private readonly service: ConsentMeService) {}

  /** Mis consentimientos, vigentes y retirados. */
  @Get('consents')
  @ApiOperation({ summary: 'Mis consentimientos (vigentes y retirados)' })
  listConsents(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyConsentListDto> {
    return this.service.listConsents(actor);
  }

  /** Mis autorizaciones de divulgación. */
  @Get('hipaa-authorizations')
  @ApiOperation({ summary: 'Mis autorizaciones de divulgación' })
  listHipaaAuthorizations(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyHipaaAuthorizationListDto> {
    return this.service.listHipaaAuthorizations(actor);
  }

  /** Mis objeciones. */
  @Get('objections')
  @ApiOperation({ summary: 'Mis objeciones (abiertas y resueltas)' })
  listObjections(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyObjectionListDto> {
    return this.service.listObjections(actor);
  }

  /** Mis consentimientos informados de tratamiento. */
  @Get('treatment-informed-consents')
  @ApiOperation({ summary: 'Mis consentimientos informados de tratamiento' })
  listTreatmentConsents(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyTreatmentConsentListDto> {
    return this.service.listTreatmentConsents(actor);
  }

  /** Retira un consentimiento propio: cierra su vigencia, no borra la fila. */
  @Post('consents/:id/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirar uno de mis consentimientos' })
  withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WithdrawConsentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.service.withdrawOwn(actor, id, dto);
  }
}
