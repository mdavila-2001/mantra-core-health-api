import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const DISCLOSURES = ['SHOW', 'HIDE'] as const;

/** Cuerpo de `POST /practitioner-delegates/:id/accept`. */
export class AcceptSupportDelegateDto {
  /** El doctor acepta la cláusula de personal de apoyo. */
  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true)
  acceptsSupportClause!: true;

  /** Permite que esta persona responda mensajes en su nombre. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mayReplyOnBehalf?: boolean;

  /** Mostrar u ocultar «respondido por su equipo». */
  @ApiPropertyOptional({ enum: DISCLOSURES })
  @IsOptional()
  @IsIn(DISCLOSURES)
  replyDisclosure?: (typeof DISCLOSURES)[number];
}

/** Cuerpo de `PATCH /practitioner-delegates/:id/reply-settings`. */
export class ReplySettingsDto {
  /** Permite o retira que responda en su nombre. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mayReplyOnBehalf?: boolean;

  /** Mostrar u ocultar «respondido por su equipo». */
  @ApiPropertyOptional({ enum: DISCLOSURES })
  @IsOptional()
  @IsIn(DISCLOSURES)
  replyDisclosure?: (typeof DISCLOSURES)[number];
}

/** Una solicitud de acceso clínico temporal de la persona, que decide el doctor. */
export class PendingClinicalAccessRequestDto {
  /** Id de la solicitud (`POST /access-requests/:id/decision`). */
  @ApiProperty({ format: 'uuid' }) requestId!: string;
  /** Etiqueta corta del paciente («Juan P.»): nunca el nombre completo. */
  @ApiProperty() patientLabel!: string;
  /** Para qué lo pide la persona. */
  @ApiProperty() reasonText!: string;
  /** Cuándo la pidió. */
  @ApiProperty({ type: String, format: 'date-time' }) requestedAt!: Date;
  /** Horas de acceso que rigen si el doctor no fija otra vigencia al aprobar. */
  @ApiProperty() requestedHours!: number;
}

/** Una persona del equipo de apoyo de un doctor. */
export class SupportTeamMemberDto {
  /** Delegación (id para aceptar, revocar o ajustar respuestas). */
  @ApiProperty({ format: 'uuid' }) delegateId!: string;
  /** Persona de apoyo. */
  @ApiProperty({ format: 'uuid' }) userId!: string;
  /** Nombre de la persona de apoyo. */
  @ApiProperty() personName!: string;
  /** Vínculo de apoyo. */
  @ApiProperty({ format: 'uuid' }) engagementId!: string;
  /**
   * Asignación de rol del doctor sobre la que corre esta delegación: es el
   * `practitionerRoleAssignmentId` que pide `POST /org/access-explain` para
   * contestar «¿por qué pudo?» sobre esta persona.
   */
  @ApiProperty({ format: 'uuid' }) practitionerRoleAssignmentId!: string;
  /** Organización del vínculo. */
  @ApiPropertyOptional({ format: 'uuid' }) tenantId?: string;
  /** Nombre de la organización. */
  @ApiPropertyOptional() organizationName?: string;
  /** Plantilla de rol (código). */
  @ApiPropertyOptional() roleTemplateCode?: string;
  /** Igual que `roleTemplateCode` (nombre que usan las pantallas). */
  @ApiPropertyOptional() roleTemplate?: string;
  /**
   * Estado para el doctor: `PENDING_ACCEPTANCE` (la delegación está activa y
   * él todavía no la aceptó), `ACTIVE` o `REVOKED` (retirada, suspendida o vencida).
   */
  @ApiProperty({ enum: ['PENDING_ACCEPTANCE', 'ACTIVE', 'REVOKED'] })
  status!: string;
  /** Estado de la delegación tal cual: `ACTIVE`, `SUSPENDED`, `REVOKED` o `EXPIRED`. */
  @ApiProperty() delegateStatus!: string;
  /** ¿El doctor ya la aceptó? */
  @ApiProperty() accepted!: boolean;
  /** Fecha de aceptación. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) acceptedAt?: Date;
  /** ¿Puede responder en su nombre? */
  @ApiProperty() mayReplyOnBehalf!: boolean;
  /** SHOW o HIDE. */
  @ApiProperty({ enum: DISCLOSURES }) replyDisclosure!: string;
  /** Acciones que tiene sobre este doctor (unión de sus permisos que lo cubren). */
  @ApiProperty({ type: [String] }) actions!: string[];
  /** Qué cubre de este doctor, resumido en una línea para mostrar. */
  @ApiProperty() coverageSummary!: string;
  /** Última actividad de la persona en la organización (últimos 90 días). */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  lastActivityAt?: Date;
  /** Accesos clínicos temporales que la persona pidió y el doctor aún no decide. */
  @ApiProperty({ type: [PendingClinicalAccessRequestDto] })
  pendingClinicalRequests!: PendingClinicalAccessRequestDto[];
}

/** Equipo de apoyo del doctor. */
export class SupportTeamResponseDto {
  /** Integrantes. */
  @ApiProperty({ type: [SupportTeamMemberDto] }) items!: SupportTeamMemberDto[];
  /** Cantidad. */
  @ApiProperty() count!: number;
}

/** Solicitud de acceso clínico temporal que espera la decisión del doctor. */
export class SupportAccessRequestViewDto {
  /** Id de la solicitud (el que se decide en `POST /access-requests/:id/decision`). */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Delegación del doctor con la persona que pide. */
  @ApiProperty({ format: 'uuid' }) delegateId!: string;
  /** Persona de apoyo que pide. */
  @ApiProperty({ format: 'uuid' }) userId!: string;
  /** Paciente cuya historia pide ver. */
  @ApiPropertyOptional({ format: 'uuid' }) patientProfileId?: string;
  /** Encuentro, si pide una consulta concreta. */
  @ApiPropertyOptional({ format: 'uuid' }) encounterId?: string;
  /** Para qué lo necesita. */
  @ApiPropertyOptional() reasonText?: string;
  /** Cuándo se pidió. */
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

/** Solicitudes abiertas de acceso clínico temporal del doctor. */
export class SupportAccessRequestsResponseDto {
  /** Solicitudes abiertas. */
  @ApiProperty({ type: [SupportAccessRequestViewDto] })
  items!: SupportAccessRequestViewDto[];
  /** Cantidad. */
  @ApiProperty() count!: number;
}

/** Consulta de `GET /org/access-lookup`: exactamente un criterio. */
export class AccessLookupQueryDto {
  /** Doctor (asignación de rol). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  doctor?: string;

  /** Servicio. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  service?: string;

  /** Espacio o sede. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  location?: string;
}

/** Una persona con acceso al objeto consultado. */
export class AccessLookupEntryDto {
  /** Persona de apoyo. */
  @ApiProperty({ format: 'uuid' }) userId!: string;
  /** Doctor sobre el que tiene acceso; ausente = cualquier profesional. */
  @ApiPropertyOptional({ format: 'uuid' })
  practitionerRoleAssignmentId?: string;
  /** Acciones que tiene. */
  @ApiProperty({ type: [String] }) actions!: string[];
  /** Permisos que lo originan. */
  @ApiProperty({ type: [String] }) grantIds!: string[];
}

/** Respuesta de la consulta de acceso. */
export class AccessLookupResponseDto {
  /** Personas con acceso. */
  @ApiProperty({ type: [AccessLookupEntryDto] }) items!: AccessLookupEntryDto[];
  /** Cantidad. */
  @ApiProperty() count!: number;
}

/**
 * Consulta de `GET /org/support-activity`, `GET /me/practitioner/support-activity`
 * y `GET /me/support-activity`.
 */
export class SupportActivityQueryDto {
  /** Solo la actividad de esta persona de apoyo (por id). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Solo la actividad de una organización. Lo usa `GET /me/support-activity`,
   * que no tiene organización activa; en las otras dos rutas la organización
   * sale del contexto y este valor, si viene, tiene que coincidir con ella.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /** Persona de apoyo: su id, o su nombre completo (sin distinguir mayúsculas ni acentos). */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  person?: string;

  /** Doctor: su asignación de rol o su perfil (id), o su nombre completo. */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  doctor?: string;

  /** Acción: el código de la entrada (`schedule.confirm`, `engagement.ended`) o el asiento (`BOOKING_CONFIRMED`). */
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  action?: string;

  /** Desde: `YYYY-MM-DD` (el día completo, hora de La Paz) o un instante ISO. */
  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Hasta, con el mismo formato que `from`; un día sin hora incluye ese día entero. */
  @ApiPropertyOptional({ example: '2026-10-30' })
  @IsOptional()
  @IsDateString()
  to?: string;

  /** Tope de filas (1-200). */
  @ApiPropertyOptional({ minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  /** Cursor opaco. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;
}

/**
 * Un asiento de la bitácora de actividad del personal de apoyo. Solo
 * identificadores, nombres y verbos: ningún dato clínico ni nombre de paciente.
 */
export class SupportActivityEntryDto {
  /** Id del asiento. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Organización a la que pertenece el asiento. */
  @ApiPropertyOptional({ format: 'uuid' }) tenantId?: string;
  /** Persona que actuó. */
  @ApiProperty({ format: 'uuid' }) userId!: string;
  /** Nombre de la persona que actuó. */
  @ApiProperty() personName!: string;
  /** Igual que `personName`. */
  @ApiProperty() actorName!: string;
  /**
   * Código de la entrada: el permiso con el que se actuó (`schedule.check_in`)
   * o el evento (`engagement.ended`); un asiento que no se reconoce conserva el
   * suyo (`auditAction`).
   */
  @ApiProperty() action!: string;
  /** Asiento de la cadena de auditoría tal como se selló (`BOOKING_CHECKED_IN`). */
  @ApiProperty() auditAction!: string;
  /** Permiso de apoyo con el que se hizo, si es una acción de agenda. */
  @ApiPropertyOptional() permission?: string;
  /** Recurso afectado. */
  @ApiProperty() entity!: string;
  /** Id del recurso. */
  @ApiPropertyOptional({ format: 'uuid' }) entityId?: string;
  /** Reserva a la que se refiere el asiento. */
  @ApiPropertyOptional({ format: 'uuid' }) bookingId?: string;
  /** Cita a la que se refiere el asiento. */
  @ApiPropertyOptional({ format: 'uuid' }) appointmentId?: string;
  /** Doctor sobre cuya agenda o equipo se actuó (perfil profesional). */
  @ApiPropertyOptional({ format: 'uuid' }) practitionerProfileId?: string;
  /** Asignación de rol del doctor, si el asiento la nombra. */
  @ApiPropertyOptional({ format: 'uuid' })
  practitionerRoleAssignmentId?: string;
  /** Nombre del doctor; solo si quien consulta puede verlo. */
  @ApiPropertyOptional() practitionerName?: string;
  /** La acción en una frase. */
  @ApiProperty() summary!: string;
  /** ¿Se hizo? */
  @ApiProperty() success!: boolean;
  /** Resultado: `SUCCESS` o `FAILURE`. */
  @ApiProperty({ enum: ['SUCCESS', 'FAILURE'] }) result!: string;
  /** Cuándo. */
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  /** Igual que `createdAt`. */
  @ApiProperty({ type: String, format: 'date-time' }) occurredAt!: Date;
  /** Igual que `createdAt` (nombre de la primera versión). */
  @ApiProperty({ type: String, format: 'date-time' }) recordedAt!: Date;
}

/** Página de actividad. */
export class SupportActivityResponseDto {
  /** Asientos. */
  @ApiProperty({ type: [SupportActivityEntryDto] })
  items!: SupportActivityEntryDto[];
  /** Cantidad. */
  @ApiProperty() count!: number;
  /** Cursor de continuación. */
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}
