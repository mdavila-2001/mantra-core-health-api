import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Vista de una relación asistencial (listado por paciente). */
export class CareRelationshipView {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  @ApiProperty({ description: 'Concept id del tipo de relación', format: 'uuid' })
  relationshipTypeConceptId!: string;

  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({
    description: 'Concept id del propósito acotado',
    format: 'uuid',
  })
  purposeConceptId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  validFrom!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  validTo?: Date;
}

/** Vista de una representación legal (listado por paciente). */
export class LegalRepresentationView {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  representativeUserId!: string;

  @ApiProperty({
    description: 'Concept id del tipo de representación',
    format: 'uuid',
  })
  representationTypeConceptId!: string;

  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ description: 'Referencia documental' })
  documentRef?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  validFrom!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  validTo?: Date;
}
