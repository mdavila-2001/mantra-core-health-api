import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumberString,
  IsOptional,
  IsUUID,
} from 'class-validator';

/** Cuerpo de `POST /billing/patient-statements:generate` (UC-17-09). */
export class GeneratePatientStatementDto {
  @ApiProperty({ description: 'Práctica (practice.practices)', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({
    description: 'Paciente (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ description: 'Inicio del periodo (ISO)' })
  @IsDateString()
  periodStart!: string;

  @ApiProperty({ description: 'Fin del periodo (ISO)' })
  @IsDateString()
  periodEnd!: string;

  @ApiPropertyOptional({
    description: 'Saldo de apertura; por defecto 0.00',
    example: '0.00',
  })
  @IsOptional()
  @IsNumberString()
  openingBalance?: string;

  @ApiPropertyOptional({
    description:
      'Tenant (directory.tenants); requerido para vincular las facturas incluidas',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

/** Respuesta con el estado de cuenta generado. */
export class PatientStatementResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty()
  periodStart!: string;

  @ApiProperty()
  periodEnd!: string;

  @ApiProperty()
  openingBalance!: string;

  @ApiProperty()
  charges!: string;

  @ApiProperty()
  payments!: string;

  @ApiProperty()
  closingBalance!: string;
}
