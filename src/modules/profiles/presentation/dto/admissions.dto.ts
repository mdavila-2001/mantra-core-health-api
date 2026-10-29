import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  ADMISSION_STATUS_CODES,
  type AdmissionStatusCode,
} from '../../domain/admissions/admission-status';
import {
  REASON_CODES,
  SOURCE_TYPE_CODES,
  type ReasonCode,
  type SourceTypeCode,
} from '../../domain/admissions/admission-vocabulary';

/** Tope de ítems nombrados en una petición de información. */
export const MAX_INFO_REQUEST_ITEMS = 200;

// ─────────────────────────────────────────────────────────────── respuestas ──

/** Un código estable y su rótulo en español. */
export class AdmissionCodeLabelDto {
  @ApiProperty() code!: string;
  @ApiProperty() label!: string;
}

/** Una persona de la plataforma (revisor, aprobador). */
export class AdmissionActorDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
}

/** El profesional en la bandeja: la cédula va enmascarada. */
export class AdmissionPractitionerSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() fullName!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) profession!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) maskedNationalId!: string | null;
}

/** Cuántas fichas declaró el médico. */
export class AdmissionItemsSummaryDto {
  @ApiProperty() licenses!: number;
  @ApiProperty() credentials!: number;
  @ApiProperty() specialties!: number;
}

/** Avance del checklist a nivel de requisito. */
export class AdmissionRequirementsSummaryDto {
  @ApiProperty() total!: number;
  @ApiProperty() verified!: number;
  @ApiProperty() rejected!: number;
  @ApiProperty() pending!: number;
}

/** Lo común a la fila de la bandeja y al detalle (todo menos el profesional). */
export class AdmissionBaseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: AdmissionCodeLabelDto }) type!: AdmissionCodeLabelDto;
  @ApiProperty({ type: AdmissionCodeLabelDto }) status!: AdmissionCodeLabelDto;
  @ApiProperty({ type: AdmissionItemsSummaryDto })
  itemsSummary!: AdmissionItemsSummaryDto;
  @ApiProperty({ type: AdmissionRequirementsSummaryDto })
  requirementsSummary!: AdmissionRequirementsSummaryDto;
  @ApiProperty({ format: 'date-time' }) submittedAt!: string;
  @ApiProperty({ format: 'date-time' }) dueAt!: string;
  @ApiProperty({ description: 'Venció su plazo y la plataforma le debe una respuesta.' })
  overdue!: boolean;
  @ApiProperty({ type: AdmissionActorDto, nullable: true })
  assignedTo!: AdmissionActorDto | null;
  @ApiProperty({ description: 'Versión de la fila; se manda como expectedRowVersion.' })
  rowVersion!: number;
}

/** Una fila de la bandeja. */
export class AdmissionSummaryDto extends AdmissionBaseDto {
  @ApiProperty({ type: AdmissionPractitionerSummaryDto })
  practitioner!: AdmissionPractitionerSummaryDto;
}

/** La bandeja: una página, el cursor y los conteos por estado. */
export class AdmissionListDto {
  @ApiProperty({ type: [AdmissionSummaryDto] }) items!: AdmissionSummaryDto[];
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
  @ApiProperty({
    description: 'Cantidad por código de estado, con los filtros menos el de estado.',
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  counts!: Record<string, number>;
}

/** Los datos del profesional tal como los envió (detalle: cédula completa). */
export class AdmissionPractitionerDetailDto extends AdmissionPractitionerSummaryDto {
  @ApiPropertyOptional({ nullable: true, type: String }) nationalId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) nationalIdIssuer!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) birthDate!: string | null;
  @ApiPropertyOptional({ nullable: true, type: Number }) age!: number | null;
  @ApiPropertyOptional({ nullable: true, type: String }) occupation!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) personalMobile!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) personalEmail!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) workMobile!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) workPhone!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) workEmail!: string | null;
}

/** Una matrícula declarada. */
export class AdmissionLicenseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() requirementCode!: string;
  @ApiProperty() number!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) jurisdiction!: string | null;
  @ApiProperty({ type: AdmissionCodeLabelDto }) state!: AdmissionCodeLabelDto;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' }) fileId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) verifiedAt!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) verificationSourceUri!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) rejectionReasonText!: string | null;
}

/** Un título declarado. */
export class AdmissionCredentialDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() requirementCode!: string;
  @ApiProperty() level!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) title!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) institution!: string | null;
  @ApiProperty({ type: AdmissionCodeLabelDto }) state!: AdmissionCodeLabelDto;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' }) fileId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) verifiedAt!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) verificationSourceUri!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) rejectionReasonText!: string | null;
}

/** Una especialidad declarada. */
export class AdmissionSpecialtyDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() requirementCode!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) name!: string | null;
  @ApiProperty({ type: AdmissionCodeLabelDto }) state!: AdmissionCodeLabelDto;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  supportingCredentialId!: string | null;
}

/** Un evento de la bitácora. */
export class AdmissionEventDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() type!: string;
  @ApiPropertyOptional({ type: AdmissionCodeLabelDto, nullable: true })
  fromStatus!: AdmissionCodeLabelDto | null;
  @ApiPropertyOptional({ type: AdmissionCodeLabelDto, nullable: true })
  toStatus!: AdmissionCodeLabelDto | null;
  @ApiPropertyOptional({ nullable: true, type: String }) itemType!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' }) itemId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) requirementCode!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) verificationSourceUri!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) reasonCode!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) reasonText!: string | null;
  @ApiPropertyOptional({ type: AdmissionActorDto, nullable: true })
  actor!: AdmissionActorDto | null;
  @ApiPropertyOptional({ nullable: true, type: String }) actorRole!: string | null;
  @ApiProperty({ format: 'date-time' }) occurredAt!: string;
}

/** Un ítem del checklist: una ficha concreta de un requisito. */
export class AdmissionChecklistItemDto {
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    format: 'uuid',
    description:
      'Id de la revisión (el `:itemId` de `.../items/:itemId/review`). Es null ' +
      'hasta que alguien toma la admisión y se materializa.',
  })
  id!: string | null;
  @ApiProperty({ format: 'uuid', description: 'La ficha: matrícula, título, especialidad o perfil.' })
  itemId!: string;
  @ApiProperty({ enum: ['LICENSE', 'CREDENTIAL', 'SPECIALTY', 'PROFILE'] })
  itemType!: string;
  @ApiProperty() label!: string;
  @ApiProperty({ enum: ['PENDING', 'VERIFIED', 'REJECTED', 'INFO_REQUIRED'] })
  state!: string;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' }) fileId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) verificationSourceUri!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, enum: SOURCE_TYPE_CODES })
  sourceType!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) sourceRef!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) sourceConsultedAt!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, enum: REASON_CODES })
  reasonCode!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) reasonText!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: 'Sólo para el personal; nunca llega al médico.',
  })
  internalNote!: string | null;
  @ApiPropertyOptional({ type: AdmissionActorDto, nullable: true })
  reviewedBy!: AdmissionActorDto | null;
  @ApiPropertyOptional({ nullable: true, type: String }) reviewedAt!: string | null;
  @ApiProperty({
    description: 'El dato o el archivo cambió después de revisarse: la revisión ya no vale.',
  })
  evidenceChanged!: boolean;
  @ApiProperty({
    description:
      'Huella (sha256) del dato y del archivo de HOY. Se devuelve tal cual en ' +
      '`evidenceSha256` al revisar el ítem: así el servidor sabe qué vio el revisor.',
  })
  evidenceSha256!: string;
  @ApiPropertyOptional({ nullable: true, type: Number, description: 'expectedRowVersion del ítem.' })
  rowVersion!: number | null;
}

/** Un requisito del checklist con sus ítems. */
export class AdmissionChecklistRequirementDto {
  @ApiProperty() code!: string;
  @ApiProperty() label!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) description!: string | null;
  @ApiProperty() required!: boolean;
  @ApiProperty({ enum: ['DOCUMENT', 'DATA'] }) evidenceKind!: string;
  @ApiProperty({ description: 'Verificar un ítem exige declarar la fuente consultada.' })
  requiresSource!: boolean;
  @ApiPropertyOptional({ nullable: true, type: String, enum: ['MEDICO', 'ODONTOLOGO'] })
  professionGroup!: string | null;
  @ApiPropertyOptional({ nullable: true, type: Number }) minItems!: number | null;
  @ApiPropertyOptional({ nullable: true, type: Number }) maxItems!: number | null;
  @ApiProperty({
    enum: ['NOT_PROVIDED', 'MISSING', 'PENDING', 'INFO_REQUIRED', 'VERIFIED', 'REJECTED'],
  })
  state!: string;
  @ApiProperty({ description: 'El requisito está cumplido.' }) satisfied!: boolean;
  @ApiPropertyOptional({ nullable: true, type: String }) blockedBy!: string | null;
  @ApiProperty({ type: [AdmissionChecklistItemDto] }) items!: AdmissionChecklistItemDto[];
}

/** Un archivo de la solicitud, para el carrusel. */
export class AdmissionDocumentDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() requirementCode!: string;
  @ApiProperty({ format: 'uuid' }) fileId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() mimeType!: string;
  @ApiProperty() sizeBytes!: number;
  @ApiProperty({ format: 'date-time' }) uploadedAt!: string;
  @ApiPropertyOptional({ nullable: true, type: Number }) pages!: number | null;
  @ApiProperty({ enum: ['PENDING', 'VERIFIED', 'REJECTED', 'INFO_REQUIRED'] })
  reviewState!: string;
  @ApiProperty({ description: 'Huella (sha256) de la evidencia del ítem al que pertenece el archivo.' })
  evidenceSha256!: string;
}

/** Un bloqueo de la verificación. */
export class AdmissionBlockerDto {
  @ApiProperty() requirementCode!: string;
  @ApiProperty() label!: string;
  @ApiProperty({ enum: ['MISSING', 'REJECTED', 'PENDING', 'INFO_REQUIRED', 'BELOW_MINIMUM'] })
  reason!: string;
}

/** El detalle de una admisión. */
export class AdmissionDetailDto extends AdmissionBaseDto {
  @ApiProperty({ type: AdmissionPractitionerDetailDto })
  practitioner!: AdmissionPractitionerDetailDto;
  @ApiProperty({ type: [AdmissionLicenseDto] }) licenses!: AdmissionLicenseDto[];
  @ApiProperty({ type: [AdmissionCredentialDto] }) credentials!: AdmissionCredentialDto[];
  @ApiProperty({ type: [AdmissionSpecialtyDto] }) specialties!: AdmissionSpecialtyDto[];
  @ApiProperty({ type: [AdmissionEventDto] }) events!: AdmissionEventDto[];
  @ApiPropertyOptional({ nullable: true, type: String }) infoRequestedText!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) infoDueAt!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) decisionReasonText!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) decisionReasonCode!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) internalNote!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, description: 'YYYY-MM-DD, inclusive, fin de día en America/La_Paz.' })
  validUntil!: string | null;
  @ApiProperty() resubmissionCount!: number;
  @ApiPropertyOptional({ nullable: true, type: String }) attestedAt!: string | null;
  @ApiProperty({ description: 'La configuración exige un aprobador distinto de los revisores.' })
  fourEyesRequired!: boolean;
  @ApiProperty({ type: [AdmissionChecklistRequirementDto] })
  requirements!: AdmissionChecklistRequirementDto[];
  @ApiProperty({ type: [AdmissionBlockerDto] }) blockers!: AdmissionBlockerDto[];
  @ApiProperty({ description: 'Hoy se podría resolver VERIFICADA (lo decide el servidor).' })
  canVerify!: boolean;
  @ApiProperty({ type: [AdmissionDocumentDto] }) documents!: AdmissionDocumentDto[];
  @ApiProperty({
    description:
      'El formulario tal como lo envió el médico (SnapshotForm). Ver `submittedFormSource`.',
    type: 'object',
    additionalProperties: true,
  })
  submittedForm!: Record<string, unknown>;
  @ApiProperty({
    enum: ['SNAPSHOT', 'LIVE'],
    description:
      'SNAPSHOT: foto tomada al enviar o reenviar. LIVE: lectura viva del perfil ' +
      '(admisiones sin foto, p. ej. las del backfill).',
  })
  submittedFormSource!: string;
}

/** Una ficha de la admisión propia, sin nada del personal. */
export class OwnAdmissionItemDto {
  @ApiProperty({ enum: ['LICENSE', 'CREDENTIAL', 'SPECIALTY', 'PROFILE'] }) type!: string;
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() label!: string;
  @ApiProperty({ enum: ['PENDING', 'VERIFIED', 'REJECTED', 'INFO_REQUIRED'] }) state!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) reasonText!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, enum: REASON_CODES })
  reasonCode!: string | null;
}

/** La admisión vista por su dueño. */
export class OwnAdmissionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: AdmissionCodeLabelDto }) status!: AdmissionCodeLabelDto;
  @ApiProperty({ format: 'date-time' }) submittedAt!: string;
  @ApiProperty({ format: 'date-time' }) dueAt!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) infoRequestedText!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) infoDueAt!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) decisionReasonText!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) validUntil!: string | null;
  @ApiProperty({ type: [OwnAdmissionItemDto] }) items!: OwnAdmissionItemDto[];
  @ApiProperty() resubmissionCount!: number;
  @ApiProperty() canResubmit!: boolean;
  @ApiProperty() canWithdraw!: boolean;
}

/** Resultado del barrido de vencimientos. */
export class AdmissionSweepResultDto {
  @ApiProperty({ description: 'Verificaciones vencidas (VERIFICADA a EXPIRADA).' })
  expired!: number;
  @ApiProperty({ description: 'Solicitudes cerradas por falta de respuesta (a ABANDONADA).' })
  abandoned!: number;
}

/** URL firmada de un documento de la solicitud. */
export class AdmissionDocumentUrlDto {
  @ApiProperty({ description: 'Ruta de la API para abrir el documento (vida corta, atada al actor).' })
  url!: string;
  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
  @ApiProperty() name!: string;
  @ApiProperty() mimeType!: string;
}

// ───────────────────────────────────────────────────────────── comandos ─────

const ROW_VERSION_DOC =
  'Versión que el cliente leyó (`rowVersion`); si cambió, la respuesta es 409 ADMISSION_STALE.';

/** Base de los comandos que escriben: llevan la versión leída. */
export class AdmissionVersionedCommandDto {
  @ApiProperty({ description: ROW_VERSION_DOC, minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  expectedRowVersion!: number;
}

/** `POST /admissions/:id/claim`, `release`. */
export class ClaimAdmissionDto extends AdmissionVersionedCommandDto {}

/** `POST /admissions/:id/reassign`. */
export class ReassignAdmissionDto extends AdmissionVersionedCommandDto {
  @ApiProperty({ format: 'uuid', description: 'Cuenta del revisor que recibe la admisión.' })
  @IsUUID()
  toUserId!: string;
}

/** Un ítem nombrado en una petición de información. */
export class AdmissionItemRefDto {
  @ApiProperty({ enum: ['LICENSE', 'CREDENTIAL', 'SPECIALTY', 'PROFILE'] })
  @IsIn(['LICENSE', 'CREDENTIAL', 'SPECIALTY', 'PROFILE'])
  type!: 'LICENSE' | 'CREDENTIAL' | 'SPECIALTY' | 'PROFILE';

  @ApiProperty({ format: 'uuid', description: 'La ficha (matrícula, título, especialidad o perfil).' })
  @IsUUID()
  id!: string;
}

/** `POST /admissions/:id/request-info`. */
export class RequestAdmissionInfoDto extends AdmissionVersionedCommandDto {
  @ApiProperty({ maxLength: 500, description: 'Qué debe corregir o aportar el médico.' })
  @IsString()
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional({ enum: REASON_CODES })
  @IsOptional()
  @IsIn(REASON_CODES)
  reasonCode?: ReasonCode;

  @ApiPropertyOptional({ type: [AdmissionItemRefDto], description: 'Ítems puntuales; los marca INFO_REQUIRED.' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_INFO_REQUEST_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => AdmissionItemRefDto)
  items?: AdmissionItemRefDto[];
}

/** `POST /admissions/:id/items/:itemId/review`. */
export class ReviewAdmissionItemDto {
  @ApiProperty({ enum: ['VERIFIED', 'REJECTED', 'INFO_REQUIRED'] })
  @IsIn(['VERIFIED', 'REJECTED', 'INFO_REQUIRED'])
  decision!: 'VERIFIED' | 'REJECTED' | 'INFO_REQUIRED';

  @ApiPropertyOptional({ maxLength: 500, description: 'Obligatorio si no es VERIFIED. Lo ve el médico.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ enum: REASON_CODES, description: 'Motivo estructurado; por omisión OTRO.' })
  @IsOptional()
  @IsIn(REASON_CODES)
  reasonCode?: ReasonCode;

  @ApiPropertyOptional({ maxLength: 1000, description: 'Nota interna: nunca llega al médico.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internalNote?: string;

  @ApiPropertyOptional({ enum: SOURCE_TYPE_CODES, description: 'Fuente consultada (tipo).' })
  @IsOptional()
  @IsIn(SOURCE_TYPE_CODES)
  sourceType?: SourceTypeCode;

  @ApiPropertyOptional({ maxLength: 500, description: 'Nº de trámite, comprobante o URL de la fuente.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceRef?: string;

  @ApiPropertyOptional({ format: 'date-time', description: 'Cuándo se consultó la fuente (por omisión, ahora).' })
  @IsOptional()
  @IsDateString()
  sourceConsultedAt?: string;

  @ApiPropertyOptional({
    maxLength: 2000,
    description:
      'URL de la fuente consultada. Compatibilidad: con VERIFIED alcanza como fuente ' +
      '(se registra como tipo OTRO si no viene `sourceType`).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  verificationSourceUri?: string;

  @ApiPropertyOptional({
    description:
      'Huella (`evidenceSha256`) del ítem tal como la entregó `GET /admissions/:id`: lo que el ' +
      'revisor tuvo delante. OBLIGATORIA para VERIFIED; si ya no coincide con la evidencia viva ' +
      'responde 409 ADMISSION_EVIDENCE_CHANGED y no cambia nada.',
    pattern: '^[0-9a-f]{64}$',
  })
  @ValidateIf((o: ReviewAdmissionItemDto) => o.decision === 'VERIFIED' || o.evidenceSha256 !== undefined)
  @IsString()
  @Matches(/^[0-9a-f]{64}$/)
  evidenceSha256?: string;

  @ApiProperty({ description: 'Versión del ÍTEM (`rowVersion` del item del checklist).', minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  expectedRowVersion!: number;
}

/** `POST /admissions/:id/decision`. */
export class DecideAdmissionDto extends AdmissionVersionedCommandDto {
  @ApiProperty({ enum: ['VERIFIED', 'REJECTED'] })
  @IsIn(['VERIFIED', 'REJECTED'])
  decision!: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({ maxLength: 500, description: 'Obligatorio al rechazar. Lo ve el médico.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ enum: REASON_CODES })
  @IsOptional()
  @IsIn(REASON_CODES)
  reasonCode?: ReasonCode;

  @ApiPropertyOptional({ maxLength: 1000, description: 'Nota interna: nunca llega al médico.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internalNote?: string;

  @ApiPropertyOptional({
    deprecated: true,
    description:
      'YA NO SE ACEPTA: el estado de cada ítem lo fija `.../items/:itemId/review` y el ' +
      'servidor lo deriva de las revisiones. Mandarlo responde 422 ' +
      'ADMISSION_DECISION_ITEMS_NOT_ACCEPTED.',
  })
  @IsOptional()
  @IsArray()
  items?: unknown[];
}

/** `POST /admissions/:id/suspend` y `reinstate`. */
export class SuspendAdmissionDto extends AdmissionVersionedCommandDto {
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional({ enum: REASON_CODES })
  @IsOptional()
  @IsIn(REASON_CODES)
  reasonCode?: ReasonCode;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internalNote?: string;
}

/** `GET /admissions` (y `POST /admissions/search`). */
export class ListAdmissionsQueryDto {
  @ApiPropertyOptional({ description: 'Tipo de admisión; hoy ALTA_DE_DOCTOR.', default: 'ALTA_DE_DOCTOR' })
  @IsOptional()
  @IsIn(['ALTA_DE_DOCTOR'])
  type?: 'ALTA_DE_DOCTOR';

  @ApiPropertyOptional({ enum: ADMISSION_STATUS_CODES })
  @IsOptional()
  @IsIn(ADMISSION_STATUS_CODES)
  status?: AdmissionStatusCode;

  @ApiPropertyOptional({ description: 'Cuenta asignada, o `me`, o `none` (sin asignar).' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'true = sólo vencidas.' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  overdue?: boolean;

  @ApiPropertyOptional({ description: 'Nombre, cédula o matrícula (2 a 80 caracteres).', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({ description: 'Cursor opaco de la página anterior.' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: ['due_at'], default: 'due_at' })
  @IsOptional()
  @IsIn(['due_at'])
  sort?: 'due_at';
}
