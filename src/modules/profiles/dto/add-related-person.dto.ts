import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /profiles/patients/{profileId}/related-persons` (UC-05-10). */
export class AddRelatedPersonDto {
  /**
   * Identificador asociado a person.
   */
  @ApiPropertyOptional({
    description: 'Persona relacionada existente; si se omite se crea una nueva',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  personId?: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nombre visible (si se crea la persona relacionada)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  displayName?: string;

  /**
   * Valor de birth date mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Fecha de nacimiento (ISO date)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  /**
   * Identificador asociado a relationship concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del parentesco/relación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  relationshipConceptId?: string;

  /**
   * Valor de is emergency contact mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Es contacto de emergencia',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isEmergencyContact?: boolean;

  /**
   * Valor de is legal guardian mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Es tutor legal (único activo por paciente)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isLegalGuardian?: boolean;
}

/** Respuesta de alta de persona relacionada. */
export class RelatedPersonResponseDto {
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
   * Identificador asociado a person.
   */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
