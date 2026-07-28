import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Tipo de cuenta comercial. */
export type AccountType = 'CUSTOMER' | 'PROSPECT' | 'PARTNER';
export const ACCOUNT_TYPES: readonly AccountType[] = [
  'CUSTOMER',
  'PROSPECT',
  'PARTNER',
];

/** Cuerpo de `POST /crm/accounts` (UC-49-01). */
export class CreateAccountDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de account type mantenido por la instancia.
   */
  @ApiProperty({ enum: ACCOUNT_TYPES })
  @IsIn(ACCOUNT_TYPES as readonly string[])
  accountType!: AccountType;

  /**
   * Valor de website mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  /**
   * Identificador asociado a tax.
   */
  @ApiPropertyOptional({ description: 'Identificación fiscal' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  /**
   * Identificador asociado a parent account.
   */
  @ApiPropertyOptional({ description: 'Cuenta matriz', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentAccountId?: string;

  /**
   * Valor de primary contact first name mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Contacto principal a crear junto con la cuenta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  primaryContactFirstName?: string;

  /**
   * Valor de primary contact last name mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  primaryContactLastName?: string;
}

/**
 * Define el contrato validado para account response.
 */
export class AccountResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Identificador asociado a primary contact.
   */
  @ApiPropertyOptional({
    description: 'Contacto creado junto con la cuenta',
    format: 'uuid',
  })
  primaryContactId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /crm/accounts/{id}/team-members` (UC-49-02). */
export class AddTeamMemberDto {
  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  /**
   * Valor de team role mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Rol en el equipo de cuenta',
    enum: ['OWNER', 'MEMBER'],
  })
  @IsIn(['OWNER', 'MEMBER'])
  teamRole!: 'OWNER' | 'MEMBER';

  /**
   * Valor de access level mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nivel de acceso',
    enum: ['READ', 'WRITE'],
  })
  @IsOptional()
  @IsIn(['READ', 'WRITE'])
  accessLevel?: 'READ' | 'WRITE';
}

/**
 * Define el contrato validado para team member response.
 */
export class TeamMemberResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /**
   * Valor de team role mantenido por la instancia.
   */
  @ApiProperty({ enum: ['OWNER', 'MEMBER'] })
  teamRole!: 'OWNER' | 'MEMBER';
}

/** Origen del lead. */
export type LeadSource = 'WEB' | 'REFERRAL' | 'CAMPAIGN';

/** Cuerpo de `POST /crm/leads` (UC-49-03). */
export class CreateLeadDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de source mantenido por la instancia.
   */
  @ApiProperty({ enum: ['WEB', 'REFERRAL', 'CAMPAIGN'] })
  @IsIn(['WEB', 'REFERRAL', 'CAMPAIGN'])
  source!: LeadSource;

  /**
   * Valor de full name mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  /**
   * Valor de email mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string;

  /**
   * Valor de phone mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  /**
   * Valor de interest text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Interés declarado' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  interestText?: string;
}

/** Cuerpo de `PATCH /crm/leads/{id}/qualify` (UC-49-03). */
export class QualifyLeadDto {
  /**
   * Valor de lead score mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Puntuación del lead (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  leadScore!: number;

  /**
   * Valor de qualified mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si el lead queda calificado; false lo descarta',
  })
  @IsBoolean()
  qualified!: boolean;
}

/**
 * Define el contrato validado para lead response.
 */
export class LeadResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a lead status concept.
   */
  @ApiProperty({ format: 'uuid' })
  leadStatusConceptId!: string;

  /**
   * Valor de lead score mantenido por la instancia.
   */
  @ApiPropertyOptional()
  leadScore?: number;
}

/** Cuerpo de `POST /crm/leads/{id}/convert` (UC-49-04). */
export class ConvertLeadDto {
  /**
   * Identificador asociado a pipeline.
   */
  @ApiProperty({
    description: 'Pipeline en el que nace la oportunidad',
    format: 'uuid',
  })
  @IsUUID()
  pipelineId!: string;

  /**
   * Identificador asociado a stage.
   */
  @ApiProperty({ description: 'Etapa inicial', format: 'uuid' })
  @IsUUID()
  stageId!: string;

  /**
   * Valor de opportunity name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre de la oportunidad', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  opportunityName!: string;

  /**
   * Identificador asociado a crm account.
   */
  @ApiPropertyOptional({
    description: 'Cuenta a la que se asocia',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  crmAccountId?: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '15000.00' })
  @IsOptional()
  @IsNumberString()
  amount?: string;

  /**
   * Valor de expected close date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  expectedCloseDate?: string;
}

/**
 * Define el contrato validado para convert lead response.
 */
export class ConvertLeadResponseDto {
  /**
   * Identificador asociado a lead.
   */
  @ApiProperty({ format: 'uuid' })
  leadId!: string;

  /**
   * Identificador asociado a opportunity.
   */
  @ApiProperty({ format: 'uuid' })
  opportunityId!: string;
}

/** Tipo de actividad comercial. */
export type ActivityType = 'TASK' | 'EVENT' | 'EMAIL' | 'CALL' | 'NOTE';
export const ACTIVITY_TYPES: readonly ActivityType[] = [
  'TASK',
  'EVENT',
  'EMAIL',
  'CALL',
  'NOTE',
];

/** Sujeto polimórfico al que se asocia la actividad. */
export type ActivitySubject = 'ACCOUNT' | 'OPPORTUNITY' | 'CASE';

/** Cuerpo de `POST /crm/activities` (UC-49-05 y UC-49-06). */
export class CreateActivityDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de activity type mantenido por la instancia.
   */
  @ApiProperty({ enum: ACTIVITY_TYPES })
  @IsIn(ACTIVITY_TYPES as readonly string[])
  activityType!: ActivityType;

  /**
   * Valor de subject type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo del sujeto',
    enum: ['ACCOUNT', 'OPPORTUNITY', 'CASE'],
  })
  @IsIn(['ACCOUNT', 'OPPORTUNITY', 'CASE'])
  subjectType!: ActivitySubject;

  /**
   * Identificador asociado a subject ref.
   */
  @ApiProperty({ description: 'Id del sujeto', format: 'uuid' })
  @IsUUID()
  subjectRefId!: string;

  /**
   * Valor de direction mantenido por la instancia.
   */
  @ApiProperty({ enum: ['INBOUND', 'OUTBOUND'] })
  @IsIn(['INBOUND', 'OUTBOUND'])
  direction!: 'INBOUND' | 'OUTBOUND';

  /**
   * Valor de subject mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string;

  /**
   * Valor de body text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cuerpo o detalle de la actividad' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bodyText?: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  /**
   * Identificador asociado a crm account.
   */
  @ApiPropertyOptional({ description: 'Cuenta relacionada', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  crmAccountId?: string;

  /**
   * Identificador asociado a contact.
   */
  @ApiPropertyOptional({ description: 'Contacto relacionado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contactId?: string;
}

/**
 * Define el contrato validado para activity response.
 */
export class ActivityResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de activity type mantenido por la instancia.
   */
  @ApiProperty({ enum: ACTIVITY_TYPES })
  activityType!: ActivityType;

  /**
   * Valor de subtype created mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si además se creó la fila del subtipo (tarea o nota)',
  })
  subtypeCreated!: boolean;
}

/** Cuerpo de `POST /crm/opportunities/{id}/advance-stage` (UC-49-07). */
export class AdvanceStageDto {
  /**
   * Identificador asociado a to stage.
   */
  @ApiProperty({ description: 'Etapa destino', format: 'uuid' })
  @IsUUID()
  toStageId!: string;
}

/** Cuerpo de `POST /crm/opportunities/{id}/lose` (UC-49-09). */
export class LoseOpportunityDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Motivo de la pérdida',
    enum: ['PRICE', 'COMPETITOR', 'NO_BUDGET'],
  })
  @IsIn(['PRICE', 'COMPETITOR', 'NO_BUDGET'])
  reason!: 'PRICE' | 'COMPETITOR' | 'NO_BUDGET';
}

/**
 * Define el contrato validado para opportunity response.
 */
export class OpportunityResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a stage.
   */
  @ApiProperty({ format: 'uuid' })
  stageId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /crm/partnerships` (UC-49-10). */
export class CreatePartnershipDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de partnership type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['REFERRAL', 'RESELLER'] })
  @IsIn(['REFERRAL', 'RESELLER'])
  partnershipType!: 'REFERRAL' | 'RESELLER';

  /**
   * Valor de partner ref type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo de la entidad socia', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  partnerRefType!: string;

  /**
   * Identificador asociado a partner ref.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  partnerRefId!: string;

  /**
   * Valor de revenue share percent mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Reparto de ingresos', example: '15.00' })
  @IsOptional()
  @IsNumberString()
  revenueSharePercent?: string;

  /**
   * Valor de commitment amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Importe comprometido del acuerdo marco',
  })
  @IsOptional()
  @IsNumberString()
  commitmentAmount?: string;
}

/**
 * Define el contrato validado para partnership response.
 */
export class PartnershipResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Identificador asociado a agreement.
   */
  @ApiPropertyOptional({
    description: 'Acuerdo marco creado junto con la alianza',
    format: 'uuid',
  })
  agreementId?: string;
}

/** Cuerpo de `POST /crm/cases` (UC-49-11). */
export class CreateCaseDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de case number mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Número de caso, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  caseNumber!: string;

  /**
   * Valor de subject mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  subject!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  /**
   * Identificador asociado a crm account.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  crmAccountId?: string;

  /**
   * Identificador asociado a primary contact.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  primaryContactId?: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  /**
   * Valor de origin mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ['PORTAL', 'PHONE', 'EMAIL'] })
  @IsOptional()
  @IsIn(['PORTAL', 'PHONE', 'EMAIL'])
  origin?: 'PORTAL' | 'PHONE' | 'EMAIL';
}

/**
 * Define el contrato validado para case response.
 */
export class CaseResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de case number mantenido por la instancia.
   */
  @ApiProperty()
  caseNumber!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /crm/cases/{id}/comments` (UC-49-12). */
export class AddCaseCommentDto {
  /**
   * Valor de comment text mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 4000 })
  @IsString()
  @MaxLength(4000)
  commentText!: string;

  /**
   * Valor de is public mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'false para notas internas',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

/** Cuerpo de `PATCH /crm/cases/{id}/status` (UC-49-12). */
export class ChangeCaseStatusDto {
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] })
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status!: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo de la transición' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

/**
 * Define el contrato validado para case status response.
 */
export class CaseStatusResponseDto {
  /**
   * Identificador asociado a case.
   */
  @ApiProperty({ format: 'uuid' })
  caseId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de closed at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  closedAt?: string;
}

/** Cuerpo de `PATCH /crm/contacts/{id}/channels/{cid}/opt-in` (UC-49-15). */
export class ChannelOptInDto {
  /**
   * Valor de opt in mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true concede el consentimiento; false lo revoca',
  })
  @IsBoolean()
  optIn!: boolean;
}

/**
 * Define el contrato validado para channel opt in response.
 */
export class ChannelOptInResponseDto {
  /**
   * Identificador asociado a endpoint.
   */
  @ApiProperty({ format: 'uuid' })
  endpointId!: string;

  /**
   * Valor de do not contact mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true cuando el canal quedó excluido de comunicaciones',
  })
  doNotContact!: boolean;
}

/** Vista 360 de la cuenta (UC-49-14). */
export class Account360ResponseDto {
  /**
   * Identificador asociado a account.
   */
  @ApiProperty({ format: 'uuid' })
  accountId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Valor de activity count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Actividades recientes' })
  activityCount!: number;

  /**
   * Valor de case count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Casos abiertos y recientes' })
  caseCount!: number;
}
