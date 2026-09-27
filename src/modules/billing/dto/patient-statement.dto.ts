import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumberString,
  IsOptional,
  IsUUID,
} from 'class-validator';

/** Cuerpo de `POST /billing/patient-statements:generate` (UC-17-09). */
export class GeneratePatientStatementDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ description: 'Práctica (practice.practices)', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

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
   * Valor de period start mantenido por la instancia.
   */
  @ApiProperty({ description: 'Inicio del periodo (ISO)' })
  @IsDateString()
  periodStart!: string;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @ApiProperty({ description: 'Fin del periodo (ISO)' })
  @IsDateString()
  periodEnd!: string;

  /**
   * Valor de opening balance mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Saldo de apertura; por defecto 0.00',
    example: '0.00',
  })
  @IsOptional()
  @IsNumberString()
  openingBalance?: string;

  /**
   * Identificador asociado a tenant.
   */
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
   * Valor de period start mantenido por la instancia.
   */
  @ApiProperty()
  periodStart!: string;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @ApiProperty()
  periodEnd!: string;

  /**
   * Valor de opening balance mantenido por la instancia.
   */
  @ApiProperty()
  openingBalance!: string;

  /**
   * Valor de charges mantenido por la instancia.
   */
  @ApiProperty()
  charges!: string;

  /**
   * Valor de payments mantenido por la instancia.
   */
  @ApiProperty()
  payments!: string;

  /**
   * Valor de closing balance mantenido por la instancia.
   */
  @ApiProperty()
  closingBalance!: string;
}

/** Página de estados de cuenta de la práctica (CV-12). */
export class ListPatientStatementsResponseDto {
  /** Estados de cuenta de esta página, ordenados por `id`. */
  @ApiProperty({ type: [PatientStatementResponseDto] })
  items!: PatientStatementResponseDto[];

  /** Cantidad devuelta en esta página. */
  @ApiProperty() count!: number;

  /** Tope aplicado a la consulta. */
  @ApiProperty() limit!: number;

  /** Cursor opaco de continuación, o `null` si ésta es la última página. */
  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;
}
