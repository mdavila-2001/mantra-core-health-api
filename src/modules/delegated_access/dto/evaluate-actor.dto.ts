import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

const PURPOSES = ['TREATMENT', 'BILLING', 'OPERATIONS'] as const;
const RESOURCE_TYPES = ['CLINICAL_NOTE', 'APPOINTMENT', 'PRESCRIPTION'] as const;

/** Cuerpo de `POST /authz/effective-actor/evaluate` (UC-29-09). */
export class EvaluateActorDto {
  @ApiProperty({ description: 'Delegación a evaluar', format: 'uuid' })
  @IsUUID()
  practitionerDelegateAssignmentId!: string;

  @ApiProperty({ description: 'Propósito de uso del acceso', enum: PURPOSES })
  @IsIn(PURPOSES as unknown as string[])
  purpose!: (typeof PURPOSES)[number];

  @ApiPropertyOptional({ description: 'Permiso concreto que se ejerce', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  permissionId?: string;

  @ApiPropertyOptional({ description: 'Paciente sobre el que se accede', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ description: 'Encuentro sobre el que se accede', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ description: 'Tipo de recurso', enum: RESOURCE_TYPES })
  @IsOptional()
  @IsIn(RESOURCE_TYPES as unknown as string[])
  resourceType?: (typeof RESOURCE_TYPES)[number];
}
