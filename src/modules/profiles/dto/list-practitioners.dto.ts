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
   * Si su matrícula fue verificada por la plataforma.
   *
   * Se resuelve en el servidor y no comparando el concepto en el cliente: el
   * uuid del estado no debe viajar escrito en ningún front. Es lo que la guía
   * dibuja como sello — la guía lista el padrón entero, y esto distingue a
   * quien además probó lo que declara.
   */
  @ApiProperty({ description: 'Si la matrícula fue verificada' })
  verified!: boolean;

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

/**
 * Cuántos profesionales visibles ejercen una especialidad.
 */
export class SpecialtyPractitionerCountDto {
  /**
   * La especialidad, como concepto de `VS_MEDICAL_SPECIALTY`.
   */
  @ApiProperty({ description: 'Concepto de la especialidad' })
  specialtyConceptId!: string;

  /**
   * Profesionales distintos que la ejercen hoy y que la guía muestra.
   */
  @ApiProperty({ description: 'Profesionales visibles que la ejercen' })
  practitionerCount!: number;
}

/**
 * El recuento de la guía por especialidad.
 *
 * Existe para que una portada de especialidades pueda decir cuántos hay en cada
 * una **sin traerse la guía entera**, que es lo que hacía el front: paginaba
 * hasta agotar el cursor sólo para contar. Sale de los mismos filtros que
 * `listPractitioners` —especialidad vigente y perfil visible—, así que el
 * número de una tarjeta es exactamente el largo de la lista que abre.
 */
export class ListSpecialtyCountsResponseDto {
  /**
   * Una fila por especialidad con al menos un profesional. Las que no tienen a
   * nadie **no viajan**: una tarjeta que promete y abre vacía es peor que no
   * estar.
   */
  @ApiProperty({ type: [SpecialtyPractitionerCountDto] })
  items!: SpecialtyPractitionerCountDto[];

  /**
   * Profesionales visibles en total, sin repetir a quien tiene varias
   * especialidades. No es la suma de `items`: esa cuenta a cada uno tantas
   * veces como especialidades ejerza.
   */
  @ApiProperty({ description: 'Profesionales visibles, sin repetir' })
  practitionerTotal!: number;

  /**
   * Cuántos no declaran **ninguna** especialidad vigente.
   *
   * Existe porque son alcanzables sólo si la portada los ofrece: quien entra
   * por especialidad no llega nunca a quien no tiene ninguna. Hoy son casi
   * trescientos —todo el que se registra solo nace así— e incluyen a los
   * médicos con cuenta, que son justamente los que atienden por la app.
   */
  @ApiProperty({ description: 'Visibles sin ninguna especialidad vigente' })
  withoutSpecialtyCount!: number;
}
