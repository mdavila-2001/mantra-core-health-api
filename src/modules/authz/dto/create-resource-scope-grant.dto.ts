import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsUUID } from 'class-validator';
import { EFFECTS, type Effect } from './create-access-policy.dto';

/** Tipos de sujeto de un grant polimórfico. */
export const SUBJECT_TYPES = ['USER', 'ROLE', 'SERVICE'] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

/** Tipos de recurso de un grant polimórfico. */
export const RESOURCE_TYPES = ['PATIENT', 'ENCOUNTER', 'DOCUMENT', 'RECORD'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

/** Cuerpo de `POST /authz/resource-scope-grants` (UC-06-09). */
export class CreateResourceScopeGrantDto {
  @ApiProperty({ description: 'Tipo de sujeto', enum: SUBJECT_TYPES })
  @IsIn(SUBJECT_TYPES)
  subjectType!: SubjectType;

  @ApiProperty({ description: 'Id del sujeto (validado contra su value set)', format: 'uuid' })
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ description: 'Permiso concedido/denegado', format: 'uuid' })
  @IsUUID()
  permissionId!: string;

  @ApiProperty({ description: 'Tipo de recurso', enum: RESOURCE_TYPES })
  @IsIn(RESOURCE_TYPES)
  resourceType!: ResourceType;

  @ApiProperty({ description: 'Id del recurso concreto', format: 'uuid' })
  @IsUUID()
  resourceId!: string;

  @ApiProperty({ description: 'Efecto', enum: EFFECTS })
  @IsIn(EFFECTS)
  effect!: Effect;

  @ApiPropertyOptional({ description: 'Tenant del grant', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Inicio de vigencia', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Fin de vigencia', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date;
}
