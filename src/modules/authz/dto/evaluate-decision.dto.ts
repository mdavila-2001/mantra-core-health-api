import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PERMISSION_ACTIONS,
  type PermissionAction,
} from './create-permission.dto';
import {
  RESOURCE_TYPES,
  type ResourceType,
} from './create-resource-scope-grant.dto';

/** Propósito de uso presentado por el PDP (incluye emergencia). */
export const DECISION_PURPOSES = [
  'TREATMENT',
  'PAYMENT',
  'OPERATIONS',
  'EMERGENCY',
] as const;
export type DecisionPurpose = (typeof DECISION_PURPOSES)[number];

/**
 * Cuerpo de `POST /authz/decisions:evaluate` (UC-06-12).
 *
 * Nota de enrutado: en Express 5 / path-to-regexp v8 el carácter `:` inicia un
 * parámetro nombrado, por lo que el endpoint se sirve en la ruta equivalente
 * `POST /authz/decisions/evaluate` (documentado en el README del módulo).
 */
export class EvaluateDecisionDto {
  @ApiProperty({ description: 'Usuario sujeto de la decisión', format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ description: 'Tenant de la evaluación', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Acción evaluada', enum: PERMISSION_ACTIONS })
  @IsIn(PERMISSION_ACTIONS)
  action!: PermissionAction;

  @ApiProperty({
    description: 'Recurso protegido (debe casar con permissions.resource)',
    maxLength: 150,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  resource!: string;

  @ApiPropertyOptional({
    description: 'Tipo de recurso concreto',
    enum: RESOURCE_TYPES,
  })
  @IsOptional()
  @IsIn(RESOURCE_TYPES)
  resourceType?: ResourceType;

  @ApiPropertyOptional({
    description: 'Id del recurso concreto',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional({
    description: 'Perfil de paciente si el recurso es clínico',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({
    description:
      'Perfil de practicante del actor (habilita evaluación de relación asistencial C-06)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practitionerProfileId?: string;

  @ApiPropertyOptional({
    description: 'Propósito de uso',
    enum: DECISION_PURPOSES,
  })
  @IsOptional()
  @IsIn(DECISION_PURPOSES)
  purposeOfUse?: DecisionPurpose;
}
