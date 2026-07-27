import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /profiles/patients` (UC-05-01): alta de persona + perfil de paciente. */
export class CreatePatientDto {
  @ApiProperty({
    description: 'Código único de paciente (patient_code, UK)',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  patientCode!: string;

  @ApiPropertyOptional({ description: 'Nombre visible de la persona' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento (ISO 8601)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Concept id de género administrativo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  administrativeGenderConceptId?: string;

  @ApiPropertyOptional({
    description: 'Concept id de sexo al nacer',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sexAtBirthConceptId?: string;

  @ApiPropertyOptional({
    description: 'Código MPI maestro (UK)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  masterPatientIndexCode?: string;
}

/** Respuesta de alta de paciente. */
export class PatientProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  profileId!: string;

  @ApiProperty({ format: 'uuid' })
  personId!: string;

  @ApiProperty()
  patientCode!: string;

  @ApiProperty({
    description: 'Concept id del estado de vinculación',
    format: 'uuid',
  })
  recordLinkageStatus!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
