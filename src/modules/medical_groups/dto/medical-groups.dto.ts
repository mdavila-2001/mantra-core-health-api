import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Mismo patrón que `billing.service-catalog`: sin signo, hasta dos decimales. */
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
const PRICE_PATTERN_MESSAGE =
  'El pago acordado debe ser un número positivo con hasta dos decimales';

/** Un cargo/función a invitar al grupo, con su pago acordado (AC-21-10). */
export class MedicalGroupMemberInputDto {
  @ApiProperty({
    description: 'Profesional invitado a este cargo',
    format: 'uuid',
  })
  @IsUUID()
  practitionerProfileId!: string;

  @ApiProperty({
    description: 'Cargo/función dentro del grupo (p. ej. "Anestesiólogo")',
  })
  @IsString()
  @MaxLength(120)
  roleTitle!: string;

  @ApiProperty({ example: '500.00' })
  @IsNumberString()
  @Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })
  agreedPaymentAmount!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  agreedPaymentCurrencyConceptId?: string;

  @ApiPropertyOptional({
    description:
      'Adicionales de términos y condiciones opcionales para este cargo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  additionalTermsText?: string;
}

/** Cuerpo de `POST /medical-groups`. */
export class CreateMedicalGroupDto {
  @ApiProperty({ format: 'uuid', description: 'billing.service_catalog' })
  @IsUUID()
  serviceCatalogId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'profiles.patient_profiles',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'clinical.conditions' })
  @IsOptional()
  @IsUUID()
  conditionId?: string;

  @ApiProperty({ description: 'Fecha y hora de realización, ISO 8601' })
  @IsDateString()
  scheduledAt!: string;

  @ApiProperty({ description: 'Lugar de realización' })
  @IsString()
  @MaxLength(300)
  locationText!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notesText?: string;

  @ApiPropertyOptional({
    description:
      'Adicionales de términos y condiciones del solicitante, sobre el default del servicio',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  additionalTermsText?: string;

  @ApiProperty({
    type: [MedicalGroupMemberInputDto],
    description:
      'El resto del equipo (cargo/función + pago). El creador se agrega solo como miembro aceptado.',
  })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => MedicalGroupMemberInputDto)
  members!: MedicalGroupMemberInputDto[];
}

/** Cuerpo de `POST /medical-groups/:id/reschedule-requests`. */
export class RequestMedicalGroupRescheduleDto {
  @ApiProperty({ description: 'Nueva fecha propuesta, ISO 8601' })
  @IsDateString()
  proposedAt!: string;
}

/** Cuerpo de `POST /medical-groups/:id/reschedule-requests/respond`. */
export class RespondMedicalGroupRescheduleDto {
  @ApiProperty({ enum: ['ACCEPTED', 'REJECTED'] })
  @IsIn(['ACCEPTED', 'REJECTED'])
  decision!: 'ACCEPTED' | 'REJECTED';
}

/** Cuerpo de `POST /medical-groups/:id/members/:memberId/respond`. */
export class RespondMedicalGroupInvitationDto {
  @ApiProperty({ enum: ['ACCEPTED', 'REJECTED'] })
  @IsIn(['ACCEPTED', 'REJECTED'])
  decision!: 'ACCEPTED' | 'REJECTED';
}

/** Cuerpo de `PATCH /medical-groups/:id/exercise-notes`. */
export class UpdateMedicalGroupExerciseNotesDto {
  @ApiProperty({ description: 'Notas del procedimiento ya realizado' })
  @IsString()
  @MaxLength(8000)
  notesText!: string;
}

/** Un cargo del roster, en la respuesta. */
export class MedicalGroupMemberDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  @ApiProperty()
  roleTitle!: string;

  @ApiProperty()
  agreedPaymentAmount!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  agreedPaymentCurrencyConceptId?: string;

  @ApiPropertyOptional()
  additionalTermsText?: string;

  @ApiProperty()
  isCreator!: boolean;

  @ApiProperty({ enum: ['PENDING', 'ACCEPTED', 'REJECTED'] })
  invitationStatus!: 'PENDING' | 'ACCEPTED' | 'REJECTED';

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  respondedAt?: Date;
}

/** La ficha completa del grupo médico (formulario de alta/consulta, AC-21-15/16). */
export class MedicalGroupDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  serviceCatalogId!: string;

  @ApiProperty({ format: 'uuid' })
  requestingPractitionerId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  patientProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  conditionId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledAt!: Date;

  @ApiProperty()
  locationText!: string;

  @ApiPropertyOptional()
  notesText?: string;

  @ApiProperty()
  termsText!: string;

  @ApiProperty({
    enum: ['PENDING_TEAM', 'SCHEDULED', 'RESCHEDULE_PENDING', 'CLOSED'],
  })
  status!: string;

  @ApiPropertyOptional()
  exerciseNotesText?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  exerciseNotesUpdatedAt?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  proposedRescheduleAt?: Date;

  @ApiPropertyOptional({ format: 'uuid' })
  proposedByPractitionerId?: string;

  /** Derivado en el servidor: ya pasó la fecha de realización. */
  @ApiProperty()
  isRealized!: boolean;

  /** Derivado: todavía se pueden subir notas del procedimiento. */
  @ApiProperty()
  canEditExerciseNotes!: boolean;

  /** Derivado: pasó la ventana de una semana — expediente inmutable (AC-21-19). */
  @ApiProperty()
  isClosed!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: [MedicalGroupMemberDto] })
  members!: MedicalGroupMemberDto[];
}

/** Página de `GET /medical-groups`. */
export class MedicalGroupListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  serviceCatalogId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledAt!: Date;

  @ApiProperty()
  locationText!: string;

  @ApiProperty({
    enum: ['PENDING_TEAM', 'SCHEDULED', 'RESCHEDULE_PENDING', 'CLOSED'],
  })
  status!: string;

  @ApiProperty()
  isCreator!: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  patientProfileId?: string;

  /** Cuántos cargos siguen sin responder (útil en enviadas/recibidas). */
  @ApiProperty()
  pendingMembersCount!: number;
}

export class MedicalGroupPageDto {
  @ApiProperty({ type: [MedicalGroupListItemDto] })
  items!: MedicalGroupListItemDto[];

  @ApiPropertyOptional({ nullable: true })
  nextCursor?: string | null;
}

/** Una condición (diagnóstico) del paciente, para el selector del formulario. */
export class MedicalGroupConditionOptionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Código del catálogo (p. ej. CIE-10)' })
  code!: string;

  @ApiProperty({ description: 'Texto legible del diagnóstico' })
  display!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  onsetAt?: Date;

  /** `true` en la más reciente: es la que el formulario preselecciona (AC-21-07). */
  @ApiProperty()
  isMostRecent!: boolean;
}
