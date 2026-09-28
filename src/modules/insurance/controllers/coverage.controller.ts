import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { CoverageService } from '../services';
import {
  CreateCoverageDto,
  CreateEligibilityRequestDto,
  CreateCobDto,
  CreatedResourceDto,
  ResourceStatusDto,
  MyCoverageDto,
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
  @Roles('PATIENT')
  @ApiOperation({ summary: 'Mi cobertura' })
  listMine(@CurrentUser() actor: AuthenticatedUser): Promise<MyCoverageDto[]> {
    return this.service.listMine(actor);
  }

  /** UC-26-02. */
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
