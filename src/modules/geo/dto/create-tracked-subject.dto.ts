import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

/** Tipos de sujeto rastreable (value_set cerrado, REC 3.1). */
export type SubjectTypeCode = 'PERSON' | 'VEHICLE';

/** Cuerpo de `POST /geo/tracked-subjects` (UC-13-01). */
export class CreateTrackedSubjectDto {
  @ApiProperty({
    description: 'Id del recurso rastreado (ambulancia/persona)',
    format: 'uuid',
  })
  @IsUUID()
  subjectId!: string;

  @ApiPropertyOptional({
    description: 'Tipo de sujeto (discriminador polimórfico)',
    enum: ['PERSON', 'VEHICLE'],
    default: 'PERSON',
  })
  @IsOptional()
  @IsIn(['PERSON', 'VEHICLE'])
  subjectType?: SubjectTypeCode;

  @ApiPropertyOptional({
    description: 'Dispositivo GPS asociado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'Tenant propietario (RLS)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
