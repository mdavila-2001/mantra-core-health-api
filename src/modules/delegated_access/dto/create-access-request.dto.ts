import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /practitioner-delegates/{id}/access-requests` (UC-29-04). */
export class CreateAccessRequestDto {
  /**
   * Identificador asociado a requested permission.
   */
  @ApiProperty({ description: 'Permiso solicitado (authz)', format: 'uuid' })
  @IsUUID()
  requestedPermissionId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({ description: 'Paciente objetivo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ description: 'Encuentro objetivo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Justificación de la solicitud' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reasonText?: string;
}
