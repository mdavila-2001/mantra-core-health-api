import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SUPPORT_PERMISSION_INPUT_CODES } from '../domain';
import { SupportTargetDto } from './support-target.dto';

const IDENTITY_METHODS = ['IN_PERSON', 'DOCUMENT_UPLOAD'] as const;
const SUSPENSION_REASONS = [
  'MANUAL',
  'LEAVE',
  'INVESTIGATION',
  'INACTIVITY',
] as const;
const CASE_KINDS = [
  'JOINER',
  'MOVER',
  'LEAVER',
  'SUSPENSION',
  'REACTIVATION',
] as const;
const CASE_STATUSES = ['OPEN', 'COMPLETED', 'CANCELLED'] as const;
const EXPANSION_MODES = ['DYNAMIC', 'FIXED'] as const;

/** Cuerpo de `POST /org/support-engagements/:id/identity-verification`. */
export class IdentityVerificationDto {
  /** Cómo se verificó la identidad (la verificación de plataforma es automática). */
  @ApiProperty({ enum: IDENTITY_METHODS })
  @IsIn(IDENTITY_METHODS)
  method!: (typeof IDENTITY_METHODS)[number];

  /** Nota del administrador, sin datos del documento. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Cuerpo de `PUT /org/support-engagements/:id/owner`. */
export class PutOwnerDto {
  /** Nuevo dueño de la cuenta. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  supervisorUserId!: string;

  /** Nota. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Cuerpo de `POST /org/lifecycle/cases/:id/checklist/:code`. */
export class CompleteChecklistItemDto {
  /** Nota al marcar el ítem. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Consulta de `GET /org/lifecycle/cases`. */
export class ListLifecycleCasesQueryDto {
  /** Solo este tipo de caso. */
  @ApiPropertyOptional({ enum: CASE_KINDS })
  @IsOptional()
  @IsIn(CASE_KINDS)
  kind?: (typeof CASE_KINDS)[number];

  /** Solo este estado. */
  @ApiPropertyOptional({ enum: CASE_STATUSES })
  @IsOptional()
  @IsIn(CASE_STATUSES)
  status?: (typeof CASE_STATUSES)[number];
}

/** Una concesión del conjunto completo de un cambio de rol. */
export class MoveGrantDto extends SupportTargetDto {
  /** Átomos (o códigos antiguos) del permiso. */
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(80)
  @IsIn(SUPPORT_PERMISSION_INPUT_CODES, { each: true })
  actions!: string[];

  /** `ALLOW` (por defecto) o `DENY`. */
  @ApiPropertyOptional({ enum: ['ALLOW', 'DENY'] })
  @IsOptional()
  @IsIn(['ALLOW', 'DENY'])
  effect?: 'ALLOW' | 'DENY';

  /** Condición ABAC de toda la concesión (esquema versionado). */
  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;

  /** `DYNAMIC` sigue a la estructura; `FIXED` congela lo que cubre hoy. */
  @ApiPropertyOptional({ enum: EXPANSION_MODES })
  @IsOptional()
  @IsIn(EXPANSION_MODES)
  expansionMode?: (typeof EXPANSION_MODES)[number];

  /** Inicio de vigencia. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /** Fin de vigencia. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Cuerpo de `POST /org/support-engagements/:id/move`: el conjunto COMPLETO nuevo. */
export class MoveEngagementDto {
  /** Motivo del cambio. */
  @ApiProperty({ minLength: 3, maxLength: 500 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;

  /** Desde cuándo rige; por defecto, ahora. Lo anterior vence en ese instante. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  effectiveAt?: string;

  /** Plantilla nueva; sin ella se conserva la actual. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  newTemplateCode?: string;

  /** Dueño de la cuenta tras el cambio. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supervisorUserId?: string;

  /** Conjunto completo de concesiones; lo que no figure aquí vence en `effectiveAt`. */
  @ApiProperty({ type: [MoveGrantDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MoveGrantDto)
  grants!: MoveGrantDto[];

  /**
   * Token de la simulación que el administrador vio (`POST /org/access/simulate` con el mismo
   * conjunto completo, `mode: 'REPLACE'`, y la misma plantilla): si lo que se mueve es otra
   * cosa, o pasaron más de 10 minutos, responde 409 `SIMULATION_STALE`.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  simulationToken?: string;
}

/** Cuerpo de traspaso: a quién pasa cada cosa. */
export class HandoverDto {
  /** Destinatario por defecto de conversaciones, tareas y citas pendientes. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  defaultToUserId?: string;

  /** Destinatario de ítems concretos. */
  @ApiPropertyOptional({ type: () => HandoverItemTargetDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => HandoverItemTargetDto)
  items?: HandoverItemTargetDto[];

  /** Nuevo dueño de las cuentas que supervisaba la persona. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  supervisedTo?: string;
}

/** Destinatario de un ítem de traspaso. */
export class HandoverItemTargetDto {
  /** Id del objeto a traspasar (el que da la vista previa). */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;

  /** Quien lo recibe. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  toUserId!: string;
}

/** Cuerpo de `POST …/offboard`. */
export class OffboardEngagementDto {
  /** Motivo de la baja. */
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;

  /** Traspaso; `null` = baja inmediata y traspaso pendiente en el caso abierto. */
  @ApiPropertyOptional({ type: HandoverDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => HandoverDto)
  handover?: HandoverDto | null;
}

/** Cuerpo de `POST /org/lifecycle/cases/:id/handover/assign`. */
export class AssignHandoverDto extends HandoverDto {}

/** Cuerpo de `POST …/suspend`. */
export class SuspendEngagementDto {
  /** Motivo de la suspensión. */
  @ApiProperty({ enum: SUSPENSION_REASONS })
  @IsIn(SUSPENSION_REASONS)
  reasonCode!: (typeof SUSPENSION_REASONS)[number];

  /** Nota. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Cuerpo de `POST …/reactivate`. */
export class ReactivateEngagementDto {
  /** Motivo de la reactivación. */
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

/** Un ítem de la lista de verificación de un caso. */
export class ChecklistItemViewDto {
  /** Código estable del ítem. */
  @ApiProperty() code!: string;
  /** Texto para la persona. */
  @ApiProperty() label!: string;
  /** ¿Bloquea completar el caso? */
  @ApiProperty() required!: boolean;
  /** `AUTOMATIC`, `MANUAL` o `EITHER`. */
  @ApiProperty() completion!: string;
  /** `PENDING`, `DONE` o `NOT_APPLICABLE`. */
  @ApiProperty() status!: string;
  /** Cuándo se completó. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  completedAt?: Date;
  /** Solo `DOCTOR_ACCEPTANCES`: cuántos doctores faltan. */
  @ApiPropertyOptional() pendingCount?: number;
}

/** Una fila del registro de traspaso. */
export class HandoverItemViewDto {
  /** Id de la fila. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** `CONVERSATION`, `WORKFLOW_TASK`, `SUPERVISED_ENGAGEMENT` o `PENDING_BOOKING`. */
  @ApiProperty() kind!: string;
  /** Objeto traspasado. */
  @ApiProperty({ format: 'uuid' }) sourceId!: string;
  /** De quién. */
  @ApiProperty({ format: 'uuid' }) fromUserId!: string;
  /** A quién; ausente si volvió a la bandeja común. */
  @ApiPropertyOptional({ format: 'uuid' }) toUserId?: string;
  /** `PENDING`, `REASSIGNED`, `RETURNED_TO_POOL` o `CLOSED`. */
  @ApiProperty() status!: string;
  /** Cuándo se reasignó. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  reassignedAt?: Date;
  /** Quién reasignó. */
  @ApiPropertyOptional({ format: 'uuid' }) reassignedByUserId?: string;
}

/** Resumen de un caso de ciclo de vida. */
export class LifecycleCaseSummaryDto {
  /** Id del caso. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Tipo de caso. */
  @ApiProperty({ enum: CASE_KINDS }) kind!: string;
  /** Estado del caso. */
  @ApiProperty({ enum: CASE_STATUSES }) status!: string;
  /** Vínculo del caso. */
  @ApiProperty({ format: 'uuid' }) engagementId!: string;
  /** Persona del caso. */
  @ApiProperty({ format: 'uuid' }) subjectUserId!: string;
  /** Quien abrió el caso; ausente si lo abrió el sistema. */
  @ApiPropertyOptional({ format: 'uuid' }) openedByUserId?: string;
  /** Apertura. */
  @ApiProperty({ type: String, format: 'date-time' }) openedAt!: Date;
  /** Fecha límite. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) dueAt?: Date;
  /** Cierre. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  completedAt?: Date;
}

/** Detalle de un caso: lista de verificación y traspasos. */
export class LifecycleCaseDetailDto extends LifecycleCaseSummaryDto {
  /** Motivo. */
  @ApiPropertyOptional() reason?: string;
  /** Lista de verificación. */
  @ApiProperty({ type: [ChecklistItemViewDto] })
  checklist!: ChecklistItemViewDto[];
  /** Registro de traspaso. */
  @ApiProperty({ type: [HandoverItemViewDto] })
  handover!: HandoverItemViewDto[];
}

/** Lista de casos. */
export class ListLifecycleCasesResponseDto {
  /** Casos. */
  @ApiProperty({ type: [LifecycleCaseSummaryDto] })
  items!: LifecycleCaseSummaryDto[];
  /** Cantidad. */
  @ApiProperty() count!: number;
}

/** Registro de transferencia exportable. */
export class LifecycleCaseExportDto {
  /** El caso con su lista y sus traspasos. */
  @ApiProperty({ type: LifecycleCaseDetailDto }) case!: LifecycleCaseDetailDto;
  /** Cuándo se exportó. */
  @ApiProperty({ type: String, format: 'date-time' }) exportedAt!: Date;
  /** SHA-256 hexadecimal del contenido. */
  @ApiProperty() sha256!: string;
}

/** Compromiso de confidencialidad aceptado por la propia persona. */
export class ConfidentialityAckResultDto {
  /** Siempre `true`. */
  @ApiProperty() ok!: boolean;
  /** Organización del vínculo (para el sello de auditoría). */
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  /** Cuándo aceptó. */
  @ApiProperty({ type: String, format: 'date-time' }) acknowledgedAt!: Date;
}

/** Un trabajo que la persona tiene en las manos (vista previa de la baja). */
export class HandoverPreviewItemDto {
  /** Id del objeto (conversación, tarea, cuenta o cita). */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Tipo de trabajo. */
  @ApiProperty() kind!: string;
}

/** Vista previa de lo que la persona tiene en las manos. */
export class HandoverPreviewDto {
  /** Vínculo. */
  @ApiProperty({ format: 'uuid' }) engagementId!: string;
  /** Trabajos por tipo, sin datos del paciente. */
  @ApiProperty({ type: [HandoverPreviewItemDto] })
  items!: HandoverPreviewItemDto[];
  /** Cantidad por tipo. */
  @ApiProperty({ type: Object }) counts!: Record<string, number>;
}

/** Resultado del cambio de rol. */
export class MoveResultDto {
  /** `EXECUTED` o `PENDING_APPROVAL` (cuatro ojos). */
  @ApiProperty({ enum: ['EXECUTED', 'PENDING_APPROVAL'] }) status!: string;
  /** Solicitud de cuatro ojos, si la hay. */
  @ApiPropertyOptional({ format: 'uuid' }) approvalId?: string;
  /** Vencimiento de la solicitud pendiente. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) expiresAt?: Date;
  /** Puntaje de privilegios antes. */
  @ApiProperty() scoreBefore!: number;
  /** Puntaje de privilegios después. */
  @ApiProperty() scoreAfter!: number;
  /** Diferencia. */
  @ApiProperty() delta!: number;
  /** Por qué pide cuatro ojos. */
  @ApiProperty({ type: [String] }) fourEyesReasons!: string[];
  /** Concesiones creadas. */
  @ApiPropertyOptional({ type: [String] }) grantIds?: string[];
  /** Concesiones que vencieron. */
  @ApiPropertyOptional({ type: [String] }) revokedGrantIds?: string[];
  /** Campaña `MOVER` abierta. */
  @ApiPropertyOptional({ format: 'uuid' }) campaignId?: string;
  /** Caso de ciclo de vida. */
  @ApiPropertyOptional({ format: 'uuid' }) caseId?: string;
}

/** Resultado de reactivar o suspender. */
export class SuspensionResultDto {
  /** `true` si la suspensión quedó firme. */
  @ApiPropertyOptional() ok?: boolean;
  /** `PENDING_APPROVAL` al pedir la reactivación. */
  @ApiPropertyOptional() status?: string;
  /** Solicitud de cuatro ojos. */
  @ApiPropertyOptional({ format: 'uuid' }) approvalId?: string;
  /** Vencimiento de la solicitud. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) expiresAt?: Date;
  /** Caso de ciclo de vida. */
  @ApiPropertyOptional({ format: 'uuid' }) caseId?: string;
}

/** Estado del traspaso al dar de baja. */
export class OffboardHandoverStatusDto {
  /** `COMPLETED`, `PENDING` (a propósito) o `FAILED` (la baja ya es firme). */
  @ApiProperty({ enum: ['COMPLETED', 'PENDING', 'FAILED'] }) status!: string;
  /** Cuántos trabajos quedan pendientes. */
  @ApiProperty() pending!: number;
}

/** Resultado de dar de baja con traspaso. */
export class OffboardResultDto {
  /** Siempre `true`: la baja es firme antes de reasignar. */
  @ApiProperty() ok!: boolean;
  /** Vínculo. */
  @ApiProperty({ format: 'uuid' }) engagementId!: string;
  /** Cuándo quedó firme la revocación. */
  @ApiProperty({ type: String, format: 'date-time' }) revokedAt!: Date;
  /** Caso de baja. */
  @ApiPropertyOptional({ format: 'uuid' }) caseId?: string;
  /** Estado del traspaso. */
  @ApiProperty({ type: OffboardHandoverStatusDto })
  handover!: OffboardHandoverStatusDto;
}

/** Resultado de asignar los traspasos pendientes de un caso. */
export class AssignHandoverResultDto {
  /** Caso. */
  @ApiProperty({ format: 'uuid' }) caseId!: string;
  /** Estado del traspaso. */
  @ApiProperty({ type: OffboardHandoverStatusDto })
  handover!: OffboardHandoverStatusDto;
}
