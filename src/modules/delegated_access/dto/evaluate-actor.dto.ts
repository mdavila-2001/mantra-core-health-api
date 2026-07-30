import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

const PURPOSES = ['TREATMENT', 'BILLING', 'OPERATIONS'] as const;
const RESOURCE_TYPES = [
  'CLINICAL_NOTE',
  'APPOINTMENT',
  'PRESCRIPTION',
] as const;

/** Cuerpo de `POST /authz/effective-actor/evaluate` (UC-29-09). */
export class EvaluateActorDto {
  /**
   * Identificador asociado a practitioner delegate assignment.
   */
  @ApiProperty({ description: 'Delegación a evaluar', format: 'uuid' })
  @IsUUID()
  practitionerDelegateAssignmentId!: string;

  /**
   * Valor de purpose mantenido por la instancia.
   */
  @ApiProperty({ description: 'Propósito de uso del acceso', enum: PURPOSES })
  @IsIn(PURPOSES)
  purpose!: (typeof PURPOSES)[number];

  /**
   * Identificador asociado a permission.
   */
  @ApiPropertyOptional({
    description: 'Permiso concreto que se ejerce',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  permissionId?: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({
    description: 'Paciente sobre el que se accede',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({
    description: 'Encuentro sobre el que se accede',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Valor de resource type mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tipo de recurso', enum: RESOURCE_TYPES })
  @IsOptional()
  @IsIn(RESOURCE_TYPES)
  resourceType?: (typeof RESOURCE_TYPES)[number];
}
