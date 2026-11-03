import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Un establecimiento del padrón oficial, tal como se le ofrece al profesional
 * que busca dónde declara que trabaja.
 *
 * ## Por qué el municipio no es decoración
 *
 * El padrón repite nombres: hay cuatro «SAN LUIS», tres «EL CARMEN», tres
 * «SAN PEDRO». Son centros distintos en municipios distintos —EL TORNO, SANTA
 * CRUZ DE LA SIERRA, SANTA ROSA DEL SARA, URUBICHA—, y el nombre solo no los
 * separa. Una lista que omitiera el municipio le mostraría al médico cuatro
 * opciones idénticas y lo obligaría a elegir a ciegas, que es exactamente el
 * problema que este endpoint viene a resolver.
 */
export class LinkableOrganizationDto {
  /**
   * El concepto del establecimiento en el catálogo.
   *
   * Es lo que se guardará como vínculo estructurado cuando
   * `practitioner_affiliations` tenga columna donde anotarlo. Hasta entonces
   * viaja igual: el cliente lo necesita para distinguir dos homónimos, y el
   * contrato no cambia cuando la columna exista.
   */
  @ApiProperty({ format: 'uuid' })
  facilityConceptId!: string;

  /** Código estable del establecimiento en el padrón. */
  @ApiProperty({ example: 'BO_EST_CLINICA_FOIANINI' })
  code!: string;

  /**
   * El nombre canónico, el del padrón.
   *
   * Es el valor que conviene guardar en `organization_name`: mientras cada
   * médico escriba el nombre a mano, «CLINICA FOIANINI», «Clínica Ángel
   * Foianini» y «Centro Médico Foianini» son tres instituciones distintas para
   * el sistema, y son una sola en la realidad.
   */
  @ApiProperty({ example: 'CLINICA FOIANINI' })
  name!: string;

  /** Municipio donde está; lo que separa a los homónimos. */
  @ApiPropertyOptional({ type: String, nullable: true })
  municipality!: string | null;

  /** `CLINICA_PRIVADA`, `HOSPITAL`, `CAJA_SALUD`, `CENTRO_SALUD`, … */
  @ApiPropertyOptional({ type: String, nullable: true })
  type!: string | null;

  /** Dirección declarada en el padrón, cuando la trae. */
  @ApiPropertyOptional({ type: String, nullable: true })
  address!: string | null;
}

/**
 * Resultado de la búsqueda de establecimientos.
 *
 * Sin cursor, igual que `SearchConceptsResponseDto`: esto alimenta un
 * autocompletar, donde quien busca refina el texto en vez de pasar de página.
 */
export class ListLinkableOrganizationsResponseDto {
  /** Los establecimientos que coinciden. */
  @ApiProperty({ type: [LinkableOrganizationDto] })
  items!: LinkableOrganizationDto[];

  /** Cantidad devuelta. */
  @ApiProperty({ description: 'Cantidad devuelta' })
  count!: number;

  /** Tope aplicado. */
  @ApiProperty({ description: 'Tope de resultados aplicado' })
  limit!: number;
}
