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
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
  AccessLogged,
} from '../../../../common';
import { CoverageService } from '../../application/services';
import {
  CreateCoverageDto,
  CreateEligibilityRequestDto,
  CreateCobDto,
  CreatedResourceDto,
  ResourceStatusDto,
  MyCoverageDto,
  PatientCoverageOptionListDto,
} from '../dto';

/**
 * Coberturas de paciente, elegibilidad y coordinación de beneficios
 * (UC-26-02, UC-26-03, UC-26-09). Capa fina que delega en `CoverageService`.
 */
@ApiTags('insurance-coverage')
@ApiBearerAuth()
@Roles('BILLING', 'FINANCE')
@Controller()
export class CoverageController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: CoverageService) {}

  /**
   * CV-11 — «Mi cobertura»: el paciente lee sus propias coberturas. Pisa el
   * `@Roles` de clase con el propio del titular, igual que
   * `ReferralsController.listMine`.
   */
  @Get('patient-coverages/me')
  @AccessLogged({ resourceType: 'PATIENT_COVERAGES', patient: 'actor' })
  @Roles('PATIENT')
  @ApiOperation({ summary: 'Mi cobertura' })
  listMine(@CurrentUser() actor: AuthenticatedUser): Promise<MyCoverageDto[]> {
    return this.service.listMine(actor);
  }

  /**
   * Los seguros de una persona, para quien cobra (carril 16, REQ-16-026). Usa
   * el `@Roles` de clase (`BILLING`, `FINANCE`; `SUPERADMIN` por el comodín),
   * el mismo de cotizar. Cada lectura queda en la bitácora de accesos con la
   * persona leída.
   */
  @Get('patient-coverages/by-patient/:patientProfileId')
  @AccessLogged({
    resourceType: 'PATIENT_COVERAGES',
    patient: 'param:patientProfileId',
  })
  @ApiOperation({ summary: 'Seguros de una persona, para quien cobra' })
  @ApiOkResponse({ type: PatientCoverageOptionListDto })
  listForPatient(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientCoverageOptionListDto> {
    return this.service.listForPatient(patientProfileId, actor);
  }

  /** UC-26-02. */
  @Audited({
    action: 'PATIENT_COVERAGE_ENROLLED',
    entity: 'patient_coverage',
    entityId: 'result.id',
  })
  @Post('patient-coverages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar cobertura de paciente y dependientes' })
  enroll(
    @Body() dto: CreateCoverageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    return this.service.enrollCoverage(dto, actor);
  }

  /** UC-26-03. */
  @Audited({
    action: 'COVERAGE_ELIGIBILITY_REQUESTED',
    entity: 'coverage_eligibility_request',
    entityId: 'result.id',
  })
  @Post('coverage-eligibility-requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar y resolver elegibilidad (270/271)' })
  requestEligibility(
    @Body() dto: CreateEligibilityRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.requestEligibility(dto, actor);
  }

  /** UC-26-09. */
  @Audited({
    action: 'COORDINATION_OF_BENEFITS_DETERMINED',
    entity: 'coordination_of_benefit',
    entityId: 'result.id',
  })
  @Post('coordination-of-benefits')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Determinar coordinación de beneficios (COB)' })
  determineCob(
    @Body() dto: CreateCobDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.determineCob(dto, actor);
  }
}
