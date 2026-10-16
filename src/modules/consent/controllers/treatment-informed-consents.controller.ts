import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { TreatmentInformedConsentsService } from '../services';
import {
  CreateTreatmentInformedConsentDto,
  TreatmentInformedConsentResponseDto,
} from '../dto';

/** Endpoints sobre `/consent/treatment-informed-consents`. */
@ApiTags('consent-treatment-informed-consents')
@ApiBearerAuth()
@Controller('consent/treatment-informed-consents')
export class TreatmentInformedConsentsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param treatmentService - Valor de treatment service requerido por la operación.
   */
  constructor(
    private readonly treatmentService: TreatmentInformedConsentsService,
  ) {}

  /** UC-07-08. */
  @Audited({
    action: 'TREATMENT_INFORMED_CONSENT_SIGNED',
    entity: 'treatment_informed_consent',
    entityId: 'result.id',
  })
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Capturar consentimiento informado de tratamiento' })
  sign(
    @Body() dto: CreateTreatmentInformedConsentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentResponseDto> {
    return this.treatmentService.sign(dto, actor);
  }
}
