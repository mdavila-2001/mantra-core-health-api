import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /profiles/patients/merge` (UC-05-08). */
export class MergePatientsDto {
  @ApiProperty({
    description: 'Perfil de paciente que sobrevive',
    format: 'uuid',
  })
  @IsUUID()
  survivingPatientProfileId!: string;

  @ApiProperty({
    description: 'Perfil de paciente que se fusiona (perdedor)',
    format: 'uuid',
  })
  @IsUUID()
  mergedPatientProfileId!: string;

  @ApiPropertyOptional({
    description: 'Concept id de la razón de fusión',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;
}

/** Cuerpo de `POST /profiles/patients/merge/{eventId}/reverse` (UC-05-09). */
export class ReverseMergeDto {
  @ApiPropertyOptional({
    description: 'Concept id de la razón de reversión',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;
}

/** Respuesta de un evento de fusión / reversión. */
export class MergeEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  survivingPatientProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  mergedPatientProfileId!: string;

  @ApiProperty({
    description: 'Concept id del estado de la decisión',
    format: 'uuid',
  })
  decisionStatus!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Evento original revertido (si aplica)',
  })
  reversalOfEventId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt!: Date;
}
