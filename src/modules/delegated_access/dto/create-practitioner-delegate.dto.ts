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
  /**
   * Identificador asociado a practitioner role assignment.
   */
  @ApiProperty({
    description: 'Asignación de rol del practitioner delegante',
    format: 'uuid',
  })
  @IsUUID()
  practitionerRoleAssignmentId!: string;

  /**
   * Identificador asociado a delegate user assignment.
   */
  @ApiProperty({
    description: 'Asignación de usuario de organización (delegado)',
    format: 'uuid',
  })
  @IsUUID()
  delegateUserAssignmentId!: string;

  /**
   * Identificador asociado a delegated permission set.
   */
  @ApiProperty({
    description: 'Set de permisos delegados a aplicar',
    format: 'uuid',
  })
  @IsUUID()
  delegatedPermissionSetId!: string;

  /**
   * Valor de delegate role mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Rol del delegado',
    enum: DELEGATE_ROLES,
  })
  @IsOptional()
  @IsIn(DELEGATE_ROLES)
  delegateRole?: (typeof DELEGATE_ROLES)[number];

  /**
   * Valor de patient scope mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Alcance de pacientes',
    enum: PATIENT_SCOPES,
  })
  @IsOptional()
  @IsIn(PATIENT_SCOPES)
  patientScope?: (typeof PATIENT_SCOPES)[number];

  /**
   * Valor de appointment scope mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Alcance de citas',
    enum: APPOINTMENT_SCOPES,
  })
  @IsOptional()
  @IsIn(APPOINTMENT_SCOPES)
  appointmentScope?: (typeof APPOINTMENT_SCOPES)[number];

  /**
   * Valor de may view clinical content mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Puede ver contenido clínico' })
  @IsOptional()
  @IsBoolean()
  mayViewClinicalContent?: boolean;

  /**
   * Valor de may edit drafts mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Puede editar borradores' })
  @IsOptional()
  @IsBoolean()
  mayEditDrafts?: boolean;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia (ISO)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Fin de vigencia (ISO)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}
