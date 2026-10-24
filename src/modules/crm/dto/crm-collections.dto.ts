import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de prospectos (V49-01). */
export class LeadItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  leadSourceConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  contactId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  crmAccountId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  fullName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  interestText!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  leadScore!: string | null;

  @ApiProperty({ format: 'uuid' })
  leadStatusConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  campaignRefId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  convertedOpportunityId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  convertedAt!: Date | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de prospectos. */
export class ListLeadsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de prospectos. */
export class LeadPageDto extends pageResponseOf(LeadItemDto, 'LeadPageDto') {}

/** Fila de oportunidades (V49-02). */
export class OpportunityItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  pipelineId!: string;

  @ApiProperty({ format: 'uuid' })
  stageId!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  crmAccountId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  primaryContactId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  amount!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currencyConceptId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  expectedCloseDate!: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  probabilityPercent!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  contractId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  salesOrderId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  lostReasonConceptId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  wonAt!: Date | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de oportunidades. */
export class ListOpportunitiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de oportunidades. */
export class OpportunityPageDto extends pageResponseOf(
  OpportunityItemDto,
  'OpportunityPageDto',
) {}

/** Fila de casos de CRM (V49-03). */
export class CrmCaseItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  caseNumber!: string;

  @ApiProperty({ type: String })
  subject!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  crmAccountId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  primaryContactId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  businessPartnerId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  contractId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  invoiceId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  caseTypeConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  originConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  priorityConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentCaseId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  openedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  closedAt!: Date | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de casos de CRM. */
export class ListCasesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de casos de CRM. */
export class CrmCasePageDto extends pageResponseOf(
  CrmCaseItemDto,
  'CrmCasePageDto',
) {}

/** Fila de cuentas de CRM (V49-06). */
export class CrmAccountItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  accountTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  industryConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentAccountId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  website!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  taxId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  linkedTenantId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  businessPartnerId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  linkedOrgRefType!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  linkedOrgRefId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  annualValue!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currencyConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de cuentas de CRM. */
export class ListAccountsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de cuentas de CRM. */
export class CrmAccountPageDto extends pageResponseOf(
  CrmAccountItemDto,
  'CrmAccountPageDto',
) {}

/** Fila de actividades de CRM (V49-09). */
export class CrmActivityItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  activityTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  subjectTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  subjectRefId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  contactId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  crmAccountId!: string | null;

  @ApiProperty({ format: 'uuid' })
  directionConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  subject!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  bodyText!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  outcomeConceptId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  dueAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de actividades de CRM. */
export class ListActivitiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de actividades de CRM. */
export class CrmActivityPageDto extends pageResponseOf(
  CrmActivityItemDto,
  'CrmActivityPageDto',
) {}

/** Fila de alianzas (V49-11). */
export class PartnershipItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  partnershipTypeConceptId!: string;

  @ApiProperty({ type: String })
  partnerRefType!: string;

  @ApiProperty({ format: 'uuid' })
  partnerRefId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  crmAccountId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  adPartnerId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  contractId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tierConceptId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  revenueSharePercent!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  startDate!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  endDate!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de alianzas. */
export class ListPartnershipsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de alianzas. */
export class PartnershipPageDto extends pageResponseOf(
  PartnershipItemDto,
  'PartnershipPageDto',
) {}
