import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta al crear y vincular una secretaria de inmediato. */
export class CreatedSupportStaffViewDto {
  /** Cuenta de usuario creada o vinculada. */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /** Persona de la secretaria. */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /** Perfil de secretaria (`profiles.secretary_profiles.profile_id`). */
  @ApiProperty({ format: 'uuid' })
  supportProfileId!: string;

  /** ID del vínculo de apoyo (`practitioner_support_assignment` u `organization_user_assignment`). */
  @ApiProperty({ format: 'uuid' })
  linkId!: string;

  /** Estado del vínculo creado (siempre ACTIVE). */
  @ApiProperty({ example: 'ACTIVE' })
  status!: 'ACTIVE';

  /** Nombre del hospital u organización vinculada. */
  @ApiPropertyOptional()
  organizationName?: string;
}
