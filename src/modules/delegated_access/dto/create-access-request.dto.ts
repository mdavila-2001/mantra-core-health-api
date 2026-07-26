import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /practitioner-delegates/{id}/access-requests` (UC-29-04). */
export class CreateAccessRequestDto {
  @ApiProperty({ description: 'Permiso solicitado (authz)', format: 'uuid' })
  @IsUUID()
  requestedPermissionId!: string;

  @ApiPropertyOptional({ description: 'Paciente objetivo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ description: 'Encuentro objetivo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ description: 'Justificación de la solicitud' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reasonText?: string;
}
