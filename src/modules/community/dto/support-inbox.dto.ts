import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const STATES = ['NEW', 'TAKEN', 'WAITING_DOCTOR', 'RESOLVED'] as const;
const ACTIONS = ['TAKE', 'ASSIGN', 'SET_STATUS'] as const;
const CATEGORIES = ['GENERAL', 'SCHEDULING', 'BILLING', 'PREPARATION'] as const;

/** Estado de una conversación en la bandeja. */
export type InboxState = (typeof STATES)[number];
/** Categoría de una respuesta preparada. */
export type ReplyTemplateCategory = (typeof CATEGORIES)[number];

/** Consulta de `GET /me/support-inbox`. */
export class SupportInboxQueryDto {
  /** Organización cuya bandeja se pide; ausente = todas en las que tiene vínculo. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /** Solo conversaciones en este estado. */
  @ApiPropertyOptional({ enum: STATES })
  @IsOptional()
  @IsIn(STATES)
  status?: InboxState;

  /** Solo las del doctor con este perfil profesional. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  doctor?: string;
}

/** Un doctor que la persona cubre, en el mismo orden que la agenda combinada. */
export class SupportInboxDoctorDto {
  /** Asignación de rol del doctor en la organización: el id del doctor en la agenda. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Perfil profesional del doctor: el de los filtros y el de responder en su nombre. */
  @ApiProperty({ format: 'uuid' }) practitionerProfileId!: string;
  /** Nombre para mostrar. */
  @ApiProperty() name!: string;
  /** Mismo nombre, con el nombre de campo de la agenda combinada. */
  @ApiProperty() displayName!: string;
  /** Especialidad principal; vacío si no tiene. */
  @ApiProperty() specialty!: string;
}

/** Una conversación de la bandeja. */
export class SupportInboxItemDto {
  /** Conversación. */
  @ApiProperty({ format: 'uuid' }) conversationId!: string;
  /** Organización de la bandeja. */
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  /** Organización de la bandeja (mismo valor que `tenantId`). */
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  /** Nombre de la organización. */
  @ApiProperty() organizationName!: string;
  /** Doctor a cuyo nombre se atiende (perfil profesional). */
  @ApiProperty({ format: 'uuid' }) practitionerProfileId!: string;
  /** Nombre del doctor. */
  @ApiProperty() practitionerName!: string;
  /** Perfil público del doctor: el remitente con el que se responde. */
  @ApiProperty({ format: 'uuid' }) doctorPublicProfileId!: string;
  /** Cómo se nombra al paciente en la bandeja. */
  @ApiProperty() patientLabel!: string;
  /** Estado en la bandeja. */
  @ApiProperty({ enum: STATES }) status!: InboxState;
  /** Quien la tiene. */
  @ApiPropertyOptional({ format: 'uuid' }) assignedUserId?: string;
  /** Nombre de quien la tiene. */
  @ApiPropertyOptional() assignedToName?: string;
  /** ¿La tiene quien pide? Lo resuelve la API: el cliente no compara usuarios. */
  @ApiProperty() assignedToMe!: boolean;
  /** Vencimiento del plazo de respuesta. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) slaDueAt?: Date;
  /** Último mensaje de la conversación. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  lastMessageAt?: Date;
  /**
   * Último mensaje del paciente (recortado), lo que hay que contestar. Si parece
   * clínico sale el marcador «Contenido clínico oculto…» en lugar del texto.
   */
  @ApiPropertyOptional() lastPatientMessage?: string;
  /** Mismo recorte, con el nombre de campo que usa la pantalla. */
  @ApiProperty() lastMessagePreview!: string;
  /**
   * `true` si la vista previa del texto del paciente se retuvo y solo se
   * entregan metadatos (SEG A-A4): quien escribe no es paciente de la agenda del
   * doctor y la conversación aún no la tomó el equipo como administrativa. El
   * texto se lee abriendo la conversación.
   */
  @ApiPropertyOptional() previewHidden?: boolean;
  /** ¿Hay un mensaje clínico del paciente sin responder? Se deriva al doctor. */
  @ApiProperty() isClinical!: boolean;
  /** Mismo valor que `isClinical`, con el nombre original. */
  @ApiProperty() clinicalSuspected!: boolean;
}

/** Bandeja de la persona de apoyo. */
export class SupportInboxResponseDto {
  /** Conversaciones, las más recientes primero. */
  @ApiProperty({ type: [SupportInboxItemDto] }) items!: SupportInboxItemDto[];
  /** Doctores cubiertos, en el mismo orden que la agenda combinada. */
  @ApiProperty({ type: [SupportInboxDoctorDto] })
  doctors!: SupportInboxDoctorDto[];
  /** Cantidad. */
  @ApiProperty() count!: number;
}

/** Consulta de `GET /me/support-inbox/:conversationId`. */
export class SupportConversationQueryDto {
  /** Organización de la conversación; ausente = la que resuelva el vínculo. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

/** Un mensaje de la conversación como lo ve el equipo. */
export class SupportConversationMessageDto {
  /** Mensaje. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** `PATIENT` escribió el paciente; `DOCTOR_SIDE`, el doctor o su equipo en su nombre. */
  @ApiProperty({ enum: ['PATIENT', 'DOCTOR_SIDE'] })
  from!: 'PATIENT' | 'DOCTOR_SIDE';
  /**
   * Texto. Los mensajes que escribió el propio doctor y los que parecen clínicos
   * salen con un marcador («Contenido clínico oculto…») en lugar del texto
   * mientras no haya un acceso clínico temporal aprobado y vigente
   * (`patientContext.clinicalAccess = APPROVED`); entonces se muestran completos.
   */
  @ApiProperty() bodyText!: string;
  /** Cuándo se envió. */
  @ApiProperty({ type: String, format: 'date-time' }) sentAt!: Date;
  /** Parece clínico (paciente), o su texto está oculto por ser clínico. */
  @ApiProperty() isClinical!: boolean;
  /** Presente (`true`) cuando `bodyText` es el marcador y no el texto real. */
  @ApiPropertyOptional() contentHidden?: boolean;
  /** La autora real, cuando respondió el equipo en nombre del doctor. Solo el equipo la ve. */
  @ApiPropertyOptional() authoredByName?: string;
  /** Si el paciente ve «respondido por su equipo» en este mensaje. */
  @ApiPropertyOptional() disclosureShown?: boolean;
}

/** Una nota interna. */
export class InternalNoteDto {
  /** Id de la nota. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Conversación. */
  @ApiProperty({ format: 'uuid' }) conversationId!: string;
  /** Quien la escribió. */
  @ApiProperty({ format: 'uuid' }) authorUserId!: string;
  /** Nombre de quien la escribió. */
  @ApiProperty() authorName!: string;
  /** Texto. */
  @ApiProperty() bodyText!: string;
  /** Cuándo se escribió. */
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

/** A quién se puede asignar la conversación. */
export class SupportAssigneeDto {
  /** Cuenta. */
  @ApiProperty({ format: 'uuid' }) userId!: string;
  /** Nombre. */
  @ApiProperty() name!: string;
}

/** Lo que la persona puede saber del paciente: por defecto, solo el motivo. */
export class SupportPatientContextDto {
  /** Motivo de la cita más reciente con este doctor. */
  @ApiPropertyOptional() reasonLabel?: string;
  /** Estado del acceso clínico temporal. */
  @ApiProperty({ enum: ['NONE', 'PENDING', 'APPROVED'] })
  clinicalAccess!: 'NONE' | 'PENDING' | 'APPROVED';
  /** Delegación doctor ↔ persona, con la que se pide el acceso. */
  @ApiPropertyOptional({ format: 'uuid' }) delegateId?: string;
  /** Paciente en el registro, si tiene. */
  @ApiPropertyOptional({ format: 'uuid' }) patientProfileId?: string;
  /** Permiso que se pide (lectura clínica temporal). */
  @ApiPropertyOptional({ format: 'uuid' }) requestedPermissionId?: string;
}

/** Una conversación abierta para el equipo. */
export class SupportConversationDto {
  /** Conversación. */
  @ApiProperty({ format: 'uuid' }) conversationId!: string;
  /** Organización. */
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  /** Nombre de la organización. */
  @ApiProperty() organizationName!: string;
  /** Doctor (perfil profesional). */
  @ApiProperty({ format: 'uuid' }) practitionerProfileId!: string;
  /** Perfil público del doctor: el remitente al responder. */
  @ApiProperty({ format: 'uuid' }) doctorPublicProfileId!: string;
  /** Nombre del doctor. */
  @ApiProperty() practitionerName!: string;
  /** Especialidad del doctor. */
  @ApiProperty() practitionerSpecialty!: string;
  /** Cómo se nombra al paciente. */
  @ApiProperty() patientLabel!: string;
  /** Estado en la bandeja. */
  @ApiProperty({ enum: STATES }) status!: InboxState;
  /** Nombre de quien la tiene. */
  @ApiPropertyOptional() assignedToName?: string;
  /** ¿La tiene quien pide? */
  @ApiProperty() assignedToMe!: boolean;
  /** Vencimiento del plazo. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) slaDueAt?: Date;
  /** Hay un mensaje clínico del paciente sin responder. */
  @ApiProperty() isClinical!: boolean;
  /** ¿El paciente ve «respondido por su equipo»? Lo decide el doctor. */
  @ApiProperty({ enum: ['SHOW', 'HIDE'] }) replyDisclosure!: 'SHOW' | 'HIDE';
  /** ¿Puede responder en nombre del doctor? Permiso y aceptación del doctor. */
  @ApiProperty() replyAllowed!: boolean;
  /** Por qué no puede responder. */
  @ApiPropertyOptional() replyBlockedReason?: string;
  /** A quién se puede asignar: quienes pueden atender a este doctor. */
  @ApiProperty({ type: [SupportAssigneeDto] })
  assignableTo!: SupportAssigneeDto[];
  /** Mensajes, del más antiguo al más reciente. */
  @ApiProperty({ type: [SupportConversationMessageDto] })
  messages!: SupportConversationMessageDto[];
  /** Notas internas, de la más antigua a la más reciente. */
  @ApiProperty({ type: [InternalNoteDto] }) notes!: InternalNoteDto[];
  /** Lo que se sabe del paciente. */
  @ApiProperty({ type: SupportPatientContextDto })
  patientContext!: SupportPatientContextDto;
}

/** Cuerpo de `POST /community/conversations/:id/assignment`. */
export class ConversationAssignmentDto {
  /**
   * Tomarla, asignarla a otra persona del equipo o cambiar su estado. Ausente,
   * el pedido trae el estado final (`status`) y se resuelve con la forma de las
   * pantallas: sin `assignedUserId` se asigna a quien pide.
   */
  @ApiPropertyOptional({ enum: ACTIONS })
  @IsOptional()
  @IsIn(ACTIONS)
  action?: (typeof ACTIONS)[number];

  /** Doctor de la conversación; si se indica, debe ser el de ella. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practitionerProfileId?: string;

  /** Persona del equipo a la que se asigna (`ASSIGN`). Sin ella se asigna a quien pide. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  /** Estado al que pasa (`SET_STATUS`). */
  @ApiPropertyOptional({ enum: STATES })
  @IsOptional()
  @IsIn(STATES)
  status?: InboxState;

  /** Nuevo plazo de respuesta. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  slaDueAt?: string;
}

/** Resultado de una acción sobre la asignación. */
export class ConversationAssignmentResultDto {
  /** Conversación. */
  @ApiProperty({ format: 'uuid' }) conversationId!: string;
  /** Estado en que quedó. */
  @ApiProperty({ enum: STATES }) status!: InboxState;
  /** Quien la tiene. */
  @ApiPropertyOptional({ format: 'uuid' }) assignedUserId?: string;
  /** Nombre de quien la tiene. */
  @ApiPropertyOptional() assignedToName?: string;
  /** Vencimiento del plazo. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) slaDueAt?: Date;
  /** `true` si se derivó al doctor por parecer clínica. */
  @ApiProperty() referredToDoctor!: boolean;
}

/** Cuerpo de `POST /community/conversations/:id/internal-notes`. */
export class CreateInternalNoteDto {
  /** Texto de la nota. */
  @ApiProperty({ minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  bodyText!: string;
}

/** Notas internas de una conversación. */
export class InternalNotesResponseDto {
  /** Notas, de la más reciente a la más antigua. */
  @ApiProperty({ type: [InternalNoteDto] }) items!: InternalNoteDto[];
  /** Cantidad. */
  @ApiProperty() count!: number;
}

/** Cuerpo de `POST /org/reply-templates`. */
export class CreateReplyTemplateDto {
  /** Categoría. */
  @ApiProperty({ enum: CATEGORIES })
  @IsIn(CATEGORIES)
  category!: ReplyTemplateCategory;

  /** Título. */
  @ApiProperty({ minLength: 1, maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  /** Texto de la respuesta (administrativa: no clínica). */
  @ApiProperty({ minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  bodyText!: string;

  /** Doctor dueño (perfil profesional), si es suya y no de toda la organización. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practitionerProfileId?: string;
}

/** Cuerpo de `PATCH /org/reply-templates/:id`. */
export class UpdateReplyTemplateDto {
  /** Título nuevo. */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  /** Texto nuevo. */
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  bodyText?: string;

  /** Categoría nueva. */
  @ApiPropertyOptional({ enum: CATEGORIES })
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: ReplyTemplateCategory;

  /** Retirarla (`true`) o reactivarla (`false`). */
  @ApiPropertyOptional()
  @IsOptional()
  retired?: boolean;

  /**
   * Versión que quien edita vio (`version` de la respuesta). Si otra persona la
   * cambió desde entonces, la edición se rechaza (409) en vez de pisarla.
   */
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedVersion?: number;
}

/** Consulta de `GET /me/support-reply-templates`. */
export class SupportReplyTemplatesQueryDto {
  /** Organización. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;
}

/** Una respuesta preparada. */
export class ReplyTemplateViewDto {
  /** Id. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Categoría. */
  @ApiProperty({ enum: CATEGORIES }) category!: ReplyTemplateCategory;
  /** Título. */
  @ApiProperty() title!: string;
  /** Texto. */
  @ApiProperty() bodyText!: string;
  /** Doctor dueño, si es suya. */
  @ApiPropertyOptional({ format: 'uuid' }) practitionerProfileId?: string;
  /** ¿Está retirada? */
  @ApiProperty() retired!: boolean;
  /** Versión de la respuesta: sube con cada cambio. */
  @ApiProperty({ minimum: 1 }) version!: number;
}

/** Respuestas preparadas. */
export class ReplyTemplatesResponseDto {
  /** Respuestas. */
  @ApiProperty({ type: [ReplyTemplateViewDto] }) items!: ReplyTemplateViewDto[];
  /** Cantidad. */
  @ApiProperty() count!: number;
}
