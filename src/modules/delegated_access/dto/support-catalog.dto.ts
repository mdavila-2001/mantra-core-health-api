import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/** Consulta de `GET /me/support-catalog`: la organización cuyo catálogo se pide. */
export class SupportCatalogQueryDto {
  /** Organización. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  org!: string;
}

/** Dónde y de qué atiende un doctor: un espacio con un servicio. */
export class CatalogPlacementDto {
  /** Espacio de atención. */
  @ApiPropertyOptional({ format: 'uuid' }) careSpaceId?: string;
  /** Servicio que presta en ese espacio. */
  @ApiPropertyOptional({ format: 'uuid' }) healthcareServiceId?: string;
}

/** Doctor del catálogo: una asignación de rol, la que se nombra en un permiso. */
export class CatalogDoctorDto {
  /** Asignación de rol del doctor (lo que se nombra en un permiso). */
  @ApiProperty({ format: 'uuid' }) practitionerRoleAssignmentId!: string;
  /** Perfil profesional del doctor (solo lo ve la administración). */
  @ApiPropertyOptional({ format: 'uuid' }) practitionerProfileId?: string;
  /** Nombre para mostrar. */
  @ApiProperty() displayName!: string;
  /** Sede de la asignación, si declara una. */
  @ApiPropertyOptional({ format: 'uuid' }) practiceSiteId?: string;
  /** Combinaciones espacio ↔ servicio en las que atiende, para no cruzarlas. */
  @ApiProperty({ type: [CatalogPlacementDto] })
  placements!: CatalogPlacementDto[];
}

/** Servicio del catálogo. */
export class CatalogServiceDto {
  /** Servicio de la organización. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Nombre del servicio. */
  @ApiProperty() name!: string;
  /** Sede donde se presta, si es de una. */
  @ApiPropertyOptional({ format: 'uuid' }) practiceSiteId?: string;
}

/** Ubicación del catálogo: una sede o un espacio. */
export class CatalogLocationDto {
  /** Sede o espacio. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Si es una sede o un espacio de atención. */
  @ApiProperty({ enum: ['SITE', 'SPACE'] }) kind!: 'SITE' | 'SPACE';
  /** Nombre. */
  @ApiProperty() name!: string;
  /** Código. */
  @ApiProperty() code!: string;
  /** Padre: la sede o el espacio que lo contiene. */
  @ApiPropertyOptional({ format: 'uuid' }) parentId?: string;
  /** Sede a la que pertenece. */
  @ApiProperty({ format: 'uuid' }) practiceSiteId!: string;
}

/** Respuesta de los catálogos de apoyo: lo que se puede nombrar en un permiso. */
export class SupportCatalogResponseDto {
  /** Organización del catálogo. */
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  /** Doctores, cada uno con sus combinaciones espacio ↔ servicio. */
  @ApiProperty({ type: [CatalogDoctorDto] }) doctors!: CatalogDoctorDto[];
  /** Servicios. */
  @ApiProperty({ type: [CatalogServiceDto] }) services!: CatalogServiceDto[];
  /** Sedes y espacios. */
  @ApiProperty({ type: [CatalogLocationDto] })
  locations!: CatalogLocationDto[];
}
