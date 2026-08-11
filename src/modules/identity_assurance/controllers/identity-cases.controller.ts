import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { IdentityCasesService } from '../services';
import {
  OpenCaseDto,
  SubmitEvidenceDto,
  PlanChecksDto,
  RaiseFraudSignalDto,
  OpenManualReviewDto,
  IssueAssertionDto,
  CaseResponseDto,
  EvidenceResponseDto,
  ChecksPlannedResponseDto,
  FraudSignalResponseDto,
  ManualReviewResponseDto,
  AssertionResponseDto,
  ExpireSweepResponseDto,
  CaseQueueResponseDto,
} from '../dto';

/**
 * Endpoints sobre el agregado de casos de verificación
 * (`/identity/verification-cases`): UC-27-02, 03, 04, 07, 08, 10 y 12.
 */
@ApiTags('identity-verification-cases')
@ApiBearerAuth()
@Controller('identity/verification-cases')
export class IdentityCasesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param casesService - Valor de cases service requerido por la operación.
   */
  constructor(private readonly casesService: IdentityCasesService) {}

  /**
   * La cola de revisión. Es la única lectura de esta superficie: habilita
   * UC-27-08/09 sobre casos que el revisor descubre acá, en vez de exigirle
   * que ya conozca el id.
   *
   * Restringida a `SECURITY_ADMIN` como el resto del controller. El rol es el
   * único límite real: la tabla no tiene `tenant_id` y el RLS no la alcanza
   * (ver `IdentityCasesService.listQueue`).
   */
  @Get()
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar los casos que esperan revisión' })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Concepto de estado a listar; por defecto, los que esperan revisión',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Casos por página (por defecto 50)',
  })
  listQueue(
    @Query('status', new ParseUUIDPipe({ optional: true })) status?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<CaseQueueResponseDto> {
    return this.casesService.listQueue(status, limit);
  }

  /** UC-27-12 (barrido programado). Declarado antes que las rutas con `:id`. */
  @Post('expire-sweep')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Expirar por lote los casos vencidos (job programado)',
  })
  expireSweep(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExpireSweepResponseDto> {
    return this.casesService.expireSweep(actor);
  }

  /** UC-27-02. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar un caso de verificación de identidad' })
  open(
    @Body() dto: OpenCaseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CaseResponseDto> {
    return this.casesService.openCase(dto, actor);
  }

  /** UC-27-03. */
  @Post(':id/evidence')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Aportar evidencia documental bajo consentimiento' })
  submitEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitEvidenceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EvidenceResponseDto> {
    return this.casesService.submitEvidence(id, dto, actor);
  }

  /** UC-27-04. */
  @Post(':id/checks\\:plan')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Planificar los checks requeridos del caso' })
  planChecks(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PlanChecksDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ChecksPlannedResponseDto> {
    return this.casesService.planChecks(id, dto, actor);
  }

  /** UC-27-07. */
  @Post(':id/fraud-signals')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Detectar y registrar una señal de fraude' })
  raiseFraudSignal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RaiseFraudSignalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FraudSignalResponseDto> {
    return this.casesService.raiseFraudSignal(id, dto, actor);
  }

  /** UC-27-08. */
  @Post(':id/manual-review')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Escalar el caso a revisión manual' })
  openManualReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OpenManualReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ManualReviewResponseDto> {
    return this.casesService.openManualReview(id, dto, actor);
  }

  /** UC-27-10. */
  @Post(':id/assertions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Emitir una aserción de identidad con nivel de aseguramiento',
  })
  issueAssertion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IssueAssertionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AssertionResponseDto> {
    return this.casesService.issueAssertion(id, dto, actor);
  }
}
