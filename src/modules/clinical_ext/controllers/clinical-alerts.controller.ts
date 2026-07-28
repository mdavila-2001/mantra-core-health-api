import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ClinicalAlertsService } from '../services';
import { OverrideAlertDto, ClinicalAlertResponseDto } from '../dto';

/**
 * Endpoints del ciclo de vida de alertas clínicas (`/clinical-alerts`, UC-18-05):
 * reconocer u override. Capa fina que delega en `ClinicalAlertsService`.
 */
@ApiTags('clinical-ext-alerts')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('clinical-alerts')
export class ClinicalAlertsController {
  constructor(private readonly alertsService: ClinicalAlertsService) {}

  /** UC-18-05 (acknowledge). */
  @Patch(':id/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reconocer una alerta clínica' })
  acknowledge(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ClinicalAlertResponseDto> {
    return this.alertsService.acknowledge(id, actor);
  }

  /** UC-18-05 (override). */
  @Patch(':id/override')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Override (sobreescribir) una alerta clínica' })
  override(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OverrideAlertDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ClinicalAlertResponseDto> {
    return this.alertsService.override(id, dto, actor);
  }
}
