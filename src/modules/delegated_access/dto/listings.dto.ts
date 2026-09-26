import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Una asignación de usuario de organización, para el listado del hub (CV-13). */
export class OrgUserAssignmentSummaryDto {
  /** Identificador único de la asignación. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Membresía del tenant a la que se asigna. */
  @ApiProperty({ format: 'uuid' }) tenantMembershipId!: string;

  /** Práctica de la asignación, si aplica. */
  @ApiPropertyOptional({ format: 'uuid' }) practiceId?: string;

  /** Sede de la asignación, si aplica. */
  @ApiPropertyOptional({ format: 'uuid' }) practiceSiteId?: string;

  /** Concepto del rol de la asignación. */
  @ApiProperty({ format: 'uuid' }) assignmentRoleConceptId!: string;

  /** Concepto del alcance de acceso. */
  @ApiProperty({ format: 'uuid' }) accessScopeConceptId!: string;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;

  /** Inicio de vigencia. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validFrom?: Date;

  /** Fin de vigencia. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validTo?: Date;

  /** Fecha de creación. */
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

/** Página de asignaciones de usuario de organización del tenant del actor. */
export class ListOrgUserAssignmentsResponseDto {
  /** Filas de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [OrgUserAssignmentSummaryDto] })
  items!: OrgUserAssignmentSummaryDto[];

  /** Cantidad devuelta en esta página. */
  @ApiProperty() count!: number;

  /** Tope aplicado a la consulta. */
  @ApiProperty() limit!: number;

  /** Cursor opaco de continuación, o `null` si ésta es la última página. */
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}

/** Una delegación de un profesional a un usuario de organización. */
export class PractitionerDelegateSummaryDto {
  /** Identificador único de la delegación. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Asignación del profesional que delega. */
  @ApiProperty({ format: 'uuid' }) practitionerRoleAssignmentId!: string;

  /** Asignación del usuario que recibe la delegación. */
  @ApiProperty({ format: 'uuid' }) delegateUserAssignmentId!: string;

  /** Set de permisos delegados aplicado. */
  @ApiProperty({ format: 'uuid' }) delegatedPermissionSetId!: string;

  /** Concepto del rol del delegado. */
  @ApiProperty({ format: 'uuid' }) delegateRoleConceptId!: string;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;

  /** Inicio de vigencia. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validFrom?: Date;

  /** Fin de vigencia. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validTo?: Date;

  /** Fecha de creación. */
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

/** Página de delegaciones del tenant del actor. */
export class ListPractitionerDelegatesResponseDto {
  /** Filas de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [PractitionerDelegateSummaryDto] })
  items!: PractitionerDelegateSummaryDto[];

  /** Cantidad devuelta en esta página. */
  @ApiProperty() count!: number;

  /** Tope aplicado a la consulta. */
  @ApiProperty() limit!: number;

  /** Cursor opaco de continuación, o `null` si ésta es la última página. */
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}

/** Una solicitud de acceso delegado pendiente o decidida. */
export class AccessRequestSummaryDto {
  /** Identificador único de la solicitud. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Delegación de la que cuelga la solicitud. */
  @ApiProperty({ format: 'uuid' }) practitionerDelegateAssignmentId!: string;

  /** Permiso solicitado. */
  @ApiProperty({ format: 'uuid' }) requestedPermissionId!: string;

  /** Paciente al que se pide acceso, si aplica. */
  @ApiPropertyOptional({ format: 'uuid' }) patientProfileId?: string;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;

  /** Concepto de la decisión. */
  @ApiProperty({ format: 'uuid' }) decisionConceptId!: string;

  /** Cuándo se pidió. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  requestedAt?: Date;

  /** Cuándo se decidió. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) decidedAt?: Date;
}

/** Página de solicitudes de acceso delegado del tenant del actor. */
export class ListAccessRequestsResponseDto {
  /** Filas de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [AccessRequestSummaryDto] })
  items!: AccessRequestSummaryDto[];

  /** Cantidad devuelta en esta página. */
  @ApiProperty() count!: number;

  /** Tope aplicado a la consulta. */
  @ApiProperty() limit!: number;

  /** Cursor opaco de continuación, o `null` si ésta es la última página. */
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}

/** Un permiso de un set delegado, para el detalle del set (CV-13). */
export class PermissionSetItemSummaryDto {
  /** Identificador único del ítem. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Permiso que concede el ítem. */
  @ApiProperty({ format: 'uuid' }) permissionId!: string;

  /** Si usarlo exige autenticación reforzada. */
  @ApiPropertyOptional() requiresStepUpAuthentication?: boolean;

  /** Restricciones declaradas del ítem, si las hay. */
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  constraint?: Record<string, unknown>;
}

/** Los permisos de un set delegado del tenant del actor. */
export class ListPermissionSetItemsResponseDto {
  /** Set al que pertenecen los ítems. */
  @ApiProperty({ format: 'uuid' }) permissionSetId!: string;

  /** Ítems del set. */
  @ApiProperty({ type: [PermissionSetItemSummaryDto] })
  items!: PermissionSetItemSummaryDto[];
}
