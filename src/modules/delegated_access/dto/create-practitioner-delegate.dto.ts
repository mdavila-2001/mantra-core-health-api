import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

const DELEGATE_ROLES = ['ASSISTANT', 'SECRETARY', 'NURSE'] as const;
const PATIENT_SCOPES = ['ASSIGNED', 'ALL'] as const;
const APPOINTMENT_SCOPES = ['TODAY', 'ALL'] as const;

/** Cuerpo de `POST /practitioner-delegates` (UC-29-03). */
export class CreatePractitionerDelegateDto {
  @ApiProperty({
    description: 'Asignación de rol del practitioner delegante',
    format: 'uuid',
  })
  @IsUUID()
  practitionerRoleAssignmentId!: string;

  @ApiProperty({
    description: 'Asignación de usuario de organización (delegado)',
    format: 'uuid',
  })
  @IsUUID()
  delegateUserAssignmentId!: string;

  @ApiProperty({
    description: 'Set de permisos delegados a aplicar',
    format: 'uuid',
  })
  @IsUUID()
  delegatedPermissionSetId!: string;

  @ApiPropertyOptional({
    description: 'Rol del delegado',
    enum: DELEGATE_ROLES,
  })
  @IsOptional()
  @IsIn(DELEGATE_ROLES)
  delegateRole?: (typeof DELEGATE_ROLES)[number];

  @ApiPropertyOptional({
    description: 'Alcance de pacientes',
    enum: PATIENT_SCOPES,
  })
  @IsOptional()
  @IsIn(PATIENT_SCOPES)
  patientScope?: (typeof PATIENT_SCOPES)[number];

  @ApiPropertyOptional({
    description: 'Alcance de citas',
    enum: APPOINTMENT_SCOPES,
  })
  @IsOptional()
  @IsIn(APPOINTMENT_SCOPES)
  appointmentScope?: (typeof APPOINTMENT_SCOPES)[number];

  @ApiPropertyOptional({ description: 'Puede ver contenido clínico' })
  @IsOptional()
  @IsBoolean()
  mayViewClinicalContent?: boolean;

  @ApiPropertyOptional({ description: 'Puede editar borradores' })
  @IsOptional()
  @IsBoolean()
  mayEditDrafts?: boolean;

  @ApiPropertyOptional({
    description: 'Inicio de vigencia (ISO)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({
    description: 'Fin de vigencia (ISO)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}
