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
  @ApiPropertyOptional({
    description: 'Persona relacionada existente; si se omite se crea una nueva',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  personId?: string;

  @ApiPropertyOptional({ description: 'Nombre visible (si se crea la persona relacionada)' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Fecha de nacimiento (ISO date)', format: 'date' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Concept id del parentesco/relación', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  relationshipConceptId?: string;

  @ApiPropertyOptional({ description: 'Es contacto de emergencia', default: false })
  @IsOptional()
  @IsBoolean()
  isEmergencyContact?: boolean;

  @ApiPropertyOptional({ description: 'Es tutor legal (único activo por paciente)', default: false })
  @IsOptional()
  @IsBoolean()
  isLegalGuardian?: boolean;
}

/** Respuesta de alta de persona relacionada. */
export class RelatedPersonResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  personId!: string;

  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
