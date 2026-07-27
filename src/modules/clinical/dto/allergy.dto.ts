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
  @ApiProperty({ description: 'Manifestación (concept id)', format: 'uuid' })
  @IsUUID()
  manifestationConceptId!: string;

  @ApiPropertyOptional({
    description: 'Severidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  severityConceptId?: string;

  @ApiPropertyOptional({ description: 'Descripción libre' })
  @IsOptional()
  @IsString()
  description?: string;
}

/** Cuerpo de `POST /clinical/allergy-intolerances` (UC-08-09). */
export class CreateAllergyIntoleranceDto {
  @ApiProperty({
    description: 'Tenant custodio (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  custodianTenantId!: string;

  @ApiProperty({
    description: 'Paciente (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({
    description: 'Sustancia alergénica (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  substanceConceptId!: string;

  @ApiPropertyOptional({ description: 'Tipo (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  typeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Categoría (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  @ApiPropertyOptional({
    description: 'Criticidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  criticalityConceptId?: string;

  @ApiPropertyOptional({ type: [AllergyReactionInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllergyReactionInput)
  reactions?: AllergyReactionInput[];
}

/** Respuesta tras registrar una alergia. */
export class AllergyIntoleranceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({
    description: 'Estado clínico (concept id)',
    format: 'uuid',
    nullable: true,
  })
  clinicalStatus!: string | null;

  @ApiProperty({ type: [String], description: 'Ids de reacciones creadas' })
  reactionIds!: string[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
