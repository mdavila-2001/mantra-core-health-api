import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Largo máximo del motivo de un rechazo. */
export const MAX_REJECT_REASON_LENGTH = 500;

/**
 * Una solicitud de vínculo esperando decisión de la organización (TP-2).
 *
 * Trae lo que hace falta para decidir y **nada más**: quién pide, para qué
 * sede, con qué cargo y desde cuándo. Ningún dato clínico y ningún dato
 * personal del profesional más allá de su perfil profesional, que es público.
 */
export class AffiliationRequestDto {
  /** Identificador de la solicitud, con el que se aprueba o rechaza. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Profesional que pide el vínculo. */
  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  /**
   * Cómo se llama quien pide, para poder decidir.
   *
   * Sin esto la bandeja mostraba cargo, institución y fecha, y ningún nombre:
   * quien administra la organización tenía que aprobar o rechazar a un
   * identificador. Nadie acepta a alguien que no sabe quién es —y si acepta
   * igual, es peor—, así que el pedido viaja identificado.
   *
   * `null` si el profesional no tiene nombre cargado, que la pantalla debe
   * contar como dato faltante y no como una persona anónima.
   */
  @ApiProperty({ type: String, nullable: true })
  practitionerName!: string | null;

  /**
   * Matrícula del Ministerio, que es lo que lo habilita a ejercer.
   *
   * Es el dato con el que una organización verifica de verdad a quien le pide
   * entrar: el nombre dice quién dice ser, la matrícula dice si puede.
   */
  @ApiProperty({ type: String, nullable: true })
  practitionerLicense!: string | null;

  /** Institución tal como la declaró el profesional. */
  @ApiProperty()
  organizationName!: string;

  /** Cargo declarado. */
  @ApiProperty()
  roleTitle!: string;

  /** Sede de la organización a la que apunta el pedido. */
  @ApiProperty({ format: 'uuid', nullable: true })
  practiceSiteId!: string | null;

  /** Desde cuándo dice que el vínculo empieza. */
  @ApiProperty()
  startDate!: Date;

  /** Estado del vínculo. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** Cuándo se pidió. */
  @ApiProperty()
  createdAt!: Date;
}

/** La bandeja de la organización. */
export class AffiliationRequestListDto {
  /** Las solicitudes pendientes, de la más reciente a la más antigua. */
  @ApiProperty({ type: [AffiliationRequestDto] })
  items!: AffiliationRequestDto[];
}

/**
 * Cuerpo del rechazo de una solicitud.
 *
 * El motivo es opcional porque exigirlo produciría motivos escritos para pasar
 * el validador («no», «.») que no le dicen nada a nadie. Quien se toma el
 * trabajo de escribirlo es porque tiene algo que decir.
 *
 * Hoy el motivo **no se persiste**: `practitioner_affiliations` no tiene
 * columna donde escribirlo y agregarla es un cambio de esquema. Viaja al
 * registro estructurado; devolvérselo al profesional queda anotado como
 * bloqueador.
 */
export class RejectAffiliationDto {
  /** Por qué se rechaza. */
  @ApiPropertyOptional({ maxLength: MAX_REJECT_REASON_LENGTH })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_REJECT_REASON_LENGTH)
  reason?: string;
}
