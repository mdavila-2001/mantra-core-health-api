import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuántas aseguradoras se pueden pedir de una vez (el alta incluida). */
export const MAX_INSURER_REQUESTS_PER_CALL = 20;

/** Largo máximo del motivo de un rechazo; el mismo tope que el de los vínculos. */
export const MAX_INSURER_REJECT_REASON_LENGTH = 500;

/**
 * Los cuatro estados de la solicitud, como los lee el cliente.
 *
 * Viajan como clave y no como uuid de concepto: la pantalla del médico pinta un
 * sello distinto para cada uno, y comparar uuids obligaría a llevarlos escritos
 * en el front.
 */
export type PractitionerInsurerRequestStatus =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

/** Una solicitud del médico a una aseguradora, vista por el propio médico. */
export class PractitionerInsurerRequestDto {
  /** Identificador de la solicitud. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** La aseguradora a la que se le pidió. */
  @ApiProperty({ format: 'uuid' })
  carrierId!: string;

  /** Cómo se la conoce: su sigla comercial si la tiene, si no su razón social. */
  @ApiProperty()
  carrierName!: string;

  /** En qué quedó. */
  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'] })
  status!: PractitionerInsurerRequestStatus;

  /** Por qué la rechazaron, si lo dijeron. Lo escribió la aseguradora. */
  @ApiProperty({ type: String, nullable: true })
  decisionReasonText!: string | null;

  /** Cuándo se pidió (o se volvió a pedir). */
  @ApiProperty()
  createdAt!: Date;

  /** Cuándo decidió la aseguradora; `null` mientras está pendiente. */
  @ApiProperty({ type: Date, nullable: true })
  decidedAt!: Date | null;
}

/** Las solicitudes del médico. */
export class PractitionerInsurerRequestPageDto {
  /** De la más reciente a la más vieja. */
  @ApiProperty({ type: [PractitionerInsurerRequestDto] })
  items!: PractitionerInsurerRequestDto[];

  /** Cuántas son. */
  @ApiProperty()
  count!: number;
}

/** Cuerpo de `POST /practitioners/me/insurer-requests`. */
export class CreatePractitionerInsurerRequestsDto {
  /**
   * Las aseguradoras, del catálogo público (`GET /insurance-carrier-catalog`).
   * Las que ya están pedidas o aprobadas no se duplican.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    minItems: 1,
    maxItems: MAX_INSURER_REQUESTS_PER_CALL,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_INSURER_REQUESTS_PER_CALL)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  carrierIds!: string[];
}

/** Una solicitud recibida, vista por la aseguradora. */
export class ReceivedPractitionerInsurerRequestDto {
  /** Identificador de la solicitud, con el que se aprueba o rechaza. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Profesional que pide. */
  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  /**
   * Cómo se llama quien pide. `null` si no tiene nombre cargado: la pantalla
   * lo cuenta como dato faltante, no como una persona anónima.
   */
  @ApiProperty({ type: String, nullable: true })
  practitionerName!: string | null;

  /** «Médica cardióloga», «Odontólogo». */
  @ApiProperty({ type: String, nullable: true })
  professionalTitle!: string | null;

  /** En qué quedó. */
  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'] })
  status!: PractitionerInsurerRequestStatus;

  /** El motivo, si se rechazó con uno. */
  @ApiProperty({ type: String, nullable: true })
  decisionReasonText!: string | null;

  /** Cuándo se pidió. */
  @ApiProperty()
  createdAt!: Date;

  /** Cuándo se decidió. */
  @ApiProperty({ type: Date, nullable: true })
  decidedAt!: Date | null;
}

/** La bandeja de la aseguradora. */
export class ReceivedPractitionerInsurerRequestPageDto {
  /** Las pendientes primero, por orden de llegada; después las decididas. */
  @ApiProperty({ type: [ReceivedPractitionerInsurerRequestDto] })
  items!: ReceivedPractitionerInsurerRequestDto[];

  /** Cuántas son. */
  @ApiProperty()
  count!: number;
}

/**
 * Cuerpo del rechazo. El motivo es opcional por lo mismo que en los vínculos
 * con organizaciones: exigirlo produce motivos escritos para pasar el validador.
 * Cuando viene, **lo lee el médico**.
 */
export class RejectPractitionerInsurerRequestDto {
  /** Por qué se rechaza. */
  @ApiPropertyOptional({ maxLength: MAX_INSURER_REJECT_REASON_LENGTH })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_INSURER_REJECT_REASON_LENGTH)
  reason?: string;
}
