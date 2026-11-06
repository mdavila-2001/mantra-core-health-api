import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Fila del listado de pacientes (UC-05-13).
 *
 * Trae lo justo para pintar una tabla y decidir a cuál entrar; la ficha
 * completa es {@link PatientDetailResponseDto}. Los `*ConceptId` viajan como
 * uuid, igual que en el resto del contrato: se traducen a etiqueta con
 * `GET /terminology/concepts?ids=…`.
 */
export class PatientListItemDto {
  /**
   * Identificador asociado a profile.
   */
  @ApiProperty({ format: 'uuid' })
  profileId!: string;

  /**
   * Identificador asociado a person.
   */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /**
   * Valor de patient code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código único de paciente' })
  patientCode!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nombre visible de la persona' })
  displayName?: string;

  /**
   * Valor de birth date mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  birthDate?: Date;

  /**
   * Identificador asociado a person status concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del estado de la persona',
    format: 'uuid',
  })
  personStatusConceptId?: string;

  /**
   * Valor de deceased mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Si la persona está registrada como fallecida. Es un booleano derivado y no un concepto: una lista de pacientes tiene que poder marcarlo sin resolver terminología',
  })
  deceased!: boolean;

  /** Masked national id (last digits only) to tell homonyms apart. */
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description:
      'Documento enmascarado (sólo los últimos dígitos), para distinguir homónimos',
  })
  nationalIdMasked!: string | null;

  /** Whether the person has an own portal account that receives notices. */
  @ApiProperty({
    description:
      'Si la persona tiene cuenta propia en la plataforma: sin ella, una solicitud de vinculación no le llega',
  })
  hasAccount!: boolean;
}
