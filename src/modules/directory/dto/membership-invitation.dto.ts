import { ApiProperty } from '@nestjs/swagger';

/** Una membresía que una organización creó para la persona y que ella aún no aceptó. */
export class MembershipInvitationDto {
  /** Identificador de la membresía pendiente (el que se pasa a aceptar o rechazar). */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Organización que incorporó a la persona. */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /** Nombre de la organización (comercial, legal o código). */
  @ApiProperty()
  tenantName!: string;

  /** Rol con el que la incorporan: `OWNER`, `ADMIN` o `STAFF`. */
  @ApiProperty({ enum: ['OWNER', 'ADMIN', 'STAFF', 'OTHER'] })
  role!: string;

  /** Cuándo la organización la creó. */
  @ApiProperty({ type: String, format: 'date-time' })
  invitedAt!: Date;
}

/** Membresías pendientes de aceptación de la propia persona. */
export class ListMembershipInvitationsResponseDto {
  /** Pendientes, de la más reciente a la más antigua. */
  @ApiProperty({ type: [MembershipInvitationDto] })
  items!: MembershipInvitationDto[];
}

/** Resultado de aceptar o rechazar una membresía pendiente. */
export class MembershipInvitationDecisionDto {
  /** Membresía decidida. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Organización de la membresía. */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /** `ACTIVE` si aceptó; `DECLINED` si rechazó. */
  @ApiProperty({ enum: ['ACTIVE', 'DECLINED'] })
  status!: 'ACTIVE' | 'DECLINED';
}
