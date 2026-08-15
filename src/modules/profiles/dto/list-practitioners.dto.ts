import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Una especialidad en la fila de la guía — lo justo para agrupar y rotular.
 *
 * El detalle (alcance, certificación, vigencias) vive en el summary del
 * perfil: la guía sólo necesita saber bajo qué encabezado va cada doctor.
 */
export class PractitionerListSpecialtyDto {
  /**
   * Especialidad ejercida.
   */
  @ApiProperty({ format: 'uuid', description: 'Concept id de la especialidad' })
  specialtyConceptId!: string;

  /**
   * Si es la especialidad con la que se presenta.
   */
  @ApiProperty()
  isPrimary!: boolean;
}

/**
 * Una fila de la guía de profesionales (carril R2-1).
 *
 * Datos profesionales de presentación, nunca PHI: es lo que una guía
 * telefónica publica de cada médico. El teléfono de contacto NO está — el
 * modelo no declara un teléfono profesional con marca de visibilidad, y
 * derivarlo de los datos de la persona publicaría un dato personal
 * (bloqueador anotado en COORDINACION-AGENTES.md, no se inventa la columna).
 */
export class PractitionerListItemDto {
  /**
   * Con este id se abre la ficha (`GET /profiles/practitioners/:id/summary`).
   */
  @ApiProperty({ format: 'uuid' })
  profileId!: string;

  /**
   * Código profesional visible.
   */
  @ApiProperty({ description: 'Código único del profesional' })
  practitionerCode!: string;

  /**
   * Nombre para mostrar.
   */
  @ApiPropertyOptional({ description: 'Nombre visible de la persona' })
  displayName?: string;

  /**
   * Título profesional declarado.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  professionalTitle?: string;

  /**
   * Foto de perfil, si la hay.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Archivo de la foto' })
  photoFileId?: string;

  /**
   * Estado de verificación de la matrícula.
   */
  @ApiProperty({ format: 'uuid' })
  verificationStatusConceptId!: string;

  /**
   * Si declara tomar pacientes nuevos.
   */
  @ApiProperty()
  acceptsNewPatients!: boolean;

  /**
   * Si atiende por telemedicina.
   */
  @ApiProperty()
  telehealthAvailable!: boolean;

  /**
   * Sus especialidades, la principal primero.
   */
  @ApiProperty({ type: [PractitionerListSpecialtyDto] })
  specialties!: PractitionerListSpecialtyDto[];
}

/**
 * Página de la guía de profesionales.
 */
export class ListPractitionersResponseDto {
  /**
   * Las filas de esta página.
   */
  @ApiProperty({ type: [PractitionerListItemDto] })
  items!: PractitionerListItemDto[];

  /**
   * Cantidad devuelta en esta página.
   */
  @ApiProperty({ description: 'Cantidad devuelta en esta página' })
  count!: number;

  /**
   * Tope aplicado.
   */
  @ApiProperty({ description: 'Tope de resultados aplicado' })
  limit!: number;

  /**
   * Cursor de continuación, o `null` en la última página.
   */
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Cursor opaco de la página siguiente; null si no hay más',
  })
  nextCursor!: string | null;
}
