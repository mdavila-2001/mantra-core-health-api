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
import { EncounterInformedConsentsService } from '../services';
import {
  MyTreatmentConsentListDto,
  RegisterEncounterInformedConsentDto,
  TreatmentInformedConsentResponseDto,
} from '../dto';

/**
 * El consentimiento informado del encuentro, registrado por el médico (CL-77).
 * El `@Roles('SECURITY_ADMIN')` de `POST /consent/treatment-informed-consents`
 * no cambia: esta es la ruta del médico, con el paciente y el tenant salidos del
 * encuentro y la autorización de escritura sobre la historia.
 */
@ApiTags('consent-treatment-informed-consents')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('consent/encounters')
export class EncounterInformedConsentsController {
  /**
   * @param service - Registro y lectura por encuentro.
   */
  constructor(private readonly service: EncounterInformedConsentsService) {}

  /** UC-07-08 desde la consulta. */
  @Post(':encounterId/informed-consent')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el consentimiento informado del encuentro',
  })
  register(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: RegisterEncounterInformedConsentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentResponseDto> {
    return this.service.register(encounterId, dto, actor);
  }

  /** Los consentimientos informados ya registrados en el encuentro. */
  @Get(':encounterId/informed-consent')
  @ApiOperation({
    summary: 'Consentimientos informados registrados en el encuentro',
  })
  list(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyTreatmentConsentListDto> {
    return this.service.listForEncounter(encounterId, actor);
  }
}
