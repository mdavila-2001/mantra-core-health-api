import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  GUARDIAN_LINK_CHANNELS,
  type GuardianLinkChannel,
} from '../guardian-link.contract';

/**
 * Forma del token del enlace: 32 bytes aleatorios en base64url sin relleno,
 * que son siempre 43 caracteres. Validarlo antes de hashear corta en seco lo
 * que no puede ser un token nuestro.
 */
export const GUARDIAN_LINK_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Cuerpo de `POST /internal/guardian-links/issue`: el evento que el worker
 * recibió de la cola, tal como lo publicó el alta.
 */
export class IssueGuardianLinkDto {
  /** Evento de dominio de origen: la invitación es una por evento. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  domainEventId!: string;

  /** Organización del alta. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /** Perfil del paciente que declaró al tutor. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /** La fila de persona relacionada. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  relatedPersonId!: string;

  /** La persona del tutor. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  guardianPersonId!: string;
}

/**
 * Respuesta de `issue`. Refleja `GuardianLinkIssueResponse`; los opcionales
 * dependen de `action`.
 */
export class GuardianLinkIssueResponseDto {
  /** Qué tiene que hacer el worker. */
  @ApiProperty({ enum: ['SEND', 'SKIP', 'INVALID_PHONE'] })
  action!: 'SEND' | 'SKIP' | 'INVALID_PHONE';

  /** La invitación. */
  @ApiProperty({ format: 'uuid' })
  invitationId!: string;

  /** Destino en E.164, sólo con `SEND`. */
  @ApiPropertyOptional({ example: '+59171234567' })
  toE164?: string;

  /** Texto a enviar (con el enlace), sólo con `SEND`. */
  @ApiPropertyOptional()
  body?: string;

  /** Por qué no se envía, sólo con `SKIP`. */
  @ApiPropertyOptional()
  reason?: string;
}

/** Cuerpo de `POST /internal/guardian-links/:id/delivery`. */
export class GuardianLinkDeliveryDto {
  /** Lo que decidió el canal. */
  @ApiProperty({ enum: ['SENT', 'FAILED'] })
  @IsIn(['SENT', 'FAILED'])
  outcome!: 'SENT' | 'FAILED';

  /** Canal por el que salió. */
  @ApiProperty({ enum: GUARDIAN_LINK_CHANNELS })
  @IsIn(GUARDIAN_LINK_CHANNELS)
  channel!: GuardianLinkChannel;

  /** Referencia del proveedor (o del doble). */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  providerMessageRef?: string;

  /** Código de error del proveedor. Nunca el texto: puede traer el número. */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  errorCode?: string;
}

/** Respuesta de `delivery`. */
export class GuardianLinkDeliveryResponseDto {
  /** La invitación. */
  @ApiProperty({ format: 'uuid' })
  invitationId!: string;

  /** Estado resultante (`PROF.GUARDIAN_LINK_*`). */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /public/guardian-links/confirm`. */
export class ConfirmGuardianLinkDto {
  /** El token que llegó en el enlace. */
  @ApiProperty({ minLength: 43, maxLength: 43 })
  @IsString()
  @Matches(GUARDIAN_LINK_TOKEN_PATTERN, {
    message: 'El enlace no es válido',
  })
  token!: string;
}

/**
 * Respuesta de la confirmación. Deliberadamente sin datos: quien tiene el
 * enlace no se entera de quién es el paciente.
 */
export class ConfirmGuardianLinkResponseDto {
  /** Siempre `CONFIRMED` si respondió 200. */
  @ApiProperty({ enum: ['CONFIRMED'] })
  status!: 'CONFIRMED';
}
