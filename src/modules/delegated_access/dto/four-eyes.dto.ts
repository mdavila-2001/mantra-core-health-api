import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Pide la aprobación de una acción sensible (CONTRATO-GOBIERNO §6.5 paso 1). */
export class CreateSupportApprovalDto {
  @ApiProperty({ format: 'uuid', description: 'Organización donde se actúa.' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: 'agenda.appointment.cancel' })
  @IsString()
  @MaxLength(80)
  atom!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practitionerRoleAssignmentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Hora de la cita sobre la que se actúa.',
  })
  @IsOptional()
  @IsDateString()
  appointmentStartAt?: string;

  @ApiProperty({
    minLength: 10,
    description: 'Por qué se necesita (lo ve quien aprueba).',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reasonText!: string;
}

export class DecideApprovalDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT'] })
  @IsIn(['APPROVE', 'REJECT'])
  decision!: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional({
    description: 'Obligatorio al rechazar (al menos 5 caracteres).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

/** Un permiso del catálogo tal como lo ve quien aprueba un cambio de permisos. */
export class GrantChangeAtomViewDto {
  @ApiProperty({ example: 'billing.receipt.void' }) code!: string;
  @ApiProperty({ example: 'Anular comprobantes' }) name!: string;
  @ApiProperty({ description: 'Sensibilidad CRÍTICA (cuatro ojos).' })
  critical!: boolean;
}

/** A qué doctor, servicio y espacio apunta el permiso que se aprueba (solo nombres de personal y lugares, nunca de pacientes). */
export class GrantChangeTargetViewDto {
  @ApiProperty({
    enum: [
      'PRACTITIONER',
      'SERVICE',
      'LOCATION',
      'PRACTITIONER_SERVICE',
      'PRACTITIONER_LOCATION',
      'SERVICE_LOCATION',
      'ALL_PRACTITIONERS',
      'ALL_SERVICES',
      'ALL_LOCATIONS',
      'ALL',
    ],
  })
  kind!: string;
  @ApiProperty({ enum: ['DYNAMIC', 'FIXED'] }) expansionMode!: string;
  @ApiPropertyOptional() practitionerName?: string;
  @ApiPropertyOptional() serviceName?: string;
  @ApiPropertyOptional() locationName?: string;
}

/**
 * Lo que ejecutará la aprobación de un `GRANT_CHANGE`, completo y sin datos de
 * pacientes: todos los permisos (los críticos marcados), el objetivo, la
 * vigencia y las condiciones del permiso RESULTANTE. Solo lo ve quien puede
 * decidir (`GET /approvals/pending`).
 */
export class GrantChangeDetailsDto {
  @ApiProperty({ enum: ['ADD', 'UPDATE'] }) op!: string;
  @ApiProperty({
    type: [String],
    description:
      'Por qué pide aprobación: NEW_CRITICAL_ATOMS, SCOPE_WIDENED o VALIDITY_EXTENDED.',
  })
  reasons!: string[];
  @ApiProperty({ type: [GrantChangeAtomViewDto] })
  atoms!: GrantChangeAtomViewDto[];
  @ApiProperty({ type: [GrantChangeAtomViewDto] })
  criticalAtoms!: GrantChangeAtomViewDto[];
  @ApiProperty({ type: GrantChangeTargetViewDto })
  target!: GrantChangeTargetViewDto;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  validFrom?: string;
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Ausente = sin fin de vigencia.',
  })
  validTo?: string;
  @ApiProperty({
    type: [String],
    description: 'Condiciones en lenguaje simple; vacío = sin condiciones.',
  })
  conditions!: string[];
  @ApiPropertyOptional({
    type: [String],
    description:
      'Solo en `UPDATE`: qué campos cambia (actions, validTo, expansionMode, condition, actionConditions).',
  })
  changes?: string[];
}

export class SupportApprovalViewDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({
    enum: [
      'ACTION',
      'GRANT_CHANGE',
      'SOD_EXCEPTION',
      'REACTIVATION',
      'ENGAGEMENT_MOVE',
    ],
  })
  kind!: string;
  @ApiProperty({
    enum: [
      'PENDING',
      'APPROVED',
      'REJECTED',
      'EXPIRED',
      'CANCELLED',
      'EXECUTED',
    ],
  })
  status!: string;
  @ApiProperty({ enum: ['DOCTOR', 'SERVICE_HEAD', 'SECOND_APPROVER'] })
  approverKind!: string;
  @ApiPropertyOptional() atom?: string;
  @ApiPropertyOptional({ format: 'uuid' }) requesterUserId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) subjectUserId?: string;
  @ApiPropertyOptional() reasonText?: string;
  @ApiPropertyOptional() decisionComment?: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: Date;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  approvedUntil?: Date;
  @ApiPropertyOptional({ type: String, format: 'date-time' }) decidedAt?: Date;
  @ApiPropertyOptional({ type: String, format: 'date-time' }) consumedAt?: Date;
  @ApiProperty({
    description: 'Resumen en lenguaje simple de lo que se aprueba.',
  })
  summary!: string;
  @ApiPropertyOptional({
    type: GrantChangeDetailsDto,
    description:
      'Solo en `GET /approvals/pending` y solo para `GRANT_CHANGE`: el permiso completo que se otorgaría al aprobar.',
  })
  details?: GrantChangeDetailsDto;
}

export class ListSupportApprovalsResponseDto {
  @ApiProperty({ type: [SupportApprovalViewDto] })
  items!: SupportApprovalViewDto[];
  @ApiProperty() count!: number;
  /** Cursor para pedir la página siguiente (solo `GET /approvals/pending`, si hay más). */
  @ApiPropertyOptional() nextCursor?: string;
}

/** Consulta de `GET /approvals/pending`: tamaño de página y cursor. */
export class ListPendingApprovalsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: '`nextCursor` de la página anterior.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;
}

/** Resultado de crear una solicitud (`201`): lo mínimo para auditar sin leer la fila. */
export class SupportApprovalCreatedDto extends SupportApprovalViewDto {}

export class DecideApprovalResponseDto {
  @ApiProperty({ type: SupportApprovalViewDto })
  approval!: SupportApprovalViewDto;
  @ApiPropertyOptional({
    description:
      'Lo que ejecutó la aprobación (solo cambios administrativos), con identificadores.',
    type: 'object',
    additionalProperties: true,
  })
  execution?: Record<string, unknown>;
}
