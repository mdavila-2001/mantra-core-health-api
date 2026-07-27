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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ACCOUNT_TYPES })
  @IsIn(ACCOUNT_TYPES as readonly string[])
  accountType!: AccountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @ApiPropertyOptional({ description: 'Identificación fiscal' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({ description: 'Cuenta matriz', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentAccountId?: string;

  @ApiPropertyOptional({
    description: 'Contacto principal a crear junto con la cuenta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  primaryContactFirstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  primaryContactLastName?: string;
}

export class AccountResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Contacto creado junto con la cuenta',
    format: 'uuid',
  })
  primaryContactId?: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /crm/accounts/{id}/team-members` (UC-49-02). */
export class AddTeamMemberDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Rol en el equipo de cuenta',
    enum: ['OWNER', 'MEMBER'],
  })
  @IsIn(['OWNER', 'MEMBER'])
  teamRole!: 'OWNER' | 'MEMBER';

  @ApiPropertyOptional({
    description: 'Nivel de acceso',
    enum: ['READ', 'WRITE'],
  })
  @IsOptional()
  @IsIn(['READ', 'WRITE'])
  accessLevel?: 'READ' | 'WRITE';
}

export class TeamMemberResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ enum: ['OWNER', 'MEMBER'] })
  teamRole!: 'OWNER' | 'MEMBER';
}

/** Origen del lead. */
export type LeadSource = 'WEB' | 'REFERRAL' | 'CAMPAIGN';

/** Cuerpo de `POST /crm/leads` (UC-49-03). */
export class CreateLeadDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ enum: ['WEB', 'REFERRAL', 'CAMPAIGN'] })
  @IsIn(['WEB', 'REFERRAL', 'CAMPAIGN'])
  source!: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: 'Interés declarado' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  interestText?: string;
}

/** Cuerpo de `PATCH /crm/leads/{id}/qualify` (UC-49-03). */
export class QualifyLeadDto {
  @ApiProperty({
    description: 'Puntuación del lead (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  leadScore!: number;

  @ApiProperty({
    description: 'true si el lead queda calificado; false lo descarta',
  })
  @IsBoolean()
  qualified!: boolean;
}

export class LeadResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  leadStatusConceptId!: string;

  @ApiPropertyOptional()
  leadScore?: number;
}

/** Cuerpo de `POST /crm/leads/{id}/convert` (UC-49-04). */
export class ConvertLeadDto {
  @ApiProperty({
    description: 'Pipeline en el que nace la oportunidad',
    format: 'uuid',
  })
  @IsUUID()
  pipelineId!: string;

  @ApiProperty({ description: 'Etapa inicial', format: 'uuid' })
  @IsUUID()
  stageId!: string;

  @ApiProperty({ description: 'Nombre de la oportunidad', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  opportunityName!: string;

  @ApiPropertyOptional({
    description: 'Cuenta a la que se asocia',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  crmAccountId?: string;

  @ApiPropertyOptional({ example: '15000.00' })
  @IsOptional()
  @IsNumberString()
  amount?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  expectedCloseDate?: string;
}

export class ConvertLeadResponseDto {
  @ApiProperty({ format: 'uuid' })
  leadId!: string;

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ enum: ACTIVITY_TYPES })
  @IsIn(ACTIVITY_TYPES as readonly string[])
  activityType!: ActivityType;

  @ApiProperty({
    description: 'Tipo del sujeto',
    enum: ['ACCOUNT', 'OPPORTUNITY', 'CASE'],
  })
  @IsIn(['ACCOUNT', 'OPPORTUNITY', 'CASE'])
  subjectType!: ActivitySubject;

  @ApiProperty({ description: 'Id del sujeto', format: 'uuid' })
  @IsUUID()
  subjectRefId!: string;

  @ApiProperty({ enum: ['INBOUND', 'OUTBOUND'] })
  @IsIn(['INBOUND', 'OUTBOUND'])
  direction!: 'INBOUND' | 'OUTBOUND';

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string;

  @ApiPropertyOptional({ description: 'Cuerpo o detalle de la actividad' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bodyText?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @ApiPropertyOptional({ description: 'Cuenta relacionada', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  crmAccountId?: string;

  @ApiPropertyOptional({ description: 'Contacto relacionado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contactId?: string;
}

export class ActivityResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ACTIVITY_TYPES })
  activityType!: ActivityType;

  @ApiProperty({
    description: 'true si además se creó la fila del subtipo (tarea o nota)',
  })
  subtypeCreated!: boolean;
}

/** Cuerpo de `POST /crm/opportunities/{id}/advance-stage` (UC-49-07). */
export class AdvanceStageDto {
  @ApiProperty({ description: 'Etapa destino', format: 'uuid' })
  @IsUUID()
  toStageId!: string;
}

/** Cuerpo de `POST /crm/opportunities/{id}/lose` (UC-49-09). */
export class LoseOpportunityDto {
  @ApiProperty({
    description: 'Motivo de la pérdida',
    enum: ['PRICE', 'COMPETITOR', 'NO_BUDGET'],
  })
  @IsIn(['PRICE', 'COMPETITOR', 'NO_BUDGET'])
  reason!: 'PRICE' | 'COMPETITOR' | 'NO_BUDGET';
}

export class OpportunityResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  stageId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /crm/partnerships` (UC-49-10). */
export class CreatePartnershipDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['REFERRAL', 'RESELLER'] })
  @IsIn(['REFERRAL', 'RESELLER'])
  partnershipType!: 'REFERRAL' | 'RESELLER';

  @ApiProperty({ description: 'Tipo de la entidad socia', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  partnerRefType!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  partnerRefId!: string;

  @ApiPropertyOptional({ description: 'Reparto de ingresos', example: '15.00' })
  @IsOptional()
  @IsNumberString()
  revenueSharePercent?: string;

  @ApiPropertyOptional({
    description: 'Importe comprometido del acuerdo marco',
  })
  @IsOptional()
  @IsNumberString()
  commitmentAmount?: string;
}

export class PartnershipResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Acuerdo marco creado junto con la alianza',
    format: 'uuid',
  })
  agreementId?: string;
}

/** Cuerpo de `POST /crm/cases` (UC-49-11). */
export class CreateCaseDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Número de caso, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  caseNumber!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  subject!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  crmAccountId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  primaryContactId?: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiPropertyOptional({ enum: ['PORTAL', 'PHONE', 'EMAIL'] })
  @IsOptional()
  @IsIn(['PORTAL', 'PHONE', 'EMAIL'])
  origin?: 'PORTAL' | 'PHONE' | 'EMAIL';
}

export class CaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  caseNumber!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /crm/cases/{id}/comments` (UC-49-12). */
export class AddCaseCommentDto {
  @ApiProperty({ maxLength: 4000 })
  @IsString()
  @MaxLength(4000)
  commentText!: string;

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
  @ApiProperty({ enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] })
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status!: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

  @ApiPropertyOptional({ description: 'Motivo de la transición' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

export class CaseStatusResponseDto {
  @ApiProperty({ format: 'uuid' })
  caseId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  closedAt?: string;
}

/** Cuerpo de `PATCH /crm/contacts/{id}/channels/{cid}/opt-in` (UC-49-15). */
export class ChannelOptInDto {
  @ApiProperty({
    description: 'true concede el consentimiento; false lo revoca',
  })
  @IsBoolean()
  optIn!: boolean;
}

export class ChannelOptInResponseDto {
  @ApiProperty({ format: 'uuid' })
  endpointId!: string;

  @ApiProperty({
    description: 'true cuando el canal quedó excluido de comunicaciones',
  })
  doNotContact!: boolean;
}

/** Vista 360 de la cuenta (UC-49-14). */
export class Account360ResponseDto {
  @ApiProperty({ format: 'uuid' })
  accountId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'Actividades recientes' })
  activityCount!: number;

  @ApiProperty({ description: 'Casos abiertos y recientes' })
  caseCount!: number;
}
