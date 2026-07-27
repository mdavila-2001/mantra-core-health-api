import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export const DSAR_TYPES = [
  'ACCESS',
  'ERASURE',
  'RECTIFICATION',
  'PORTABILITY',
  'OBJECTION',
] as const;
export const DSAR_TRANSITIONS = [
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
] as const;

/** Cuerpo de `POST /privacy/dsar` (UC-10-08). */
export class CreateDsarDto {
  @ApiProperty({
    description: 'Tipo de solicitud del titular',
    enum: DSAR_TYPES,
  })
  @IsIn(DSAR_TYPES)
  type!: string;

  @ApiPropertyOptional({
    description: 'Titular de los datos (FK iam.users); por defecto el actor',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Jurisdicción aplicable',
    enum: ['PE', 'EU', 'US'],
  })
  @IsOptional()
  @IsIn(['PE', 'EU', 'US'])
  jurisdiction?: string;
}

/** Cuerpo de `PATCH /privacy/dsar/{id}` (UC-10-08). */
export class UpdateDsarDto {
  @ApiProperty({
    description: 'Nuevo estado de la máquina DSAR',
    enum: DSAR_TRANSITIONS,
  })
  @IsIn(DSAR_TRANSITIONS)
  status!: string;

  @ApiPropertyOptional({
    description: 'Paquete DSAR resultante (FK common.files)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  resultFileId?: string;
}

/** Respuesta de una solicitud DSAR. */
export class DsarResponseDto {
  @ApiProperty({ description: 'Id de la solicitud' })
  id!: string;

  @ApiProperty({ description: 'Titular de los datos' })
  userId!: string;

  @ApiProperty({ description: 'Estado actual (concepto)' })
  status!: string;

  @ApiProperty({ description: 'Tipo (concepto)' })
  type!: string;

  @ApiProperty({ description: 'Versión de fila optimista' })
  rowVersion!: number;

  @ApiProperty({
    description: 'Solicitada el',
    type: String,
    format: 'date-time',
  })
  requestedAt!: Date;

  @ApiPropertyOptional({
    description: 'Completada el',
    type: String,
    format: 'date-time',
  })
  completedAt?: Date | null;
}
