import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { RegisterSupportStaffDto } from '../../iam/presentation/dto/register-support-staff.dto';
import {
  SUPPORT_TARGET_KINDS,
  type SupportTargetKind,
} from '../domain/support-links';

/**
 * Cuerpo para crear una secretaria directamente desde la sesión del hospital.
 * Crea la cuenta, persona, perfil de secretaria, membresía activa del hospital
 * y el vínculo de apoyo ACTIVO en un único paso atómico.
 */
export class CreateOrgSupportStaffDto extends RegisterSupportStaffDto {
  /** Alcance del vínculo dentro de la organización. Por omisión ORGANIZATION. */
  @ApiPropertyOptional({ enum: SUPPORT_TARGET_KINDS, default: 'ORGANIZATION' })
  @IsOptional()
  @IsIn(SUPPORT_TARGET_KINDS)
  targetKind?: SupportTargetKind;

  /** Sede física específica (`targetKind: SITE`). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  /** Unidad clínica o servicio (`targetKind: SERVICE`). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /** Piso o consultorio específico (`targetKind: SPACE`). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;

  /** Doctor específico al que asistirá (`targetKind: PRACTITIONER`). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practitionerRoleAssignmentId?: string;
}
