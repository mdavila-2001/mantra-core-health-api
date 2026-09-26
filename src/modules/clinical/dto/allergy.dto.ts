import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

/** Reacción asociada a una alergia (manifestación + severidad). */
export class AllergyReactionInput {
  /**
   * Identificador asociado a manifestation concept.
   */
  @ApiProperty({ description: 'Manifestación (concept id)', format: 'uuid' })
  @IsUUID()
  manifestationConceptId!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @ApiPropertyOptional({
    description: 'Severidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  severityConceptId?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Descripción libre' })
  @IsOptional()
  @IsString()
  description?: string;
}

/** Cuerpo de `POST /clinical/allergy-intolerances` (UC-08-09). */
export class CreateAllergyIntoleranceDto {
  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiProperty({
    description: 'Tenant custodio (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  custodianTenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Encuentro en el que se detectó la alergia (P26 / CL-01).
   *
   * Opcional a propósito: hay alergias declaradas fuera de una atención. Cuando
   * viaja, el servicio exige que el encuentro sea del mismo paciente (422 si no),
   * con el mismo criterio que `indicationConditionId` en las recetas.
   */
  @ApiPropertyOptional({
    description: 'Encuentro en el que se detectó (clinical.encounters)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a substance concept.
   */
  @ApiProperty({
    description: 'Sustancia alergénica (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  substanceConceptId!: string;

  /**
   * Identificador asociado a type concept.
   */
  @ApiPropertyOptional({ description: 'Tipo (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  typeConceptId?: string;

  /**
   * Identificador asociado a category concept.
   */
  @ApiPropertyOptional({
    description: 'Categoría (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  /**
   * Identificador asociado a criticality concept.
   */
  @ApiPropertyOptional({
    description: 'Criticidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  criticalityConceptId?: string;

  /**
   * Valor de reactions mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [AllergyReactionInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllergyReactionInput)
  reactions?: AllergyReactionInput[];
}

/** Respuesta tras registrar una alergia. */
export class AllergyIntoleranceResponseDto {
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
   * Encuentro en el que se detectó, si se registró dentro de una atención.
   */
  @ApiProperty({ format: 'uuid', nullable: true })
  encounterId!: string | null;

  /**
   * Valor de clinical status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Estado clínico (concept id)',
    format: 'uuid',
    nullable: true,
  })
  clinicalStatus!: string | null;

  /**
   * Valor de reaction ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de reacciones creadas' })
  reactionIds!: string[];

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Cuerpo de `POST /clinical/allergy-intolerances/:id/attachments` (P25). */
export class AttachFileToAllergyIntoleranceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  fileId!: string;
}
