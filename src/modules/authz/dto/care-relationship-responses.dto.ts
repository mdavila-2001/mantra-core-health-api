import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Vista de una relación asistencial (listado por paciente). */
export class CareRelationshipView {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  /**
   * Identificador asociado a relationship type concept.
   */
  @ApiProperty({
    description: 'Concept id del tipo de relación',
    format: 'uuid',
  })
  relationshipTypeConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a purpose concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del propósito acotado',
    format: 'uuid',
  })
  purposeConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  validFrom!: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  validTo?: Date;
}

/** Vista de una representación legal (listado por paciente). */
export class LegalRepresentationView {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Identificador asociado a representative user.
   */
  @ApiProperty({ format: 'uuid' })
  representativeUserId!: string;

  /**
   * Identificador asociado a representation type concept.
   */
  @ApiProperty({
    description: 'Concept id del tipo de representación',
    format: 'uuid',
  })
  representationTypeConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de document ref mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Referencia documental' })
  documentRef?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  validFrom!: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  validTo?: Date;
}
