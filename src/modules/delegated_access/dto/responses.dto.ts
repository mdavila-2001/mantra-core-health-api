import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta genérica de creación de un recurso de delegación. */
export class ResourceCreatedDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta de publicación de set/versión de permisos delegados. */
export class PermissionSetVersionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Número de versión publicada' })
  versionNumber!: number;

  @ApiProperty({ description: 'Nº de ítems de permiso de la versión' })
  itemCount!: number;
}

/** Resultado de una operación de estado (revoke, patch). */
export class OperationResultDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}

/** Resultado de la decisión sobre una solicitud de acceso (UC-29-05). */
export class DecisionResultDto {
  @ApiProperty({ format: 'uuid', description: 'Solicitud decidida' })
  requestId!: string;

  @ApiProperty({ description: 'Decisión aplicada (APPROVED|DENIED)' })
  decision!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Grant emitido si fue aprobada' })
  grantId?: string;
}

/** Resultado del barrido de expiración (UC-29-08). */
export class ExpirySweepResultDto {
  @ApiProperty({ description: 'Grants expirados' })
  expiredGrants!: number;

  @ApiProperty({ description: 'Delegaciones de practitioner expiradas' })
  expiredDelegations!: number;

  @ApiProperty({ description: 'Asignaciones de organización expiradas' })
  expiredOrgAssignments!: number;
}

/** Resultado de la evaluación del actor efectivo (UC-29-09). */
export class EvaluationResultDto {
  @ApiProperty({ description: 'Si el acceso está permitido' })
  allowed!: boolean;

  @ApiProperty({ description: 'Si exige step-up antes de permitir' })
  requiresStepUp!: boolean;

  @ApiPropertyOptional({ description: 'Motivo cuando no se permite' })
  reason?: string;
}
