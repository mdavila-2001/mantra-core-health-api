import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
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
  constructor(
    private readonly treatmentService: TreatmentInformedConsentsService,
  ) {}

  /** UC-07-08. */
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
