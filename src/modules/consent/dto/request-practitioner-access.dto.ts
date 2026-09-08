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
} from 'class-validator';

/**
 * Cuerpo de `POST /consent/practitioner-access-requests` (FT-07-R05).
 *
 * Lo manda el profesional después de encontrar al paciente en `/medical-records`
 * (TAREA-07 S1+S3). Pedir NO da acceso: sólo dispara el aviso al paciente.
 */
export class RequestPractitionerAccessDto {
  @ApiProperty({
    description: 'Paciente al que se pide acceso (patient profile id)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({
    description:
      'Especialidades/áreas para las que se pide acceso (concept ids del árbol de especialidades). El paciente decide cuáles de éstas autoriza — FT-07-R06.',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  specialtyConceptIds!: string[];

  @ApiPropertyOptional({
    description: 'Motivo declarado por el profesional (texto libre)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}
