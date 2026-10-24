import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { SystemOpsCollectionsService } from '../services';
import {
  BackupPolicyPageDto,
  CrossBorderTransferEventPageDto,
  DraftRecordPageDto,
  LegalHoldPageDto,
  ListBackupPoliciesQueryDto,
  ListCrossBorderTransfersQueryDto,
  ListDraftsQueryDto,
  ListLegalHoldsQueryDto,
  ListRemediationPlansQueryDto,
  ListTenantResidencyBindingsQueryDto,
  ListWorkloadAssessmentsQueryDto,
  RemediationPlanPageDto,
  TenantResidencyBindingPageDto,
  WorkloadAssessmentPageDto,
} from '../dto';

/**
 * `GET` de colección de `system_ops` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('system-ops-collections')
@ApiBearerAuth()
@Controller()
export class SystemOpsCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: SystemOpsCollectionsService) {}

  /** V11-01: listar borradores de gobierno del tenant. */
  @Get('admin/governance/drafts')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar borradores de gobierno del tenant' })
  @ApiOkResponse({ type: DraftRecordPageDto })
  listDrafts(@Query() query: ListDraftsQueryDto): Promise<DraftRecordPageDto> {
    return this.collections.listDrafts(query);
  }

  /** V11-02: listar retenciones legales del tenant. */
  @Get('admin/governance/legal-holds')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar retenciones legales del tenant' })
  @ApiOkResponse({ type: LegalHoldPageDto })
  listLegalHolds(
    @Query() query: ListLegalHoldsQueryDto,
  ): Promise<LegalHoldPageDto> {
    return this.collections.listLegalHolds(query);
  }

  /** V11-05: listar planes de remediación de una evaluación del tenant. */
  @Get('admin/governance/assessments/:id/remediation-plans')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar planes de remediación de una evaluación del tenant',
  })
  @ApiOkResponse({ type: RemediationPlanPageDto })
  listRemediationPlans(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListRemediationPlansQueryDto,
  ): Promise<RemediationPlanPageDto> {
    return this.collections.listRemediationPlans(id, query);
  }

  /** V11-06: listar transferencias transfronterizas del tenant. */
  @Get('admin/governance/cross-border-transfers')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar transferencias transfronterizas del tenant',
  })
  @ApiOkResponse({ type: CrossBorderTransferEventPageDto })
  listCrossBorderTransfers(
    @Query() query: ListCrossBorderTransfersQueryDto,
  ): Promise<CrossBorderTransferEventPageDto> {
    return this.collections.listCrossBorderTransfers(query);
  }

  /** V11-16: listar vínculos de residencia del tenant. */
  @Get('admin/governance/tenant-residency-bindings')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar vínculos de residencia del tenant' })
  @ApiOkResponse({ type: TenantResidencyBindingPageDto })
  listTenantResidencyBindings(
    @Query() query: ListTenantResidencyBindingsQueryDto,
  ): Promise<TenantResidencyBindingPageDto> {
    return this.collections.listTenantResidencyBindings(query);
  }

  /** V11-17: listar evaluaciones de carga de trabajo del tenant. */
  @Get('admin/governance/workload-assessments')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar evaluaciones de carga de trabajo del tenant',
  })
  @ApiOkResponse({ type: WorkloadAssessmentPageDto })
  listWorkloadAssessments(
    @Query() query: ListWorkloadAssessmentsQueryDto,
  ): Promise<WorkloadAssessmentPageDto> {
    return this.collections.listWorkloadAssessments(query);
  }

  /** V11-20: listar políticas de respaldo del tenant. */
  @Get('admin/ops/backup-policies')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar políticas de respaldo del tenant' })
  @ApiOkResponse({ type: BackupPolicyPageDto })
  listBackupPolicies(
    @Query() query: ListBackupPoliciesQueryDto,
  ): Promise<BackupPolicyPageDto> {
    return this.collections.listBackupPolicies(query);
  }
}
