import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

/** Quién abrió la vinculación. */
export const ROLE_ASSIGNMENT_INITIATORS = ['PRACTICE', 'PRACTITIONER'] as const;

/** Tope de procedimientos en una invitación: una fila por cada uno. */
export const MAX_INVITED_SERVICES = 50;

/**
 * Una afiliación de un profesional a un procedimiento de una sede.
 *
 * Cada procedimiento es una fila con su propio estado, de modo que aceptar,
 * rechazar, aprobar o declinar actúan sobre **una** fila.
 */
export class RoleAssignmentRowDto {
  /** Identificador de la afiliación. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Profesional afiliado. */
  @ApiProperty({ format: 'uuid' }) practitionerProfileId!: string;
  /** Nombre legible del profesional. */
  @ApiProperty() practitionerName!: string;
  /** Organización. */
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  /** Sede; `null` en una vinculación antigua que no declara sede. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  practiceSiteId!: string | null;
  /** Servicio ofrecido por la sede; `null` si la vinculación no es por procedimiento. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  healthcareServiceId!: string | null;
  /** Procedimiento del nomenclador del servicio; `null` sin servicio. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  serviceConceptId!: string | null;
  /** Nombre del procedimiento para mostrar; `null` sin servicio. */
  @ApiProperty({ nullable: true, type: String })
  serviceDisplay!: string | null;
  /** Concepto del estado (uuid). */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
  /** Código del concepto del estado (`ROLE_ASG_ACTIVE`, …); el front compara por código. */
  @ApiProperty() statusCode!: string;
  /**
   * Quién abrió la afiliación. Se deriva de la cuenta que creó la fila: si es
   * la del propio profesional, `PRACTITIONER`; si no, `PRACTICE`.
   */
  @ApiProperty({ enum: ROLE_ASSIGNMENT_INITIATORS })
  initiatedBy!: (typeof ROLE_ASSIGNMENT_INITIATORS)[number];
}

/** Respuesta de la invitación: una fila por procedimiento. */
export class RoleAssignmentRowsResponseDto {
  /** Filas creadas, en el orden pedido. */
  @ApiProperty({ type: () => [RoleAssignmentRowDto] })
  items!: RoleAssignmentRowDto[];
}

/** Cuerpo de `POST /practices/{practiceId}/role-assignments/invitations`. */
export class InvitePractitionerDto {
  /** Profesional que se invita. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practitionerProfileId!: string;

  /** Sede donde trabajaría. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceSiteId!: string;

  /** Procedimientos de esa sede en los que trabajaría; una fila por cada uno. */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    minItems: 1,
    maxItems: MAX_INVITED_SERVICES,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_INVITED_SERVICES)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  healthcareServiceIds!: string[];
}

/** Una fila de la lista de vinculaciones del centro, con lo que ya traía la lista. */
export class PracticeRoleAssignmentItemDto extends RoleAssignmentRowDto {
  /** Estado como uuid de concepto, igual que antes de las filas por procedimiento. */
  @ApiProperty() status!: string;
  /** Fecha de creación de la vinculación. */
  @ApiProperty() createdAt!: Date;
}
