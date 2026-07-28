import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta genérica de creación de un recurso de delegación. */
export class ResourceCreatedDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta de publicación de set/versión de permisos delegados. */
export class PermissionSetVersionDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de versión publicada' })
  versionNumber!: number;

  /**
   * Valor de item count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de ítems de permiso de la versión' })
  itemCount!: number;
}

/** Resultado de una operación de estado (revoke, patch). */
export class OperationResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ example: true })
  ok!: boolean;
}

/** Resultado de la decisión sobre una solicitud de acceso (UC-29-05). */
export class DecisionResultDto {
  /**
   * Identificador asociado a request.
   */
  @ApiProperty({ format: 'uuid', description: 'Solicitud decidida' })
  requestId!: string;

  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({ description: 'Decisión aplicada (APPROVED|DENIED)' })
  decision!: string;

  /**
   * Identificador asociado a grant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Grant emitido si fue aprobada',
  })
  grantId?: string;
}

/** Resultado del barrido de expiración (UC-29-08). */
export class ExpirySweepResultDto {
  /**
   * Valor de expired grants mantenido por la instancia.
   */
  @ApiProperty({ description: 'Grants expirados' })
  expiredGrants!: number;

  /**
   * Valor de expired delegations mantenido por la instancia.
   */
  @ApiProperty({ description: 'Delegaciones de practitioner expiradas' })
  expiredDelegations!: number;

  /**
   * Valor de expired org assignments mantenido por la instancia.
   */
  @ApiProperty({ description: 'Asignaciones de organización expiradas' })
  expiredOrgAssignments!: number;
}

/** Resultado de la evaluación del actor efectivo (UC-29-09). */
export class EvaluationResultDto {
  /**
   * Valor de allowed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Si el acceso está permitido' })
  allowed!: boolean;

  /**
   * Valor de requires step up mantenido por la instancia.
   */
  @ApiProperty({ description: 'Si exige step-up antes de permitir' })
  requiresStepUp!: boolean;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo cuando no se permite' })
  reason?: string;
}
